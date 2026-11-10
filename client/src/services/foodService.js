// src/services/foodService.js
// ---------------------------------------------------------
// Food recognition & nutrition database API service
// ---------------------------------------------------------

import api from './api';

const foodService = {
  // Upload meal image and analyze with Gemini Vision
  analyzeImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const res = await api.post('/food/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // Search nutrition database (USDA + Indian Foods)
  searchFoods: async (query) => {
    const res = await api.get(`/food/search?q=${encodeURIComponent(query)}`);
    return res.data;
  },

  // Recalculate nutrition server-side
  calculateNutrition: async (foods) => {
    const res = await api.post('/food/calculate', { foods });
    return res.data;
  },
};

export default foodService;

