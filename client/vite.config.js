// vite.config.js
// ---------------------------------------------------------
// Vite configuration for the React client.
//
// Key setting: `server.proxy`
//   During development, any request from React that starts
//   with /api is forwarded to our Express server on port 5000.
//   This avoids CORS issues during development because the
//   browser thinks both the React UI and the API are on the
//   same origin (localhost:5173).
//
//   In production, Nginx or a cloud service handles proxying.
// ---------------------------------------------------------

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      // Any request to /api/* is forwarded to Express
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // No rewrite needed — Express also uses /api prefix
      },
    },
  },
});
