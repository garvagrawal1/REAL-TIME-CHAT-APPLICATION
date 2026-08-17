const Message = require('../models/Message');
const Room = require('../models/Room');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Get paginated messages for a room
 * @route   GET /api/messages/:roomId
 * @access  Private
 */
const getMessagesByRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const before = req.query.before; // ISO date timestamp for cursor pagination

    // Verify room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return next(new ErrorResponse('Room not found', 404));
    }

    const query = { room: roomId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Fetch messages sorted newest first, then reverse for display
    const rawMessages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'name username avatar');

    const messages = rawMessages.reverse();

    // Check if there are older messages available
    const oldestInBatch = messages.length > 0 ? messages[0].createdAt : null;
    let hasMore = false;
    if (oldestInBatch) {
      const olderCount = await Message.countDocuments({
        room: roomId,
        createdAt: { $lt: oldestInBatch },
      });
      hasMore = olderCount > 0;
    }

    res.status(200).json({
      success: true,
      count: messages.length,
      hasMore,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send a message to a room (REST fallback endpoint)
 * @route   POST /api/messages/:roomId
 * @access  Private
 */
const createMessage = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { content, messageType } = req.body;

    if (!content || !content.trim()) {
      return next(new ErrorResponse('Message content cannot be empty', 400));
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return next(new ErrorResponse('Room not found', 404));
    }

    const message = await Message.create({
      room: roomId,
      sender: req.user._id,
      content: content.trim(),
      messageType: messageType || 'text',
    });

    await message.populate('sender', 'name username avatar');

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a message
 * @route   DELETE /api/messages/:messageId
 * @access  Private
 */
const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return next(new ErrorResponse('Message not found', 404));
    }

    // Only sender or admin can delete
    if (message.sender.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse('Not authorized to delete this message', 403));
    }

    await message.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessagesByRoom,
  createMessage,
  deleteMessage,
};
