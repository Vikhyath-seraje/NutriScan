// controllers/dashboardController.js
// ---------------------------------------------------------
// Dashboard analytics and reporting controller.
// Aggregates user's meals by day, week, and month.
// Generates CSV reports for export.
// ---------------------------------------------------------

const Meal = require('../models/Meal');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseHelpers');

// @desc    Get daily summary: consumed vs goal, macros, meal slots
// @route   GET /api/dashboard/daily
// @access  Private
const getDailyDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];

    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const meals = await Meal.find({
      userId: req.user._id,
      consumedAt: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ consumedAt: 1 });

    const consumed = {
      energy: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    };

    // Group meals into slots
    const mealBreakdown = {
      Breakfast: { calories: 0, items: [] },
      Lunch: { calories: 0, items: [] },
      Dinner: { calories: 0, items: [] },
      Snacks: { calories: 0, items: [] },
    };

    for (const m of meals) {
      consumed.energy += m.totals.energy || 0;
      consumed.protein += m.totals.protein || 0;
      consumed.carbs += m.totals.carbs || 0;
      consumed.fat += m.totals.fat || 0;
      consumed.fiber += m.totals.fiber || 0;

      const type = m.mealType || 'Snacks';
      if (mealBreakdown[type]) {
        mealBreakdown[type].calories += m.totals.energy || 0;
        for (const f of m.foods) {
          mealBreakdown[type].items.push(`${f.name} (${f.confirmedGrams}g)`);
        }
      }
    }

    const calorieGoal = user.calorieGoal || 2000;
    const remainingCalories = Math.max(calorieGoal - consumed.energy, 0);

    return sendSuccess(res, {
      date: dateStr,
      calorieGoal,
      macroGoals: user.macroGoals || { proteinGrams: 150, carbsGrams: 250, fatGrams: 65 },
      consumed: {
        energy: Math.round(consumed.energy),
        protein: Math.round(consumed.protein * 10) / 10,
        carbs: Math.round(consumed.carbs * 10) / 10,
        fat: Math.round(consumed.fat * 10) / 10,
        fiber: Math.round(consumed.fiber * 10) / 10,
      },
      remainingCalories: Math.round(remainingCalories),
      mealBreakdown,
      mealsLoggedCount: meals.length,
    });
  } catch (error) {
    console.error('Daily dashboard error:', error);
    return sendError(res, 'Error generating daily summary', 500);
  }
};

// @desc    Get 7-day weekly calorie breakdown for Recharts
// @route   GET /api/dashboard/weekly
// @access  Private
const getWeeklyDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const calorieGoal = user.calorieGoal || 2000;

    // Get the last 7 days ending today
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const start = new Date(d);
      start.setHours(0, 0, 0, 0);

      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const meals = await Meal.find({
        userId: req.user._id,
        consumedAt: { $gte: start, $lte: end },
      });

      const calories = meals.reduce((sum, m) => sum + (m.totals.energy || 0), 0);

      days.push({
        date: dateString,
        day: dayName,
        calories: Math.round(calories),
        goal: calorieGoal,
      });
    }

    return sendSuccess(res, {
      days,
      calorieGoal,
      averageCalories: Math.round(
        days.reduce((s, d) => s + d.calories, 0) / days.length
      ),
    });
  } catch (error) {
    console.error('Weekly dashboard error:', error);
    return sendError(res, 'Error generating weekly trend', 500);
  }
};

// @desc    Export meal logs as CSV
// @route   GET /api/dashboard/export-csv
// @access  Private
const exportCSV = async (req, res) => {
  try {
    const meals = await Meal.find({ userId: req.user._id }).sort({ consumedAt: -1 });

    const headers = [
      'Date',
      'Time',
      'Meal Type',
      'Food Items',
      'Total Calories (kcal)',
      'Protein (g)',
      'Carbs (g)',
      'Fat (g)',
      'Fiber (g)',
      'Notes',
    ];

    const rows = [headers.join(',')];

    for (const m of meals) {
      const date = new Date(m.consumedAt).toISOString().split('T')[0];
      const time = new Date(m.consumedAt).toTimeString().split(' ')[0];
      const foodNames = m.foods
        .map((f) => `"${f.name.replace(/"/g, '""')} (${f.confirmedGrams}g)"`)
        .join('; ');
      const notes = m.notes ? `"${m.notes.replace(/"/g, '""')}"` : '""';

      const row = [
        date,
        time,
        m.mealType,
        `"${foodNames}"`,
        m.totals.energy || 0,
        m.totals.protein || 0,
        m.totals.carbs || 0,
        m.totals.fat || 0,
        m.totals.fiber || 0,
        notes,
      ];
      rows.push(row.join(','));
    }

    const csvContent = rows.join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="nutriscan-diary-${Date.now()}.csv"`
    );
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('CSV export error:', error);
    return sendError(res, 'Failed to export CSV report', 500);
  }
};

module.exports = {
  getDailyDashboard,
  getWeeklyDashboard,
  exportCSV,
};

