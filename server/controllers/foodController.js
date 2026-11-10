// controllers/foodController.js
// ---------------------------------------------------------
// Food recognition, search, and nutrition calculation controller.
// ---------------------------------------------------------

const path = require('path');
const { analyzeMealImage } = require('../services/geminiService');
const { searchFoods, findBestFoodMatch } = require('../services/nutritionService');
const { sendSuccess, sendError } = require('../utils/responseHelpers');

// @desc    Analyze uploaded meal image with Gemini Vision
// @route   POST /api/food/analyze
// @access  Private
const analyzeImage = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 'Please upload a meal photo to analyze.', 400);
    }

    const imagePath = req.file.path;
    const imageUrl = `/uploads/meals/${path.basename(imagePath)}`;

    // Call Gemini Vision AI
    const aiResult = await analyzeMealImage(imagePath, req.file.mimetype);

    if (!aiResult.isFood) {
      return sendSuccess(
        res,
        {
          isFood: false,
          imageUrl,
          message:
            aiResult.message ||
            'No recognizable food was detected in this image. Please upload a clear photo of your meal.',
        },
        'Analysis completed — non-food image detected'
      );
    }

    // For every recognized item, find best verified nutrition match
    const enrichedItems = [];
    for (const item of aiResult.items) {
      const match = await findBestFoodMatch(item.name);
      const avgGrams = item.estimatedQuantityGrams
        ? Math.round(
            (item.estimatedQuantityGrams.min + item.estimatedQuantityGrams.max) / 2
          )
        : 100;

      // Server-side calculation preview
      const calculated = calculateItemNutrients(match.nutrientsPer100g, avgGrams);

      enrichedItems.push({
        name: item.name,
        matchedFoodName: match.name,
        databaseFoodId: match.externalId,
        source: match.source,
        possibleIngredients: item.possibleIngredients || [],
        preparationMethod: item.preparationMethod || 'standard',
        estimatedQuantityGrams: item.estimatedQuantityGrams || { min: 80, max: 120 },
        suggestedGrams: avgGrams,
        confidence: item.confidence || 'medium',
        uncertainties: item.uncertainties || [],
        nutrientsPer100g: match.nutrientsPer100g,
        calculatedNutrients: calculated,
      });
    }

    return sendSuccess(
      res,
      {
        isFood: true,
        imageUrl,
        items: enrichedItems,
        overallUncertainty: aiResult.overallUncertainty || [
          'Visual weights are estimates. Please adjust portion weights before logging.',
        ],
        simulated: !!aiResult.simulated,
      },
      'Meal image analyzed successfully'
    );
  } catch (error) {
    console.error('Food analysis error:', error);
    return sendError(res, 'Server error analyzing meal image.', 500);
  }
};

// @desc    Search foods in nutrition database
// @route   GET /api/food/search?q=
// @access  Private
const searchFoodItems = async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query.trim()) {
      return sendSuccess(res, [], 'Empty query');
    }

    const results = await searchFoods(query);
    return sendSuccess(res, results, 'Food search results retrieved');
  } catch (error) {
    console.error('Food search error:', error);
    return sendError(res, 'Error searching food database.', 500);
  }
};

// @desc    Calculate nutrition for given items and grams
// @route   POST /api/food/calculate
// @access  Private
const calculateNutrition = (req, res) => {
  try {
    const { foods } = req.body;
    if (!Array.isArray(foods) || foods.length === 0) {
      return sendError(res, 'Please provide an array of food items with grams.', 400);
    }

    let totalEnergy = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    const calculatedFoods = foods.map((f) => {
      const grams = Number(f.confirmedGrams) || 100;
      const nutrients = f.nutrientsPer100g || { energy: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      const itemNutrients = calculateItemNutrients(nutrients, grams);

      totalEnergy += itemNutrients.energy;
      totalProtein += itemNutrients.protein;
      totalCarbs += itemNutrients.carbs;
      totalFat += itemNutrients.fat;
      totalFiber += itemNutrients.fiber;

      return {
        ...f,
        confirmedGrams: grams,
        calculatedNutrients: itemNutrients,
      };
    });

    return sendSuccess(
      res,
      {
        foods: calculatedFoods,
        totals: {
          energy: Math.round(totalEnergy),
          protein: Math.round(totalProtein * 10) / 10,
          carbs: Math.round(totalCarbs * 10) / 10,
          fat: Math.round(totalFat * 10) / 10,
          fiber: Math.round(totalFiber * 10) / 10,
        },
      },
      'Nutrition calculation complete'
    );
  } catch (error) {
    console.error('Calculation error:', error);
    return sendError(res, 'Failed to calculate nutrition values', 500);
  }
};

/**
 * Pure helper function: calculates nutrients for a confirmed gram weight
 * Formula: nutrient = (nutrientsPer100g * grams) / 100
 */
function calculateItemNutrients(per100g, grams) {
  const g = Number(grams) || 0;
  return {
    energy: Math.round(((per100g.energy || 0) * g) / 100),
    protein: Math.round((((per100g.protein || 0) * g) / 100) * 10) / 10,
    carbs: Math.round((((per100g.carbs || 0) * g) / 100) * 10) / 10,
    fat: Math.round((((per100g.fat || 0) * g) / 100) * 10) / 10,
    fiber: Math.round((((per100g.fiber || 0) * g) / 100) * 10) / 10,
  };
}

module.exports = {
  analyzeImage,
  searchFoodItems,
  calculateNutrition,
  calculateItemNutrients,
};

