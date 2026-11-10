// utils/formatters.js
// ---------------------------------------------------------
// Pure helper functions for formatting numbers, dates and
// nutrition values displayed in the UI.
// These are "pure" — they take input, return output, no
// side effects. Easy to unit test.
// ---------------------------------------------------------

/**
 * Round a number to a specified number of decimal places.
 * @param {number} value
 * @param {number} decimals - default 1
 * @returns {number}
 */
export const roundTo = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) return 0;
  return Math.round(value * 10 ** decimals) / 10 ** decimals;
};

/**
 * Format a calorie value as a whole number string.
 * @param {number} kcal
 * @returns {string} e.g. "342 kcal"
 */
export const formatCalories = (kcal) => {
  if (kcal === null || kcal === undefined) return '— kcal';
  return `${Math.round(kcal)} kcal`;
};

/**
 * Format a macro value with one decimal place and unit.
 * @param {number} grams
 * @param {string} unit - default "g"
 * @returns {string} e.g. "12.4 g"
 */
export const formatMacro = (grams, unit = 'g') => {
  if (grams === null || grams === undefined) return `— ${unit}`;
  return `${roundTo(grams, 1)} ${unit}`;
};

/**
 * Format a Date object to a human-readable local date string.
 * @param {Date|string} date
 * @returns {string} e.g. "Tuesday, 10 November 2026"
 */
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format a Date to time string in user's local timezone.
 * @param {Date|string} date
 * @returns {string} e.g. "7:30 PM"
 */
export const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calculate percentage, capped at 100.
 * @param {number} consumed
 * @param {number} goal
 * @returns {number} 0–100
 */
export const calcPercentage = (consumed, goal) => {
  if (!goal || goal <= 0) return 0;
  return Math.min(Math.round((consumed / goal) * 100), 100);
};

/**
 * Returns a CSS colour class based on calorie % of goal.
 * Used for colour-coding progress bars.
 * @param {number} percentage
 * @returns {'success'|'warning'|'danger'}
 */
export const getCalorieStatus = (percentage) => {
  if (percentage >= 100) return 'danger';
  if (percentage >= 80) return 'warning';
  return 'success';
};

