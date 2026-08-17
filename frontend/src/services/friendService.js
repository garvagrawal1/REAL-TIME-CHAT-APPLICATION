import api from './api';

export const friendService = {
  // Get list of friends
  getFriends: async () => {
    const response = await api.get('/friends');
    return response.data;
  },

  // Get pending friend requests (incoming & outgoing)
  getFriendRequests: async () => {
    const response = await api.get('/friends/requests');
    return response.data;
  },

  // Search users with relationship status
  searchUsers: async (query = '') => {
    const params = query ? { q: query } : {};
    const response = await api.get('/friends/search', { params });
    return response.data;
  },

  // Send a friend request
  sendFriendRequest: async (targetUserId) => {
    const response = await api.post(`/friends/request/${targetUserId}`);
    return response.data;
  },

  // Accept a friend request
  acceptFriendRequest: async (requestId) => {
    const response = await api.post(`/friends/accept/${requestId}`);
    return response.data;
  },

  // Reject a friend request
  rejectFriendRequest: async (requestId) => {
    const response = await api.post(`/friends/reject/${requestId}`);
    return response.data;
  },

  // Explicitly remove/unfriend a friend
  removeFriend: async (friendId) => {
    const response = await api.delete(`/friends/${friendId}`);
    return response.data;
  },

  // Open or create a 1-on-1 DM channel
  getOrCreateDM: async (friendId) => {
    const response = await api.post(`/friends/dm/${friendId}`);
    return response.data;
  },
};
