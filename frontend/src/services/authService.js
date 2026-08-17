import api from './api';

export const authService = {
  // Send 6-digit verification OTP to email
  sendOtp: async (email, name = 'User', type = 'register') => {
    const response = await api.post('/auth/send-otp', { email, name, type });
    return response.data;
  },

  // Verify 6-digit OTP
  verifyOtp: async (email, otp) => {
    const response = await api.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  // Register user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },
};
