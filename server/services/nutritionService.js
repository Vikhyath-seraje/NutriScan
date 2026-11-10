// services/nutritionService.js
// ---------------------------------------------------------
// Unified Nutrition Service
// Matches food queries against:
// 1. Curated Indian Foods Database
// 2. MongoDB FoodCache
// 3. USDA FoodData Central API
//
// Ensures nutrient provenance (source label) is always preserved.
// ---------------------------------------------------------

const path = require('path');
const fs = require('fs');
const FoodCache = require('../models/FoodCache');
const { searchUSDAFoods } = require('./usdaService');

// Load curated Indian foods dataset into memory
const indianFoodsPath = path.join(__dirname, '..', 'data', 'indianFoods.json');
let curatedIndianFoods = [];
try {
  curatedIndianFoods = JSON.parse(fs.readFileSync(indianFoodsPath, 'utf8'));
} catch (err) {
  console.warn('Could not load indianFoods.json:', err.message);
}

/**
 * Searches curated Indian foods first, then FoodCache, then USDA API.
 *
 * @param {string} query - Search term (e.g. "Idli", "Apple", "Rice")
 * @returns {Promise<Array>} List of matched food records with source provenance
 */
async function searchFoods(query) {
  if (!query || query.trim() === '') return [];

  const cleanQuery = query.trim().toLowerCase();
  const results = [];

  // 1. Check curated Indian foods (instant in-memory match)
  const indianMatches = curatedIndianFoods.filter((item) =>
    item.name.toLowerCase().includes(cleanQuery) ||
    cleanQuery.includes(item.name.toLowerCase().split(' ')[0])
  );
  results.push(...indianMatches);

  // 2. Check MongoDB FoodCache
  try {
    const cachedMatches = await FoodCache.find({
      normalizedName: { $regex: cleanQuery, $options: 'i' },
    }).limit(5);

    for (const cached of cachedMatches) {
      if (!results.some((r) => r.externalId === cached.externalId)) {
        results.push({
          externalId: cached.externalId,
          name: cached.name,
          source: cached.source,
          category: cached.category,
          nutrientsPer100g: cached.nutrientsPer100g,
          servingSizeGrams: cached.servingSizeGrams,
          servingDescription: cached.servingDescription,
        });
      }
    }
  } catch (err) {
    console.warn('FoodCache search warning:', err.message);
  }

  // 3. If fewer than 4 matches, query USDA API
  if (results.length < 4) {
    try {
      const usdaResults = await searchUSDAFoods(cleanQuery, 5);
      for (const item of usdaResults) {
        if (!results.some((r) => r.name.toLowerCase() === item.name.toLowerCase())) {
          results.push(item);
          // Asynchronously cache USDA result for future instant searches
          cacheFoodItem(item).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('USDA search error in unified service:', err.message);
    }
  }

  return results;
}

/**
 * Caches food item into MongoDB FoodCache.
 */
async function cacheFoodItem(item) {
  try {
    await FoodCache.findOneAndUpdate(
      { externalId: item.externalId },
      {
        externalId: item.externalId,
        name: item.name,
        normalizedName: item.name.toLowerCase(),
        source: item.source || 'usda',
        category: item.category || 'General',
        nutrientsPer100g: item.nutrientsPer100g,
        servingSizeGrams: item.servingSizeGrams || 100,
        servingDescription: item.servingDescription || '100g',
        lastFetchedAt: new Date(),
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    // Ignore duplicate cache errors
  }
}

/**
 * Find best single matching food record for a recognized food name.
 */
async function findBestFoodMatch(foodName) {
  const matches = await searchFoods(foodName);
  if (matches.length > 0) {
    return matches[0];
  }
  // Generic fallback if not matched
  return {
    externalId: 'custom_general',
    name: foodName,
    source: 'custom_entry',
    category: 'Mixed Dish',
    nutrientsPer100g: {
      energy: 150,
      protein: 5.0,
      carbs: 20.0,
      fat: 5.0,
      fiber: 2.0,
    },
    servingSizeGrams: 100,
    servingDescription: '100g (estimated baseline)',
  };
}

module.exports = {
  searchFoods,
  findBestFoodMatch,
  cacheFoodItem,
  curatedIndianFoods,
};

