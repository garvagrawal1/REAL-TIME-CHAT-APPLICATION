import React, { createContext, useState, useEffect, useCallback, useRef, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { initSocket, disconnectSocket, getSocket } from '../socket/socket';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user, isAuthenticated } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connected' | 'reconnecting' | 'disconnected'
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [roomOnlineCount, setRoomOnlineCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState([]);
  const [toasts, setToasts] = useState([]);

  const currentRoomIdRef = useRef(null);

  // Toast notification helper
  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, ...toast };
    setToasts((prev) => [...prev.slice(-4), newToast]); // Keep max 5 toasts

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Connect socket on authentication
  useEffect(() => {
    if (isAuthenticated && token) {
      const s = initSocket(token);
      setSocket(s);

      s.on('connect', () => {
        setConnectionStatus('connected');
        console.log('[Socket] Connected to server. Socket ID:', s.id);

        // Auto-join active room if set
        if (currentRoomIdRef.current) {
          s.emit('joinRoom', { roomId: currentRoomIdRef.current });
        }
      });

      s.on('disconnect', (reason) => {
        setConnectionStatus('disconnected');
        console.log('[Socket] Disconnected:', reason);
      });

      s.on('reconnect_attempt', () => {
        setConnectionStatus('reconnecting');
      });

      s.on('reconnect', () => {
        setConnectionStatus('connected');
        if (currentRoomIdRef.current) {
          s.emit('joinRoom', { roomId: currentRoomIdRef.current });
        }
        addToast({ type: 'info', message: 'Reconnected to chat server' });
      });

      s.on('connect_error', (error) => {
        setConnectionStatus('disconnected');
        console.error('[Socket Error]:', error.message);
      });

      // Online presence listeners
      s.on('onlineUsers', (userIds) => {
        setOnlineUsers(new Set(userIds));
      });

      s.on('userOnline', ({ userId }) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          updated.add(String(userId));
          return updated;
        });
      });

      s.on('userOffline', ({ userId }) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(String(userId));
          return updated;
        });
      });

      s.on('roomOnlineCount', ({ count }) => {
        setRoomOnlineCount(count);
      });

      s.on('typingUpdate', ({ typingUsers: users }) => {
        setTypingUsers(users || []);
      });

      // In-app notifications
      s.on('roomMessageNotification', ({ roomName, senderName, content }) => {
        addToast({
          type: 'message',
          title: `#${roomName}`,
          message: `${senderName}: ${content}`,
        });
      });

      s.on('notification', ({ message }) => {
        addToast({ type: 'info', message });
      });

      return () => {
        disconnectSocket();
        setSocket(null);
        setConnectionStatus('disconnected');
      };
    } else {
      disconnectSocket();
      setSocket(null);
      setConnectionStatus('disconnected');
      setOnlineUsers(new Set());
    }
  }, [isAuthenticated, token, addToast]);

  // Socket actions
  const joinRoom = useCallback(
    (roomId) => {
      if (!roomId) return;
      currentRoomIdRef.current = String(roomId);
      setTypingUsers([]);

      const activeSocket = getSocket();
      if (activeSocket && activeSocket.connected) {
        activeSocket.emit('joinRoom', { roomId: String(roomId) });
      }
    },
    []
  );

  const leaveRoom = useCallback(
    (roomId) => {
      if (!roomId) return;
      if (currentRoomIdRef.current === String(roomId)) {
        currentRoomIdRef.current = null;
      }
      const activeSocket = getSocket();
      if (activeSocket && activeSocket.connected) {
        activeSocket.emit('leaveRoom', { roomId: String(roomId) });
      }
    },
    []
  );

  const sendMessage = useCallback(
    (roomId, content, messageType = 'text') => {
      return new Promise((resolve, reject) => {
        const activeSocket = getSocket();
        if (!activeSocket || !activeSocket.connected) {
          reject(new Error('Socket not connected'));
          return;
        }

        activeSocket.emit('sendMessage', { roomId, content, messageType }, (response) => {
          if (response && response.success) {
            resolve(response.message);
          } else {
            reject(new Error(response?.error || 'Failed to send message'));
          }
        });
      });
    },
    []
  );

  const emitTyping = useCallback(
    (roomId) => {
      const activeSocket = getSocket();
      if (activeSocket && activeSocket.connected && roomId) {
        activeSocket.emit('typing', { roomId });
      }
    },
    []
  );

  const emitStopTyping = useCallback(
    (roomId) => {
      const activeSocket = getSocket();
      if (activeSocket && activeSocket.connected && roomId) {
        activeSocket.emit('stopTyping', { roomId });
      }
    },
    []
  );

  const deleteMessage = useCallback(
    (messageId, roomId) => {
      return new Promise((resolve, reject) => {
        const activeSocket = getSocket();
        if (!activeSocket || !activeSocket.connected) {
          reject(new Error('Socket is not connected'));
          return;
        }

        activeSocket.emit('deleteMessage', { messageId, roomId }, (response) => {
          if (response && response.success) {
            resolve();
          } else {
            reject(new Error(response?.error || 'Failed to delete message'));
          }
        });
      });
    },
    []
  );

  const value = {
    socket,
    connectionStatus,
    onlineUsers,
    roomOnlineCount,
    typingUsers,
    toasts,
    addToast,
    removeToast,
    joinRoom,
    leaveRoom,
    sendMessage,
    emitTyping,
    emitStopTyping,
    deleteMessage,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
