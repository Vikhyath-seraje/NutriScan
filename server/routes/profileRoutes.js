// routes/profileRoutes.js
// ---------------------------------------------------------
// Profile routes:
//   GET  /api/profile           - Fetch profile & calorie goals
//   PUT  /api/profile           - Update profile & calculate targets
//   POST /api/profile/calculate - Preview goals without saving
// ---------------------------------------------------------

const express = require('express');
const router = express.Router();

const {
  getProfile,
  updateProfile,
  previewGoals,
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const { validate, profileRules } = require('../middleware/validate');

// All profile routes require authentication
router.use(protect);

router.get('/', getProfile);
router.put('/', profileRules, validate, updateProfile);
router.post('/calculate', previewGoals);

module.exports = router;

