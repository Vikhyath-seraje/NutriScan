// controllers/mealController.js
// ---------------------------------------------------------
// Meal Diary CRUD Controller.
// Enforces mandatory ownership checks (req.user._id == meal.userId)
// Recalculates all nutrition totals server-side on creation and update.
// ---------------------------------------------------------

const Meal = require('../models/Meal');
const { calculateItemNutrients } = require('./foodController');
const { sendSuccess, sendError } = require('../utils/responseHelpers');

// @desc    Log a new meal
// @route   POST /api/meals
// @access  Private
const createMeal = async (req, res) => {
  try {
    const { mealType, consumedAt, imageUrl, foods, notes } = req.body;

    if (!mealType || !foods || !Array.isArray(foods) || foods.length === 0) {
      return sendError(res, 'Please provide a meal type and at least one food item.', 400);
    }

    // Always recalculate nutrients server-side for integrity
    let totalEnergy = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    const validatedFoods = foods.map((f) => {
      const grams = Number(f.confirmedGrams) || 100;
      const nutrientsPer100g = f.nutrientsPer100g || { energy: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      const calculated = calculateItemNutrients(nutrientsPer100g, grams);

      totalEnergy += calculated.energy;
      totalProtein += calculated.protein;
      totalCarbs += calculated.carbs;
      totalFat += calculated.fat;
      totalFiber += calculated.fiber;

      return {
        name: f.name,
        databaseFoodId: f.databaseFoodId || null,
        source: f.source || 'custom_entry',
        estimatedGrams: f.estimatedGrams || null,
        confirmedGrams: grams,
        confidence: f.confidence || 'unconfirmed',
        preparationMethod: f.preparationMethod || 'standard',
        nutrientsPer100g,
        calculatedNutrients: calculated,
        userConfirmed: true,
      };
    });

    const meal = await Meal.create({
      userId: req.user._id,
      mealType,
      consumedAt: consumedAt ? new Date(consumedAt) : new Date(),
      imageUrl: imageUrl || null,
      foods: validatedFoods,
      totals: {
        energy: Math.round(totalEnergy),
        protein: Math.round(totalProtein * 10) / 10,
        carbs: Math.round(totalCarbs * 10) / 10,
        fat: Math.round(totalFat * 10) / 10,
        fiber: Math.round(totalFiber * 10) / 10,
      },
      notes: notes || '',
    });

    return sendSuccess(res, meal, 'Meal saved successfully to diary', 201);
  } catch (error) {
    console.error('Error creating meal:', error);
    return sendError(res, 'Server error saving meal.', 500);
  }
};

// @desc    Get user's meals, optionally filtered by date
// @route   GET /api/meals?date=YYYY-MM-DD
// @access  Private
const getMeals = async (req, res) => {
  try {
    const { date } = req.query;
    const query = { userId: req.user._id };

    if (date) {
      // Filter for the entire 24h range of the given date in local time
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.consumedAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const meals = await Meal.find(query).sort({ consumedAt: -1 });

    // Calculate aggregated daily totals
    const dayTotals = meals.reduce(
      (acc, m) => {
        acc.energy += m.totals.energy || 0;
        acc.protein += m.totals.protein || 0;
        acc.carbs += m.totals.carbs || 0;
        acc.fat += m.totals.fat || 0;
        acc.fiber += m.totals.fiber || 0;
        return acc;
      },
      { energy: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    return sendSuccess(
      res,
      {
        meals,
        dayTotals: {
          energy: Math.round(dayTotals.energy),
          protein: Math.round(dayTotals.protein * 10) / 10,
          carbs: Math.round(dayTotals.carbs * 10) / 10,
          fat: Math.round(dayTotals.fat * 10) / 10,
          fiber: Math.round(dayTotals.fiber * 10) / 10,
        },
      },
      'Meals retrieved successfully'
    );
  } catch (error) {
    console.error('Error retrieving meals:', error);
    return sendError(res, 'Server error retrieving meals.', 500);
  }
};

// @desc    Get single meal by ID
// @route   GET /api/meals/:id
// @access  Private
const getMealById = async (req, res) => {
  try {
    const meal = await Meal.findOne({
      _id: req.params.id,
      userId: req.user._id, // Strict ownership check
    });

    if (!meal) {
      return sendError(res, 'Meal not found or unauthorized', 404);
    }

    return sendSuccess(res, meal, 'Meal details retrieved');
  } catch (error) {
    console.error('Error fetching meal:', error);
    return sendError(res, 'Server error fetching meal.', 500);
  }
};

// @desc    Update an existing meal
// @route   PUT /api/meals/:id
// @access  Private
const updateMeal = async (req, res) => {
  try {
    const meal = await Meal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!meal) {
      return sendError(res, 'Meal not found or unauthorized', 404);
    }

    const { mealType, consumedAt, foods, notes } = req.body;

    if (mealType) meal.mealType = mealType;
    if (consumedAt) meal.consumedAt = new Date(consumedAt);
    if (notes !== undefined) meal.notes = notes;

    if (foods && Array.isArray(foods)) {
      let totalEnergy = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      let totalFiber = 0;

      meal.foods = foods.map((f) => {
        const grams = Number(f.confirmedGrams) || 100;
        const nutrientsPer100g = f.nutrientsPer100g || { energy: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
        const calculated = calculateItemNutrients(nutrientsPer100g, grams);

        totalEnergy += calculated.energy;
        totalProtein += calculated.protein;
        totalCarbs += calculated.carbs;
        totalFat += calculated.fat;
        totalFiber += calculated.fiber;

        return {
          ...f,
          confirmedGrams: grams,
          calculatedNutrients: calculated,
          userConfirmed: true,
        };
      });

      meal.totals = {
        energy: Math.round(totalEnergy),
        protein: Math.round(totalProtein * 10) / 10,
        carbs: Math.round(totalCarbs * 10) / 10,
        fat: Math.round(totalFat * 10) / 10,
        fiber: Math.round(totalFiber * 10) / 10,
      };
    }

    await meal.save();
    return sendSuccess(res, meal, 'Meal updated successfully');
  } catch (error) {
    console.error('Error updating meal:', error);
    return sendError(res, 'Server error updating meal.', 500);
  }
};

// @desc    Delete a meal
// @route   DELETE /api/meals/:id
// @access  Private
const deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!meal) {
      return sendError(res, 'Meal not found or unauthorized', 404);
    }

    return sendSuccess(res, { id: req.params.id }, 'Meal deleted successfully');
  } catch (error) {
    console.error('Error deleting meal:', error);
    return sendError(res, 'Server error deleting meal.', 500);
  }
};

module.exports = {
  createMeal,
  getMeals,
  getMealById,
  updateMeal,
  deleteMeal,
};

