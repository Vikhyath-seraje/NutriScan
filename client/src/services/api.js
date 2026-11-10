// services/api.js
// ---------------------------------------------------------
// Base Axios instance used by all service modules.
// Sets the base URL and attaches the JWT token to every
// request automatically via a request interceptor.
//
// VITE_API_BASE_URL is defined in client/.env as /api
// During dev, Vite proxies /api → http://localhost:5000
// ---------------------------------------------------------

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor ───────────────────────────────────
// Before every request, read the JWT from localStorage and
// attach it as a Bearer token in the Authorization header.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nutriscan_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ──────────────────────────────────
// If the server returns 401 (token expired or invalid),
// clear local storage and redirect to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nutriscan_token');
      localStorage.removeItem('nutriscan_user');
      // Redirect to login only if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

