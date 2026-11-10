// services/calculationService.js
// ---------------------------------------------------------
// Calorie & Macro Calculation Engine
//
// Equations used:
// 1. Mifflin-St Jeor Equation for Basal Metabolic Rate (BMR)
// 2. Physical Activity Level (PAL) Multipliers for TDEE
// 3. Goal adjustment with safety guards
// 4. Macro distribution (Protein: 25%, Carbs: 50%, Fat: 25%)
//
// All outputs are rounded integers.
// ---------------------------------------------------------

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  extra_active: 1.9,
};

const GOAL_ADJUSTMENTS = {
  lose: -400,     // Conservative, sustainable deficit
  maintain: 0,
  gain: 350,      // Controlled surplus
};

// Hard safety limits to prevent unhealthy recommendations
const ABSOLUTE_MIN_CALORIES = 1000;
const ABSOLUTE_MAX_CALORIES = 5000;
const DEFAULT_CALORIE_GOAL = 2000;

/**
 * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor equation.
 *
 * @param {Object} params
 * @param {number} params.weightKg - Weight in kilograms
 * @param {number} params.heightCm - Height in centimeters
 * @param {number} params.age - Age in years
 * @param {'male'|'female'} params.sex - Biological sex
 * @returns {number|null} BMR in kcal/day, or null if required data missing
 */
function calculateBMR({ weightKg, heightCm, age, sex }) {
  if (!weightKg || !heightCm || !age || !sex) {
    return null;
  }

  const w = Number(weightKg);
  const h = Number(heightCm);
  const a = Number(age);

  if (isNaN(w) || isNaN(h) || isNaN(a) || w <= 0 || h <= 0 || a <= 0) {
    return null;
  }

  // Mifflin-St Jeor equation:
  // Male:   10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + 5
  // Female: 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) - 161
  const base = 10 * w + 6.25 * h - 5 * a;
  const bmr = sex === 'male' ? base + 5 : base - 161;

  return Math.round(bmr);
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE).
 *
 * @param {number} bmr - Basal Metabolic Rate in kcal
 * @param {string} activityLevel - Key in ACTIVITY_MULTIPLIERS
 * @returns {number|null} TDEE in kcal/day
 */
function calculateTDEE(bmr, activityLevel = 'moderate') {
  if (!bmr || bmr <= 0) return null;
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.moderate;
  return Math.round(bmr * multiplier);
}

/**
 * Calculate suggested daily calorie goal based on profile.
 *
 * @param {Object} profile - User profile object
 * @returns {Object} { bmr, tdee, suggestedCalorieGoal, macroGoals, isEstimate: true }
 */
function calculateNutritionGoals(profile = {}) {
  const { weightKg, heightCm, age, sex, activityLevel, goal } = profile;

  const bmr = calculateBMR({ weightKg, heightCm, age, sex });

  // If metrics are not provided, return default standard goals
  if (!bmr) {
    return {
      bmr: null,
      tdee: null,
      suggestedCalorieGoal: DEFAULT_CALORIE_GOAL,
      macroGoals: calculateMacros(DEFAULT_CALORIE_GOAL),
      isEstimate: true,
      hasCustomMetrics: false,
      disclaimer: 'Default estimate (2000 kcal). Enter your optional body metrics for a personalized calculation.',
    };
  }

  const tdee = calculateTDEE(bmr, activityLevel);
  const adjustment = GOAL_ADJUSTMENTS[goal] !== undefined ? GOAL_ADJUSTMENTS[goal] : 0;

  let rawGoal = tdee + adjustment;

  // Apply biological safety floors
  const safetyFloor = sex === 'female' ? 1200 : 1500;
  if (rawGoal < safetyFloor && goal === 'lose') {
    rawGoal = safetyFloor;
  }

  // Absolute hard clamps
  const clampedGoal = Math.min(
    Math.max(rawGoal, ABSOLUTE_MIN_CALORIES),
    ABSOLUTE_MAX_CALORIES
  );

  const suggestedCalorieGoal = Math.round(clampedGoal);
  const macroGoals = calculateMacros(suggestedCalorieGoal);

  return {
    bmr,
    tdee,
    suggestedCalorieGoal,
    macroGoals,
    isEstimate: true,
    hasCustomMetrics: true,
    equation: 'Mifflin-St Jeor',
    disclaimer: 'Calculated using the standard Mifflin-St Jeor equation. These are estimates for informational use and not medical advice.',
  };
}

/**
 * Calculate recommended macronutrient distribution from a calorie goal.
 * Balanced ratio: Protein 25%, Carbs 50%, Fat 25%
 *
 * @param {number} calories - Total daily calorie target
 * @returns {Object} { proteinGrams, carbsGrams, fatGrams }
 */
function calculateMacros(calories) {
  const safeCalories = Math.max(calories || DEFAULT_CALORIE_GOAL, ABSOLUTE_MIN_CALORIES);

  // Protein: 25% of calories / 4 kcal per gram
  const proteinGrams = Math.round((safeCalories * 0.25) / 4);

  // Carbohydrates: 50% of calories / 4 kcal per gram
  const carbsGrams = Math.round((safeCalories * 0.50) / 4);

  // Fat: 25% of calories / 9 kcal per gram
  const fatGrams = Math.round((safeCalories * 0.25) / 9);

  return {
    proteinGrams,
    carbsGrams,
    fatGrams,
  };
}

module.exports = {
  calculateBMR,
  calculateTDEE,
  calculateNutritionGoals,
  calculateMacros,
  ACTIVITY_MULTIPLIERS,
  GOAL_ADJUSTMENTS,
  ABSOLUTE_MIN_CALORIES,
  ABSOLUTE_MAX_CALORIES,
  DEFAULT_CALORIE_GOAL,
};

