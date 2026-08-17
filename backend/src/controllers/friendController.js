const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Room = require('../models/Room');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Get user's friends list
 * @route   GET /api/friends
 * @access  Private
 */
const getFriends = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'friends',
      'name username email avatar status lastSeen bio'
    );

    res.status(200).json({
      success: true,
      friends: user?.friends || [],
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
      incoming,
      outgoing,
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

    // Check if already friends
    if (req.user.friends && req.user.friends.includes(targetUserId)) {
      return next(new ErrorResponse('You are already friends with this user.', 400));
    }

    // Check if a request already exists in either direction
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, recipient: targetUserId },
        { sender: targetUserId, recipient: senderId },
      ],
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        if (String(existingRequest.sender) === String(senderId)) {
          return next(new ErrorResponse('Friend request already sent.', 400));
        } else {
          // If they sent us a request, auto-accept it!
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
      } else if (existingRequest.status === 'accepted') {
        return next(new ErrorResponse('You are already friends with this user.', 400));
      }
    }

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
 * @desc    Accept a friend request
 * @route   POST /api/friends/accept/:requestId
 * @access  Private
 */
const acceptFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);
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
 * @desc    Reject / Cancel a friend request
 * @route   POST /api/friends/reject/:requestId
 * @access  Private
 */
const rejectFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);
    if (!request) {
      return next(new ErrorResponse('Friend request not found.', 404));
    }

    if (
      String(request.recipient) !== String(userId) &&
      String(request.sender) !== String(userId)
    ) {
      return next(new ErrorResponse('Not authorized to modify this request.', 403));
    }

    await request.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Friend request removed.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search users with friendship status tags
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
      .limit(30);

    // Fetch active requests involving current user
    const pendingRequests = await FriendRequest.find({
      $or: [{ sender: currentUserId }, { recipient: currentUserId }],
      status: 'pending',
    });

    const currentUser = await User.findById(currentUserId).select('friends');
    const friendsSet = new Set((currentUser?.friends || []).map((id) => String(id)));

    const results = users.map((u) => {
      const uId = String(u._id);
      let relationship = 'none';
      let requestId = null;

      if (friendsSet.has(uId)) {
        relationship = 'friends';
      } else {
        const reqItem = pendingRequests.find(
          (r) =>
            (String(r.sender) === String(currentUserId) && String(r.recipient) === uId) ||
            (String(r.recipient) === String(currentUserId) && String(r.sender) === uId)
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
