// models/Meal.js
// ---------------------------------------------------------
// Mongoose schema for logged meals.
// Stores:
//   - userId (owner check)
//   - mealType: breakfast, lunch, dinner, snack
//   - consumedAt: timestamp with local date
//   - imageUrl: optional Cloudinary or local image reference
//   - foods: array of food items with both AI estimates and confirmed values
//   - totals: server-calculated totals for calories & macros
// ---------------------------------------------------------

const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
    },
    databaseFoodId: {
      type: String,
      default: null, // ID from USDA or curated Indian DB
    },
    source: {
      type: String,
      enum: ['usda', 'indian_db', 'custom_entry', 'ai_estimate'],
      default: 'usda',
    },
    // Distinguish estimated vs confirmed quantities
    estimatedGrams: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
    },
    confirmedGrams: {
      type: Number,
      required: [true, 'Confirmed portion weight in grams is required'],
      min: [1, 'Portion weight must be at least 1 gram'],
    },
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low', 'unconfirmed'],
      default: 'medium',
    },
    preparationMethod: {
      type: String,
      trim: true,
      default: 'standard',
    },
    // Verified nutrition per 100g from the database
    nutrientsPer100g: {
      energy: { type: Number, default: 0 },  // in kcal
      protein: { type: Number, default: 0 }, // in g
      carbs: { type: Number, default: 0 },   // in g
      fat: { type: Number, default: 0 },     // in g
      fiber: { type: Number, default: 0 },   // in g
    },
    // Calculated nutrients = (nutrientsPer100g * confirmedGrams) / 100
    calculatedNutrients: {
      energy: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 },
    },
    userConfirmed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const mealSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Meal must belong to a user'],
      index: true,
    },
    mealType: {
      type: String,
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'],
      required: [true, 'Please select a meal type'],
    },
    consumedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    foods: [foodItemSchema],
    // Server-calculated totals across all foods in this meal
    totals: {
      energy: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 },
    },
    notes: {
      type: String,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast queries: "Get user's meals for a date range"
mealSchema.index({ userId: 1, consumedAt: -1 });

module.exports = mongoose.model('Meal', mealSchema);

