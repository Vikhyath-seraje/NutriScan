// tests/calculationService.test.js
// ---------------------------------------------------------
// Unit Tests for the Nutrition Calculation Service
// Run: node tests/calculationService.test.js
// ---------------------------------------------------------

const assert = require('assert');
const {
  calculateBMR,
  calculateTDEE,
  calculateNutritionGoals,
  calculateMacros,
  ABSOLUTE_MIN_CALORIES,
  ABSOLUTE_MAX_CALORIES,
  DEFAULT_CALORIE_GOAL,
} = require('../services/calculationService');

let passed = 0;
let failed = 0;

function it(description, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

console.log('\n--- Testing BMR (Mifflin-St Jeor Equation) ---');

it('calculates male BMR correctly', () => {
  // Male: 75kg, 178cm, 25yo
  // BMR = 10 * 75 + 6.25 * 178 - 5 * 25 + 5
  //     = 750 + 1112.5 - 125 + 5 = 1742.5 => 1743
  const bmr = calculateBMR({ weightKg: 75, heightCm: 178, age: 25, sex: 'male' });
  assert.strictEqual(bmr, 1743);
});

it('calculates female BMR correctly', () => {
  // Female: 60kg, 165cm, 28yo
  // BMR = 10 * 60 + 6.25 * 165 - 5 * 28 - 161
  //     = 600 + 1031.25 - 140 - 161 = 1330.25 => 1330
  const bmr = calculateBMR({ weightKg: 60, heightCm: 165, age: 28, sex: 'female' });
  assert.strictEqual(bmr, 1330);
});

it('returns null if required parameters are missing', () => {
  assert.strictEqual(calculateBMR({ weightKg: 70 }), null);
  assert.strictEqual(calculateBMR({ age: 25, sex: 'male' }), null);
  assert.strictEqual(calculateBMR({}), null);
});

it('returns null on invalid or negative numbers', () => {
  assert.strictEqual(calculateBMR({ weightKg: -70, heightCm: 170, age: 25, sex: 'male' }), null);
  assert.strictEqual(calculateBMR({ weightKg: 'abc', heightCm: 170, age: 25, sex: 'male' }), null);
  assert.strictEqual(calculateBMR({ weightKg: 70, heightCm: 0, age: 25, sex: 'male' }), null);
});

console.log('\n--- Testing TDEE Multipliers ---');

it('calculates TDEE for all activity levels', () => {
  const bmr = 1500;
  assert.strictEqual(calculateTDEE(bmr, 'sedentary'), Math.round(1500 * 1.2)); // 1800
  assert.strictEqual(calculateTDEE(bmr, 'light'), Math.round(1500 * 1.375)); // 2063
  assert.strictEqual(calculateTDEE(bmr, 'moderate'), Math.round(1500 * 1.55)); // 2325
  assert.strictEqual(calculateTDEE(bmr, 'active'), Math.round(1500 * 1.725)); // 2588
  assert.strictEqual(calculateTDEE(bmr, 'extra_active'), Math.round(1500 * 1.9)); // 2850
});

it('defaults to moderate multiplier if unknown activity level', () => {
  assert.strictEqual(calculateTDEE(1500, 'unknown_level'), Math.round(1500 * 1.55));
});

console.log('\n--- Testing Full Nutrition Goal Recommendations ---');

it('calculates maintenance goals accurately', () => {
  const profile = { weightKg: 70, heightCm: 175, age: 30, sex: 'male', activityLevel: 'moderate', goal: 'maintain' };
  // bmr = 10*70 + 6.25*175 - 5*30 + 5 = 700 + 1093.75 - 150 + 5 = 1648.75 => 1649
  // tdee = 1649 * 1.55 = 2555.95 => 2556
  const result = calculateNutritionGoals(profile);
  assert.strictEqual(result.bmr, 1649);
  assert.strictEqual(result.tdee, 2556);
  assert.strictEqual(result.suggestedCalorieGoal, 2556);
  assert.strictEqual(result.hasCustomMetrics, true);
});

it('applies conservative weight loss deficit (-400 kcal)', () => {
  const profile = { weightKg: 80, heightCm: 180, age: 28, sex: 'male', activityLevel: 'moderate', goal: 'lose' };
  const res = calculateNutritionGoals(profile);
  assert.strictEqual(res.suggestedCalorieGoal, res.tdee - 400);
});

it('applies controlled surplus for weight gain (+350 kcal)', () => {
  const profile = { weightKg: 65, heightCm: 172, age: 22, sex: 'male', activityLevel: 'active', goal: 'gain' };
  const res = calculateNutritionGoals(profile);
  assert.strictEqual(res.suggestedCalorieGoal, res.tdee + 350);
});

it('enforces safety floors: prevents female goal from dropping below 1200 kcal', () => {
  // Very light female trying to lose weight aggressively
  const profile = { weightKg: 42, heightCm: 148, age: 40, sex: 'female', activityLevel: 'sedentary', goal: 'lose' };
  const res = calculateNutritionGoals(profile);
  assert.ok(res.suggestedCalorieGoal >= 1200, `Expected >= 1200, got ${res.suggestedCalorieGoal}`);
});

it('enforces safety floors: prevents male goal from dropping below 1500 kcal', () => {
  const profile = { weightKg: 50, heightCm: 155, age: 50, sex: 'male', activityLevel: 'sedentary', goal: 'lose' };
  const res = calculateNutritionGoals(profile);
  assert.ok(res.suggestedCalorieGoal >= 1500, `Expected >= 1500, got ${res.suggestedCalorieGoal}`);
});

it('falls back cleanly to default 2000 kcal when metrics are omitted', () => {
  const res = calculateNutritionGoals({});
  assert.strictEqual(res.suggestedCalorieGoal, DEFAULT_CALORIE_GOAL);
  assert.strictEqual(res.bmr, null);
  assert.strictEqual(res.hasCustomMetrics, false);
});

console.log('\n--- Testing Macronutrient Calculations (25/50/25 Distribution) ---');

it('calculates macros correctly for 2000 kcal', () => {
  const macros = calculateMacros(2000);
  // Protein: (2000 * 0.25) / 4 = 125g
  // Carbs: (2000 * 0.50) / 4 = 250g
  // Fat: (2000 * 0.25) / 9 = 55.55 => 56g
  assert.strictEqual(macros.proteinGrams, 125);
  assert.strictEqual(macros.carbsGrams, 250);
  assert.strictEqual(macros.fatGrams, 56);
});

it('calculates macros correctly for 2400 kcal', () => {
  const macros = calculateMacros(2400);
  assert.strictEqual(macros.proteinGrams, 150);
  assert.strictEqual(macros.carbsGrams, 300);
  assert.strictEqual(macros.fatGrams, 67);
});

it('clamps macros to minimum safe floor if passed 0 or negative calories', () => {
  const macros = calculateMacros(0);
  assert.ok(macros.proteinGrams > 0);
  assert.ok(macros.carbsGrams > 0);
  assert.ok(macros.fatGrams > 0);
});

console.log(`\n========================================`);
console.log(`Summary: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

