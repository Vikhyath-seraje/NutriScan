// src/services/dashboardService.js
// ---------------------------------------------------------
// Dashboard analytics and report API service
// ---------------------------------------------------------

import api from './api';

const dashboardService = {
  // Get daily summary (calories, macros, slots)
  getDaily: async (dateStr) => {
    const url = dateStr ? `/dashboard/daily?date=${dateStr}` : '/dashboard/daily';
    const res = await api.get(url);
    return res.data;
  },

  // Get 7-day weekly calorie breakdown for Recharts
  getWeekly: async () => {
    const res = await api.get('/dashboard/weekly');
    return res.data;
  },

  // Download CSV export directly in browser
  downloadCSV: async () => {
    const response = await api.get('/dashboard/export-csv', {
      responseType: 'blob',
    });

    // Create a temporary link to trigger native browser download
    const blob = new Blob([response.data], { type: 'text/csv' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `nutriscan-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};

export default dashboardService;

