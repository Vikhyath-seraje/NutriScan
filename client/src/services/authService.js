// src/services/authService.js
// ---------------------------------------------------------
// Authentication service interacting with backend auth APIs.
// ---------------------------------------------------------

import api from './api';

const authService = {
  // Register a new user
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },

  // Login existing user
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  // Get currently logged-in user profile
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export default authService;

