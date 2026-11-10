// routes/foodRoutes.js
// ---------------------------------------------------------
// Food routes:
//   POST /api/food/analyze   - Multer upload + Gemini Vision + initial match
//   GET  /api/food/search    - Search nutrition database
//   POST /api/food/calculate - Server-side recalculation of totals
// ---------------------------------------------------------

const express = require('express');
const router = express.Router();

const {
  analyzeImage,
  searchFoodItems,
  calculateNutrition,
} = require('../controllers/foodController');
const { protect } = require('../middleware/auth');
const { uploadMealImage } = require('../middleware/upload');

// All food routes require authentication
router.use(protect);

router.post('/analyze', uploadMealImage, analyzeImage);
router.get('/search', searchFoodItems);
router.post('/calculate', calculateNutrition);

module.exports = router;

