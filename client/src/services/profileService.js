// src/services/profileService.js
// ---------------------------------------------------------
// Profile service: API calls for profile & goals
// ---------------------------------------------------------

import api from './api';

const profileService = {
  // Fetch current user's profile and calculated goals
  getProfile: async () => {
    const res = await api.get('/profile');
    return res.data;
  },

  // Update profile and recalculate goals
  updateProfile: async (data) => {
    const res = await api.put('/profile', data);
    return res.data;
  },

  // Preview calorie & macro goals instantly
  previewCalculation: async (profile) => {
    const res = await api.post('/profile/calculate', { profile });
    return res.data;
  },
};

export default profileService;

