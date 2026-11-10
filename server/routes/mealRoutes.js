// routes/mealRoutes.js
// ---------------------------------------------------------
// Meal Diary CRUD routes.
// ---------------------------------------------------------

const express = require('express');
const router = express.Router();

const {
  createMeal,
  getMeals,
  getMealById,
  updateMeal,
  deleteMeal,
} = require('../controllers/mealController');
const { protect } = require('../middleware/auth');

// All meal routes require authentication
router.use(protect);

router.post('/', createMeal);
router.get('/', getMeals);
router.get('/:id', getMealById);
router.put('/:id', updateMeal);
router.delete('/:id', deleteMeal);

module.exports = router;

