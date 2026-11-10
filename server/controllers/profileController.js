// controllers/profileController.js
// ---------------------------------------------------------
// Profile controller:
//   - getProfile: retrieves user's profile and calorie goals
//   - updateProfile: saves profile, recalculates or respects manual goal
//   - previewGoals: instant calculation without saving
// ---------------------------------------------------------

const User = require('../models/User');
const {
  calculateNutritionGoals,
  calculateMacros,
} = require('../services/calculationService');
const { sendSuccess, sendError } = require('../utils/responseHelpers');

// @desc    Get user's profile and nutrition goals
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const calculation = calculateNutritionGoals(user.profile);

    return sendSuccess(
      res,
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profile: user.profile,
          calorieGoal: user.calorieGoal,
          macroGoals: user.macroGoals,
        },
        calculatedEstimate: calculation,
      },
      'Profile retrieved successfully'
    );
  } catch (error) {
    console.error('Error fetching profile:', error);
    return sendError(res, 'Server error fetching profile', 500);
  }
};

// @desc    Update user profile & recalculate or set calorie goal
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const { name, profile, calorieGoal, useManualCalorieGoal } = req.body;

    if (name) {
      user.name = name;
    }

    // Merge profile fields
    if (profile) {
      user.profile = {
        ...user.profile.toObject(),
        ...profile,
      };
    }

    let calculationResult = null;

    if (useManualCalorieGoal && calorieGoal) {
      // User chose to override with a manual calorie target
      user.calorieGoal = Number(calorieGoal);
      user.macroGoals = calculateMacros(user.calorieGoal);
    } else {
      // Auto-calculate suggested goal using Mifflin-St Jeor equation
      calculationResult = calculateNutritionGoals(user.profile);
      user.calorieGoal = calculationResult.suggestedCalorieGoal;
      user.macroGoals = calculationResult.macroGoals;
    }

    await user.save();

    return sendSuccess(
      res,
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profile: user.profile,
          calorieGoal: user.calorieGoal,
          macroGoals: user.macroGoals,
        },
        calculation: calculationResult || calculateNutritionGoals(user.profile),
      },
      'Profile updated successfully!'
    );
  } catch (error) {
    console.error('Error updating profile:', error);
    return sendError(res, 'Server error updating profile', 500);
  }
};

// @desc    Preview calculated nutrition goals without saving
// @route   POST /api/profile/calculate
// @access  Private
const previewGoals = (req, res) => {
  try {
    const calculation = calculateNutritionGoals(req.body.profile || {});
    return sendSuccess(res, calculation, 'Calculation preview generated');
  } catch (error) {
    console.error('Error in preview calculation:', error);
    return sendError(res, 'Failed to calculate goals', 500);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  previewGoals,
};

