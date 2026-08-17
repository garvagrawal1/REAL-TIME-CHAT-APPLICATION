import { useState, useEffect, useCallback, useRef } from 'react';
import { messageService } from '../services/messageService';
import { useSocket } from './useSocket';

export const useChat = (activeRoomId) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const { socket, joinRoom, leaveRoom, sendMessage: sendSocketMessage } = useSocket();
  const activeRoomIdRef = useRef(activeRoomId);

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  // Fetch initial message history when active room changes
  useEffect(() => {
    if (!activeRoomId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const loadMessages = async () => {
      try {
        const data = await messageService.getMessages(activeRoomId, 50);
        if (isMounted) {
          setMessages(data.messages || []);
          setHasMore(data.hasMore || false);
          // Join socket room
          joinRoom(activeRoomId);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.error || 'Failed to load messages');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadMessages();

    return () => {
      isMounted = false;
      if (activeRoomId) {
        leaveRoom(activeRoomId);
      }
    };
  }, [activeRoomId, joinRoom, leaveRoom]);

  // Real-time message listener
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (newMessage) => {
      if (!newMessage) return;
      const msgRoomId = String(newMessage.room?._id || newMessage.room);
      const currentRoomId = String(activeRoomIdRef.current?._id || activeRoomIdRef.current);

      if (msgRoomId === currentRoomId) {
        setMessages((prev) => {
          // Prevent duplicates by _id
          if (prev.some((m) => String(m._id) === String(newMessage._id))) return prev;
          return [...prev, newMessage];
        });
      }
    };

    const handleMessageDeleted = ({ messageId, roomId }) => {
      const targetRoomId = String(roomId);
      const currentRoomId = String(activeRoomIdRef.current?._id || activeRoomIdRef.current);

      if (targetRoomId === currentRoomId) {
        setMessages((prev) => prev.filter((m) => String(m._id) !== String(messageId)));
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('messageDeleted', handleMessageDeleted);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('messageDeleted', handleMessageDeleted);
    };
  }, [socket]);

  // Load older messages (Pagination / Infinite scroll)
  const loadMoreMessages = useCallback(async () => {
    if (!activeRoomId || !hasMore || isLoadingMore || messages.length === 0) return;

    setIsLoadingMore(true);
    try {
      const oldestMessageDate = messages[0].createdAt;
      const data = await messageService.getMessages(activeRoomId, 50, oldestMessageDate);

      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => [...data.messages, ...prev]);
        setHasMore(data.hasMore || false);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeRoomId, hasMore, isLoadingMore, messages]);

  // Send message with seamless fallback
  const sendMessage = useCallback(
    async (content, messageType = 'text') => {
      if (!activeRoomId || !content || !content.trim()) return;

      const trimmed = content.trim();
      let sentMsg = null;

      try {
        // 1. Try WebSocket delivery
        sentMsg = await sendSocketMessage(activeRoomId, trimmed, messageType);
      } catch (wsErr) {
        console.warn('[Chat] WebSocket send error, falling back to REST API:', wsErr.message);
        // 2. Fallback to REST API
        const data = await messageService.sendMessage(activeRoomId, trimmed, messageType);
        if (data.success && data.message) {
          sentMsg = data.message;
        }
      }

      // Optimistically ensure message is displayed locally if not already received from broadcast
      if (sentMsg) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(sentMsg._id))) return prev;
          return [...prev, sentMsg];
        });
      }

      return sentMsg;
    },
    [activeRoomId, sendSocketMessage]
  );

  return {
    messages,
    isLoading,
    hasMore,
    isLoadingMore,
    error,
    loadMoreMessages,
    sendMessage,
    setMessages,
  };
};
