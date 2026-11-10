// routes/dashboardRoutes.js
// ---------------------------------------------------------
// Dashboard analytics and report routes.
// ---------------------------------------------------------

const express = require('express');
const router = express.Router();

const {
  getDailyDashboard,
  getWeeklyDashboard,
  exportCSV,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/daily', getDailyDashboard);
router.get('/weekly', getWeeklyDashboard);
router.get('/export-csv', exportCSV);

module.exports = router;

