const { verifyTokenDirect } = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');

// Active socket tracking for multi-tab presence
// userId -> Set of active socket IDs
const userSockets = new Map();
// socketId -> userId
const socketUserMap = new Map();
// socketId -> current active roomId
const socketRoomMap = new Map();
// roomId -> Map<userId, { name, username }>
const roomTypingMap = new Map();
// roomId -> latest Watch Party state
const roomWatchPartyMap = new Map();

/**
 * Get all unique online user IDs
 */
const getOnlineUserIds = () => {
  return Array.from(userSockets.keys());
};

/**
 * Helper: Send socket event to all active sockets of a specific user
 */
const emitToUser = (io, targetUserId, eventName, payload) => {
  const sockets = userSockets.get(String(targetUserId));
  if (sockets) {
    for (const socketId of sockets) {
      io.to(socketId).emit(eventName, payload);
    }
  }
};

/**
 * Initialize Socket.io Server Handlers
 * @param {import('socket.io').Server} io
 */
const initSocketHandler = (io) => {
  // 1. Socket.io Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const user = await verifyTokenDirect(token);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach verified user to socket instance
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error(`Authentication error: ${err.message}`));
    }
  });

  // 2. Connection Handler
  io.on('connection', async (socket) => {
    const user = socket.user;
    const userId = user._id.toString();

    socketUserMap.set(socket.id, userId);

    // Track multi-tab socket connections
    const isFirstConnection = !userSockets.has(userId) || userSockets.get(userId).size === 0;

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    console.log(`[Socket Connected] User ${user.username} (${user.name}) on socket ${socket.id}. Active tabs: ${userSockets.get(userId).size}`);

    // If this is the user's first tab/connection, broadcast online status
    if (isFirstConnection) {
      try {
        await User.findByIdAndUpdate(userId, { status: 'online', lastSeen: new Date() });
      } catch (err) {
        console.error('Failed to update user status:', err.message);
      }

      io.emit('userOnline', {
        userId,
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          status: 'online',
        },
      });
    }

    // Send current list of online users to the newly connected client
    socket.emit('onlineUsers', getOnlineUserIds());

    // 3. Join Room Event
    socket.on('joinRoom', async ({ roomId }) => {
      try {
        if (!roomId) return;
        const targetRoom = String(roomId);

        // Leave previous room if any
        const previousRoom = socketRoomMap.get(socket.id);
        if (previousRoom && previousRoom !== targetRoom) {
          socket.leave(previousRoom);
          clearUserTyping(previousRoom, userId, io);
        }

        socket.join(targetRoom);
        socketRoomMap.set(socket.id, targetRoom);

        // Ensure user is added to room members in DB if not already
        await Room.findByIdAndUpdate(targetRoom, {
          $addToSet: { members: user._id },
        });

        // Broadcast updated room online users
        broadcastRoomUsers(io, targetRoom);

        // Send current watch party state if active
        if (roomWatchPartyMap.has(targetRoom)) {
          socket.emit('watchPartyUpdate', roomWatchPartyMap.get(targetRoom));
        }

        console.log(`[Socket Room] ${user.username} joined room ${targetRoom}`);
      } catch (err) {
        socket.emit('socketError', { message: `Failed to join room: ${err.message}` });
      }
    });

    // 4. Leave Room Event
    socket.on('leaveRoom', async ({ roomId }) => {
      try {
        if (!roomId) return;
        const targetRoom = String(roomId);

        socket.leave(targetRoom);
        socketRoomMap.delete(socket.id);
        clearUserTyping(targetRoom, userId, io);

        broadcastRoomUsers(io, targetRoom);
      } catch (err) {
        socket.emit('socketError', { message: `Failed to leave room: ${err.message}` });
      }
    });

    // 5. Send Message Event (Real-Time WebSocket Message Pipeline)
    socket.on('sendMessage', async ({ roomId, content, messageType = 'text' }, callback) => {
      try {
        if (!roomId || !content || !content.trim()) {
          if (callback) callback({ success: false, error: 'Room and content are required' });
          return;
        }

        const trimmedContent = content.trim();
        if (trimmedContent.length > 3000) {
          if (callback) callback({ success: false, error: 'Message exceeds maximum length of 3000 characters' });
          return;
        }

        // Verify room exists
        const room = await Room.findById(roomId);
        if (!room) {
          if (callback) callback({ success: false, error: 'Room does not exist' });
          return;
        }

        // Persist message in MongoDB
        const message = await Message.create({
          room: roomId,
          sender: user._id,
          content: trimmedContent,
          messageType,
        });

        await message.populate('sender', 'name username avatar');

        // Ensure current socket is joined to room
        socket.join(String(roomId));

        // Broadcast to ALL clients in this room (including sender)
        io.to(String(roomId)).emit('receiveMessage', message);

        // Notify other room members outside if they're browsing other channels
        socket.broadcast.emit('roomMessageNotification', {
          roomId: String(roomId),
          roomName: room.name,
          messageId: message._id,
          senderName: user.name,
          content: trimmedContent.substring(0, 80),
        });

        // Clear typing indicator for this user in this room
        clearUserTyping(String(roomId), userId, io);

        if (callback) {
          callback({ success: true, message });
        }
      } catch (err) {
        console.error('[Socket Message Error]:', err.message);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // 6. Typing Indicators
    socket.on('typing', ({ roomId }) => {
      if (!roomId) return;
      const targetRoom = String(roomId);

      if (!roomTypingMap.has(targetRoom)) {
        roomTypingMap.set(targetRoom, new Map());
      }
      const roomTyping = roomTypingMap.get(targetRoom);
      roomTyping.set(userId, { name: user.name, username: user.username });

      // Broadcast list of typing users to others in the room
      socket.to(targetRoom).emit('typingUpdate', {
        roomId: targetRoom,
        typingUsers: Array.from(roomTyping.values()),
      });
    });

    socket.on('stopTyping', ({ roomId }) => {
      if (!roomId) return;
      clearUserTyping(String(roomId), userId, io);
    });

    // 7. Message Deletion Event
    socket.on('deleteMessage', async ({ messageId, roomId }, callback) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) {
          if (callback) callback({ success: false, error: 'Message not found' });
          return;
        }

        if (msg.sender.toString() !== userId) {
          if (callback) callback({ success: false, error: 'Unauthorized to delete message' });
          return;
        }

        await msg.deleteOne();
        io.to(String(roomId)).emit('messageDeleted', { messageId, roomId: String(roomId) });

        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // ==========================================
    // 8. WebRTC 1-on-1 Video & Audio Call Signaling (120 FPS High-Framerate Capable)
    // ==========================================
    socket.on('callUser', ({ userToCall, signalData, callType = 'video' }) => {
      console.log(`[WebRTC] ${user.name} is calling user ${userToCall} (${callType})`);
      emitToUser(io, userToCall, 'incomingCall', {
        signal: signalData,
        fromSocketId: socket.id,
        callerId: userId,
        callerName: user.name,
        callerUsername: user.username,
        callerAvatar: user.avatar,
        callType,
      });
    });

    socket.on('answerCall', ({ toSocketId, signalData }) => {
      console.log(`[WebRTC] Call answered by ${user.name} to socket ${toSocketId}`);
      io.to(toSocketId).emit('callAccepted', {
        signal: signalData,
        responderSocketId: socket.id,
        responderName: user.name,
      });
    });

    socket.on('iceCandidate', ({ toSocketId, candidate }) => {
      io.to(toSocketId).emit('iceCandidate', {
        candidate,
        fromSocketId: socket.id,
      });
    });

    socket.on('rejectCall', ({ toSocketId, reason = 'Call declined' }) => {
      io.to(toSocketId).emit('callRejected', {
        reason,
        fromName: user.name,
      });
    });

    socket.on('endCall', ({ toSocketId }) => {
      io.to(toSocketId).emit('callEnded', {
        fromName: user.name,
      });
    });

    // ==========================================
    // 9. Real-Time Watch Party & Media Sync
    // ==========================================
    socket.on('watchPartyAction', ({ roomId, action, currentTime, videoUrl }) => {
      if (!roomId) return;
      const targetRoom = String(roomId);
      const payload = {
        action, // 'PLAY' | 'PAUSE' | 'SEEK' | 'CHANGE_VIDEO' | 'CLOSE'
        currentTime: currentTime || 0,
        videoUrl,
        updatedBy: user.name,
        timestamp: Date.now(),
      };

      if (action === 'CLOSE') {
        roomWatchPartyMap.delete(targetRoom);
      } else {
        roomWatchPartyMap.set(targetRoom, payload);
      }

      socket.to(targetRoom).emit('watchPartyUpdate', payload);
    });

    // ==========================================
    // 10. Real-Time Collaborative Whiteboard
    // ==========================================
    socket.on('canvasDraw', ({ roomId, strokeData }) => {
      if (!roomId) return;
      socket.to(String(roomId)).emit('canvasDrawUpdate', {
        strokeData,
        user: { id: userId, name: user.name },
      });
    });

    socket.on('canvasClear', ({ roomId }) => {
      if (!roomId) return;
      socket.to(String(roomId)).emit('canvasClearUpdate', {
        clearedBy: user.name,
      });
    });

    socket.on('canvasCursor', ({ roomId, x, y }) => {
      if (!roomId) return;
      socket.to(String(roomId)).emit('canvasCursorUpdate', {
        userId,
        userName: user.name,
        x,
        y,
      });
    });

    // ==========================================
    // 11. Real-Time Multiplayer Games Engine
    // ==========================================
    socket.on('inviteGame', ({ opponentId, gameType, roomId }) => {
      emitToUser(io, opponentId, 'gameInvitation', {
        challengerId: userId,
        challengerName: user.name,
        challengerAvatar: user.avatar,
        gameType,
        roomId: String(roomId),
      });
    });

    socket.on('respondGameInvite', ({ challengerId, accepted, gameType, roomId }) => {
      emitToUser(io, challengerId, 'gameInviteResponse', {
        opponentId: userId,
        opponentName: user.name,
        accepted,
        gameType,
        roomId: String(roomId),
      });
    });

    socket.on('gameMove', ({ roomId, gameType, moveData }) => {
      if (!roomId) return;
      socket.to(String(roomId)).emit('gameMoveUpdate', {
        moveData,
        player: userId,
        playerName: user.name,
        gameType,
      });
    });

    socket.on('restartGame', ({ roomId, gameType }) => {
      if (!roomId) return;
      io.to(String(roomId)).emit('gameRestarted', {
        gameType,
        restartedBy: user.name,
      });
    });

    // ==========================================
    // 12. Real-time Friend Request Notifications
    // ==========================================
    socket.on('friendRequestSent', ({ targetUserId }) => {
      emitToUser(io, targetUserId, 'newFriendRequest', {
        senderId: userId,
        senderName: user.name,
        senderAvatar: user.avatar,
      });
    });

    socket.on('friendRequestAccepted', ({ senderId }) => {
      emitToUser(io, senderId, 'friendRequestAccepted', {
        userId,
        userName: user.name,
        userAvatar: user.avatar,
      });
    });

    // 13. Disconnect Handler
    socket.on('disconnect', async (reason) => {
      console.log(`[Socket Disconnected] User ${user.username} on socket ${socket.id}. Reason: ${reason}`);

      const currentRoom = socketRoomMap.get(socket.id);
      if (currentRoom) {
        clearUserTyping(currentRoom, userId, io);
        socketRoomMap.delete(socket.id);
        broadcastRoomUsers(io, currentRoom);
      }

      socketUserMap.delete(socket.id);

      // Remove socket from user's active set
      if (userSockets.has(userId)) {
        const userSet = userSockets.get(userId);
        userSet.delete(socket.id);

        // If user has NO more active sockets/tabs anywhere, mark offline
        if (userSet.size === 0) {
          userSockets.delete(userId);

          try {
            await User.findByIdAndUpdate(userId, {
              status: 'offline',
              lastSeen: new Date(),
            });
          } catch (err) {
            console.error('Failed to update offline status:', err.message);
          }

          // Broadcast offline event to all clients
          io.emit('userOffline', {
            userId,
            lastSeen: new Date(),
          });

          console.log(`[Presence] User ${user.username} is now completely OFFLINE.`);
        }
      }
    });
  });
};

/**
 * Helper: Clear user typing state and emit update to room
 */
const clearUserTyping = (roomId, userId, io) => {
  if (roomTypingMap.has(roomId)) {
    const roomTyping = roomTypingMap.get(roomId);
    if (roomTyping.has(userId)) {
      roomTyping.delete(userId);
      io.to(roomId).emit('typingUpdate', {
        roomId,
        typingUsers: Array.from(roomTyping.values()),
      });
    }
  }
};

/**
 * Helper: Broadcast online users present in a specific room
 */
const broadcastRoomUsers = (io, roomId) => {
  const roomSockets = io.sockets.adapter.rooms.get(roomId);
  const onlineInRoom = new Set();

  if (roomSockets) {
    for (const sId of roomSockets) {
      const uId = socketUserMap.get(sId);
      if (uId) onlineInRoom.add(uId);
    }
  }

  io.to(roomId).emit('roomOnlineCount', {
    roomId,
    count: onlineInRoom.size,
    userIds: Array.from(onlineInRoom),
  });
};

module.exports = {
  initSocketHandler,
  getOnlineUserIds,
};
