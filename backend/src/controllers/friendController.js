const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Room = require('../models/Room');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Helper: Extract unique String IDs from any array of ObjectIds or Objects
 */
const extractIdStrings = (arr) => {
  if (!arr || !Array.isArray(arr)) return [];
  return arr.map((item) => String(item?._id || item)).filter(Boolean);
};

/**
 * @desc    Get user's friends list (Combines User.friends + accepted FriendRequests)
 * @route   GET /api/friends
 * @access  Private
 */
const getFriends = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Fetch user with populated friends
    const currentUser = await User.findById(userId).populate(
      'friends',
      'name username email avatar status lastSeen bio'
    );

    let friendsList = (currentUser?.friends || []).filter(Boolean);
    const friendIdsSet = new Set(friendsList.map((f) => String(f._id)));

    // 2. Also check any FriendRequest with status: 'accepted' to guarantee zero missed friends
    const acceptedRequests = await FriendRequest.find({
      $or: [{ sender: userId }, { recipient: userId }],
      status: 'accepted',
    }).populate('sender recipient', 'name username email avatar status lastSeen bio');

    for (const reqItem of acceptedRequests) {
      const otherUser =
        String(reqItem.sender?._id || reqItem.sender) === String(userId)
          ? reqItem.recipient
          : reqItem.sender;

      if (otherUser && otherUser._id && !friendIdsSet.has(String(otherUser._id))) {
        friendsList.push(otherUser);
        friendIdsSet.add(String(otherUser._id));
        // Sync back to User document
        await User.findByIdAndUpdate(userId, { $addToSet: { friends: otherUser._id } });
      }
    }

    res.status(200).json({
      success: true,
      friends: friendsList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get incoming and outgoing friend requests
 * @route   GET /api/friends/requests
 * @access  Private
 */
const getFriendRequests = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const incoming = await FriendRequest.find({
      recipient: userId,
      status: 'pending',
    }).populate('sender', 'name username avatar bio');

    const outgoing = await FriendRequest.find({
      sender: userId,
      status: 'pending',
    }).populate('recipient', 'name username avatar bio');

    res.status(200).json({
      success: true,
      incoming: incoming.filter((r) => r.sender), // Filter out deleted accounts
      outgoing: outgoing.filter((r) => r.recipient),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send a friend request to a user
 * @route   POST /api/friends/request/:targetUserId
 * @access  Private
 */
const sendFriendRequest = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const { targetUserId } = req.params;

    if (String(senderId) === String(targetUserId)) {
      return next(new ErrorResponse('You cannot send a friend request to yourself.', 400));
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return next(new ErrorResponse('User not found.', 404));
    }

    // Check if already friends in User document
    const currentUser = await User.findById(senderId);
    const friendIds = extractIdStrings(currentUser?.friends);
    if (friendIds.includes(String(targetUserId))) {
      return res.status(200).json({
        success: true,
        message: `You are already friends with ${targetUser.name}!`,
        isFriends: true,
      });
    }

    // Check existing request in either direction
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, recipient: targetUserId },
        { sender: targetUserId, recipient: senderId },
      ],
    });

    if (existingRequest) {
      if (existingRequest.status === 'accepted') {
        // Ensure both users have each other in friends array
        await User.findByIdAndUpdate(senderId, { $addToSet: { friends: targetUserId } });
        await User.findByIdAndUpdate(targetUserId, { $addToSet: { friends: senderId } });

        return res.status(200).json({
          success: true,
          message: `You are already friends with ${targetUser.name}!`,
          isFriends: true,
        });
      }

      if (existingRequest.status === 'pending') {
        if (String(existingRequest.sender) === String(senderId)) {
          return res.status(200).json({
            success: true,
            message: 'Friend request already sent and pending.',
            request: existingRequest,
          });
        } else {
          // If the target user had sent us a request, auto-accept it!
          existingRequest.status = 'accepted';
          await existingRequest.save();

          await User.findByIdAndUpdate(senderId, { $addToSet: { friends: targetUserId } });
          await User.findByIdAndUpdate(targetUserId, { $addToSet: { friends: senderId } });

          return res.status(200).json({
            success: true,
            message: `You are now friends with ${targetUser.name}!`,
            request: existingRequest,
            autoAccepted: true,
          });
        }
      }

      // If rejected earlier, reactivate to pending
      existingRequest.sender = senderId;
      existingRequest.recipient = targetUserId;
      existingRequest.status = 'pending';
      await existingRequest.save();

      return res.status(200).json({
        success: true,
        message: `Friend request sent to ${targetUser.name}!`,
        request: existingRequest,
      });
    }

    // Create new pending request
    const newRequest = await FriendRequest.create({
      sender: senderId,
      recipient: targetUserId,
      status: 'pending',
    });

    await newRequest.populate('recipient', 'name username avatar');

    res.status(201).json({
      success: true,
      message: `Friend request sent to ${targetUser.name}!`,
      request: newRequest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Accept a friend request (By RequestId OR TargetUserId)
 * @route   POST /api/friends/accept/:requestId
 * @access  Private
 */
const acceptFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    // Support lookup by either FriendRequest._id OR target User._id
    let request = await FriendRequest.findById(requestId);

    if (!request) {
      // Try finding pending request where sender is requestId and recipient is current user
      request = await FriendRequest.findOne({
        sender: requestId,
        recipient: userId,
        status: 'pending',
      });
    }

    if (!request) {
      return next(new ErrorResponse('Friend request not found.', 404));
    }

    if (String(request.recipient) !== String(userId)) {
      return next(new ErrorResponse('Not authorized to accept this request.', 403));
    }

    request.status = 'accepted';
    await request.save();

    // Add each other to mutual friends list
    await User.findByIdAndUpdate(userId, { $addToSet: { friends: request.sender } });
    await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: userId } });

    const senderUser = await User.findById(request.sender).select('name username avatar status');

    res.status(200).json({
      success: true,
      message: `You are now friends with ${senderUser?.name || 'User'}!`,
      friend: senderUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject / Cancel / Delete a friend request or unfriend
 * @route   POST /api/friends/reject/:requestId
 * @access  Private
 */
const rejectFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    // Check if requestId is a FriendRequest ID or a User ID to unfriend
    let request = await FriendRequest.findById(requestId);

    if (!request) {
      request = await FriendRequest.findOne({
        $or: [
          { sender: userId, recipient: requestId },
          { sender: requestId, recipient: userId },
        ],
      });
    }

    if (request) {
      await request.deleteOne();
    }

    // Also remove from mutual friends arrays if they were friends
    const targetUserId = request
      ? String(request.sender) === String(userId)
        ? request.recipient
        : request.sender
      : requestId;

    await User.findByIdAndUpdate(userId, { $pull: { friends: targetUserId } });
    await User.findByIdAndUpdate(targetUserId, { $pull: { friends: userId } });

    res.status(200).json({
      success: true,
      message: 'Friend relationship removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search users with live friendship status tags
 * @route   GET /api/friends/search
 * @access  Private
 */
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user._id;

    let userQuery = { _id: { $ne: currentUserId } };

    if (q && q.trim()) {
      userQuery.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { username: { $regex: q.trim(), $options: 'i' } },
        { email: { $regex: q.trim(), $options: 'i' } },
      ];
    }

    const users = await User.find(userQuery)
      .select('name username avatar status bio lastSeen')
      .limit(50);

    // Fetch all requests involving current user (both pending and accepted)
    const allRequests = await FriendRequest.find({
      $or: [{ sender: currentUserId }, { recipient: currentUserId }],
    });

    const currentUser = await User.findById(currentUserId).select('friends');
    const friendsSet = new Set(extractIdStrings(currentUser?.friends));

    // Also add any users with accepted requests into friendsSet
    allRequests
      .filter((r) => r.status === 'accepted')
      .forEach((r) => {
        const otherId =
          String(r.sender) === String(currentUserId) ? String(r.recipient) : String(r.sender);
        friendsSet.add(otherId);
      });

    const results = users.map((u) => {
      const uId = String(u._id);
      let relationship = 'none';
      let requestId = null;

      if (friendsSet.has(uId)) {
        relationship = 'friends';
      } else {
        const reqItem = allRequests.find(
          (r) =>
            r.status === 'pending' &&
            ((String(r.sender) === String(currentUserId) && String(r.recipient) === uId) ||
              (String(r.recipient) === String(currentUserId) && String(r.sender) === uId))
        );

        if (reqItem) {
          requestId = reqItem._id;
          relationship =
            String(reqItem.sender) === String(currentUserId)
              ? 'pending_sent'
              : 'pending_received';
        }
      }

      return {
        _id: u._id,
        name: u.name,
        username: u.username,
        avatar: u.avatar,
        status: u.status,
        bio: u.bio,
        relationship,
        requestId,
      };
    });

    res.status(200).json({
      success: true,
      users: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Find or create 1-on-1 direct message room
 * @route   POST /api/friends/dm/:friendId
 * @access  Private
 */
const getOrCreateDM = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { friendId } = req.params;

    if (String(currentUserId) === String(friendId)) {
      return next(new ErrorResponse('Cannot create direct chat with yourself.', 400));
    }

    const friend = await User.findById(friendId).select('name username avatar status lastSeen');
    if (!friend) {
      return next(new ErrorResponse('User not found.', 404));
    }

    // Sort IDs deterministically to create unique DM room name
    const sortedIds = [String(currentUserId), String(friendId)].sort();
    const dmRoomName = `dm_${sortedIds[0]}_${sortedIds[1]}`;

    let room = await Room.findOne({ name: dmRoomName });

    if (!room) {
      room = await Room.create({
        name: dmRoomName,
        description: `Direct message between ${req.user.name} and ${friend.name}`,
        topic: `Private 1-on-1 conversation`,
        createdBy: currentUserId,
        members: [currentUserId, friendId],
        isPrivate: true,
        isDirect: true,
        icon: 'MessageSquare',
      });
    }

    await room.populate('members', 'name username avatar status lastSeen bio');

    res.status(200).json({
      success: true,
      room,
      friend,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  searchUsers,
  getOrCreateDM,
};
