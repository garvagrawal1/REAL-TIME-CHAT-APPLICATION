const Room = require('../models/Room');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Get all public chat rooms
 * @route   GET /api/rooms
 * @access  Private
 */
const getRooms = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = { isPrivate: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const rooms = await Room.find(query)
      .populate('createdBy', 'name username avatar')
      .populate('members', 'name username avatar status')
      .sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new chat room
 * @route   POST /api/rooms
 * @access  Private
 */
const createRoom = async (req, res, next) => {
  try {
    const { name, description, topic, isPrivate, icon } = req.body;

    const existingRoom = await Room.findOne({ name: name.trim() });
    if (existingRoom) {
      return next(new ErrorResponse('A room with this name already exists.', 400));
    }

    const room = await Room.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      topic: topic ? topic.trim() : '',
      createdBy: req.user._id,
      members: [req.user._id],
      isPrivate: Boolean(isPrivate),
      icon: icon || 'Hash',
    });

    await room.populate('createdBy', 'name username avatar');
    await room.populate('members', 'name username avatar status');

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single room details
 * @route   GET /api/rooms/:roomId
 * @access  Private
 */
const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate('createdBy', 'name username avatar')
      .populate('members', 'name username avatar status lastSeen');

    if (!room) {
      return next(new ErrorResponse('Room not found', 404));
    }

    res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Join a chat room
 * @route   POST /api/rooms/:roomId/join
 * @access  Private
 */
const joinRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) {
      return next(new ErrorResponse('Room not found', 404));
    }

    const userId = req.user._id;
    if (!room.members.includes(userId)) {
      room.members.push(userId);
      await room.save();
    }

    await room.populate('createdBy', 'name username avatar');
    await room.populate('members', 'name username avatar status');

    res.status(200).json({
      success: true,
      message: `Joined room #${room.name}`,
      room,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Leave a chat room
 * @route   POST /api/rooms/:roomId/leave
 * @access  Private
 */
const leaveRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) {
      return next(new ErrorResponse('Room not found', 404));
    }

    if (room.isDefault) {
      return next(new ErrorResponse('You cannot leave default public rooms.', 400));
    }

    room.members = room.members.filter(
      (memberId) => memberId.toString() !== req.user._id.toString()
    );
    await room.save();

    res.status(200).json({
      success: true,
      message: `Left room #${room.name}`,
      room,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRooms,
  createRoom,
  getRoomById,
  joinRoom,
  leaveRoom,
};
