import api from './api';

export const roomService = {
  // Get all rooms
  getRooms: async (search = '') => {
    const params = search ? { search } : {};
    const response = await api.get('/rooms', { params });
    return response.data;
  },

  // Create room
  createRoom: async (roomData) => {
    const response = await api.post('/rooms', roomData);
    return response.data;
  },

  // Get room by ID
  getRoomById: async (roomId) => {
    const response = await api.get(`/rooms/${roomId}`);
    return response.data;
  },

  // Join room
  joinRoom: async (roomId) => {
    const response = await api.post(`/rooms/${roomId}/join`);
    return response.data;
  },

  // Leave room
  leaveRoom: async (roomId) => {
    const response = await api.post(`/rooms/${roomId}/leave`);
    return response.data;
  },
};
