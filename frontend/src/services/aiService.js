import api from './api';

export const aiService = {
  // Chat directly with AI assistant
  chat: async (prompt, history = []) => {
    const response = await api.post('/ai/chat', { prompt, history });
    return response.data;
  },

  // Summarize chat room
  summarize: async (roomId) => {
    const response = await api.post('/ai/summarize', { roomId });
    return response.data;
  },

  // Generate smart replies
  smartReply: async (roomId, contextText = '') => {
    const response = await api.post('/ai/smart-reply', { roomId, contextText });
    return response.data;
  },

  // Improve message draft
  improve: async (text) => {
    const response = await api.post('/ai/improve', { text });
    return response.data;
  },

  // Translate message
  translate: async (text, targetLanguage = 'English', messageId = null) => {
    const response = await api.post('/ai/translate', { text, targetLanguage, messageId });
    return response.data;
  },

  // Semantic search across chat
  search: async (query, roomId = null) => {
    const response = await api.post('/ai/search', { query, roomId });
    return response.data;
  },

  // Analyze sentiment
  sentiment: async (text, messageId = null) => {
    const response = await api.post('/ai/sentiment', { text, messageId });
    return response.data;
  },

  // Moderate content
  moderate: async (content) => {
    const response = await api.post('/ai/moderate', { content });
    return response.data;
  },
};
