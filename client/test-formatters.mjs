// test-formatters.mjs — Phase 1 client utility tests
// Run: node test-formatters.mjs (from NutriScan/client directory)

import { roundTo, formatCalories, formatMacro, calcPercentage, getCalorieStatus } from './src/utils/formatters.js';

let pass = 0, fail = 0;

function test(name, got, expected) {
  if (String(got) === String(expected)) {
    console.log(`✅ ${name}: ${got}`);
    pass++;
  } else {
    console.error(`❌ ${name}: got=${got} expected=${expected}`);
    fail++;
  }
}

test('roundTo(12.456, 1)', roundTo(12.456, 1), 12.5);
test('roundTo(null) → 0', roundTo(null), 0);
test('roundTo(undefined) → 0', roundTo(undefined), 0);
test('formatCalories(342)', formatCalories(342), '342 kcal');
test('formatCalories(null)', formatCalories(null), '— kcal');
test('formatCalories(0)', formatCalories(0), '0 kcal');
test('formatMacro(12.4)', formatMacro(12.4), '12.4 g');
test('formatMacro(0)', formatMacro(0), '0 g');
test('calcPercentage(80,100)', calcPercentage(80, 100), 80);
test('calcPercentage over 100 capped', calcPercentage(150, 100), 100);
test('calcPercentage(0,0) → 0', calcPercentage(0, 0), 0);
test('calcPercentage(0, null) → 0', calcPercentage(0, null), 0);
test('getCalorieStatus(100) → danger', getCalorieStatus(100), 'danger');
test('getCalorieStatus(110) → danger', getCalorieStatus(110), 'danger');
test('getCalorieStatus(85) → warning', getCalorieStatus(85), 'warning');
test('getCalorieStatus(50) → success', getCalorieStatus(50), 'success');

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);

