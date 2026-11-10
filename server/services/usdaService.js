// services/usdaService.js
// ---------------------------------------------------------
// USDA FoodData Central API Service
// Searches and extracts nutrients normalized per 100g.
// Respects rate limits, timeouts, and handles errors.
// ---------------------------------------------------------

const BASE_URL = process.env.USDA_BASE_URL || 'https://api.nal.usda.gov/fdc/v1';

/**
 * Searches USDA FoodData Central for matching foods.
 *
 * @param {string} query - e.g. "Banana", "Chicken Breast", "Oatmeal"
 * @param {number} pageSize - Max items to return (default 6)
 * @returns {Promise<Array>} List of normalized foods
 */
async function searchUSDAFoods(query, pageSize = 6) {
  const apiKey = process.env.USDA_API_KEY;

  if (!apiKey || apiKey === 'your_usda_api_key_here') {
    // If no USDA API key is set, return empty array so fallback/curated DB is used
    return [];
  }

  try {
    const url = `${BASE_URL}/foods/search?api_key=${encodeURIComponent(
      apiKey
    )}&query=${encodeURIComponent(query)}&pageSize=${pageSize}&dataType=Foundation,SR Legacy,Survey (FNDDS)`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`USDA API responded with status ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (!data.foods || !Array.isArray(data.foods)) {
      return [];
    }

    return data.foods.map(normalizeUSDAFood);
  } catch (error) {
    console.error('USDA FoodData Central API search error:', error.message);
    return [];
  }
}

/**
 * Normalizes USDA FDC food record into a standard NutriScan food record.
 */
function normalizeUSDAFood(food) {
  const nutrients = {
    energy: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  };

  if (Array.isArray(food.foodNutrients)) {
    for (const n of food.foodNutrients) {
      const name = (n.nutrientName || '').toLowerCase();
      const val = Number(n.value) || 0;

      if (name.includes('energy') && (n.unitName || '').toLowerCase() === 'kcal') {
        nutrients.energy = Math.round(val);
      } else if (name.includes('protein')) {
        nutrients.protein = Math.round(val * 10) / 10;
      } else if (name.includes('carbohydrate')) {
        nutrients.carbs = Math.round(val * 10) / 10;
      } else if (name.includes('total lipid') || name === 'fat') {
        nutrients.fat = Math.round(val * 10) / 10;
      } else if (name.includes('fiber')) {
        nutrients.fiber = Math.round(val * 10) / 10;
      }
    }
  }

  return {
    externalId: `usda_${food.fdcId}`,
    name: food.description,
    source: 'usda',
    category: food.foodCategory || 'General',
    nutrientsPer100g: nutrients,
    servingSizeGrams: 100,
    servingDescription: '100g',
  };
}

module.exports = {
  searchUSDAFoods,
  normalizeUSDAFood,
};

