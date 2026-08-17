import api from './api';

export const messageService = {
  // Get messages for a room with pagination cursor
  getMessages: async (roomId, limit = 50, before = null) => {
    const params = { limit };
    if (before) params.before = before;
    const response = await api.get(`/messages/${roomId}`, { params });
    return response.data;
  },

  // Send message REST fallback
  sendMessage: async (roomId, content, messageType = 'text') => {
    const response = await api.post(`/messages/${roomId}`, { content, messageType });
    return response.data;
  },

  // Delete message
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/messages/item/${messageId}`);
    return response.data;
  },
};
