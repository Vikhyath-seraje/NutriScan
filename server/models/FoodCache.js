// models/FoodCache.js
// ---------------------------------------------------------
// Mongoose schema for cached food nutrition records.
// Caches:
//   - externalFoodId (e.g., USDA FDC ID)
//   - normalizedName (lowercased for regex search)
//   - source: 'usda' | 'indian_db' | 'custom'
//   - nutrientsPer100g
// ---------------------------------------------------------

const mongoose = require('mongoose');

const foodCacheSchema = new mongoose.Schema(
  {
    externalId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedName: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    source: {
      type: String,
      enum: ['usda', 'indian_db', 'custom'],
      default: 'usda',
      index: true,
    },
    category: {
      type: String,
      default: 'General',
    },
    nutrientsPer100g: {
      energy: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 },
    },
    servingSizeGrams: {
      type: Number,
      default: 100,
    },
    servingDescription: {
      type: String,
      default: '100g',
    },
    lastFetchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Search index for text matching
foodCacheSchema.index({ normalizedName: 'text', name: 'text' });

module.exports = mongoose.model('FoodCache', foodCacheSchema);

