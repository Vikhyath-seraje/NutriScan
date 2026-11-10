// src/services/mealService.js
// ---------------------------------------------------------
// Meal Diary CRUD API service
// ---------------------------------------------------------

import api from './api';

const mealService = {
  // Save a confirmed meal
  createMeal: async (mealData) => {
    const res = await api.post('/meals', mealData);
    return res.data;
  },

  // Get meals for a specific date (YYYY-MM-DD)
  getMeals: async (dateStr) => {
    const url = dateStr ? `/meals?date=${dateStr}` : '/meals';
    const res = await api.get(url);
    return res.data;
  },

  // Get single meal
  getMealById: async (id) => {
    const res = await api.get(`/meals/${id}`);
    return res.data;
  },

  // Update existing meal
  updateMeal: async (id, mealData) => {
    const res = await api.put(`/meals/${id}`, mealData);
    return res.data;
  },

  // Delete a meal
  deleteMeal: async (id) => {
    const res = await api.delete(`/meals/${id}`);
    return res.data;
  },
};

export default mealService;

