// seed.js
// ---------------------------------------------------------
// NutriScan Database Seeder Script
// Populates MongoDB Atlas with:
//   - A demonstration user account
//   - A complete 7-day history of meals with verified nutrients
//   - Cached food records from the Indian foods dataset
//
// Usage: node seed.js
// ---------------------------------------------------------

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Meal = require('./models/Meal');
const FoodCache = require('./models/FoodCache');
const { curatedIndianFoods } = require('./services/nutritionService');

const DEMO_EMAIL = 'demo@nutriscan.com';
const DEMO_PASSWORD = 'Password123!';

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    // ── 1. Seed or reset demo user ──────────────────────────
    await User.deleteOne({ email: DEMO_EMAIL });

    const demoUser = await User.create({
      name: 'Rahul Sharma',
      email: DEMO_EMAIL,
      passwordHash: DEMO_PASSWORD, // Will be hashed by User pre-save hook
      profile: {
        age: 24,
        sex: 'male',
        heightCm: 175,
        weightKg: 72,
        activityLevel: 'moderate',
        goal: 'maintain',
        preferredUnits: 'metric',
      },
      calorieGoal: 2150,
      macroGoals: {
        proteinGrams: 135,
        carbsGrams: 270,
        fatGrams: 60,
      },
    });

    console.log(`✅ Demo User Created: ${demoUser.email} (Password: ${DEMO_PASSWORD})`);

    // ── 2. Seed FoodCache records ───────────────────────────
    await FoodCache.deleteMany({});
    const cacheEntries = curatedIndianFoods.map((f) => ({
      externalId: f.externalId,
      name: f.name,
      normalizedName: f.name.toLowerCase(),
      source: f.source || 'indian_db',
      category: f.category || 'General',
      nutrientsPer100g: f.nutrientsPer100g,
      servingSizeGrams: f.servingSizeGrams || 100,
      servingDescription: f.servingDescription || '100g',
      lastFetchedAt: new Date(),
    }));
    await FoodCache.insertMany(cacheEntries);
    console.log(`✅ Seeded ${cacheEntries.length} items into FoodCache`);

    // ── 3. Seed 7 Days of Meals ─────────────────────────────
    await Meal.deleteMany({ userId: demoUser._id });

    const mealTemplates = [
      {
        type: 'Breakfast',
        foods: [
          {
            name: 'Idli (Steamed Rice and Lentil Cake)',
            source: 'indian_db',
            confirmedGrams: 150,
            nutrientsPer100g: { energy: 140, protein: 4.5, carbs: 28.0, fat: 0.4, fiber: 1.8 },
          },
          {
            name: 'Sambar (Vegetable Lentil Stew)',
            source: 'indian_db',
            confirmedGrams: 150,
            nutrientsPer100g: { energy: 65, protein: 2.8, carbs: 9.5, fat: 1.8, fiber: 2.2 },
          },
          {
            name: 'Coconut Chutney',
            source: 'indian_db',
            confirmedGrams: 30,
            nutrientsPer100g: { energy: 195, protein: 2.2, carbs: 6.8, fat: 18.0, fiber: 3.4 },
          },
        ],
      },
      {
        type: 'Lunch',
        foods: [
          {
            name: 'Steamed White Rice (Cooked)',
            source: 'indian_db',
            confirmedGrams: 200,
            nutrientsPer100g: { energy: 130, protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4 },
          },
          {
            name: 'Dal Tadka (Yellow Lentil Curry)',
            source: 'indian_db',
            confirmedGrams: 150,
            nutrientsPer100g: { energy: 115, protein: 5.8, carbs: 14.5, fat: 4.0, fiber: 3.2 },
          },
          {
            name: 'Paneer Butter Masala',
            source: 'indian_db',
            confirmedGrams: 120,
            nutrientsPer100g: { energy: 235, protein: 8.5, carbs: 9.0, fat: 18.5, fiber: 1.8 },
          },
        ],
      },
      {
        type: 'Snacks',
        foods: [
          {
            name: 'Masala Chai with Milk and Sugar',
            source: 'indian_db',
            confirmedGrams: 150,
            nutrientsPer100g: { energy: 68, protein: 2.1, carbs: 8.5, fat: 2.8, fiber: 0.1 },
          },
          {
            name: 'Banana (Raw)',
            source: 'usda',
            confirmedGrams: 100,
            nutrientsPer100g: { energy: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6 },
          },
        ],
      },
      {
        type: 'Dinner',
        foods: [
          {
            name: 'Roti / Chapati (Whole Wheat Flatbread)',
            source: 'indian_db',
            confirmedGrams: 105, // approx. 3 rotis
            nutrientsPer100g: { energy: 290, protein: 9.0, carbs: 55.0, fat: 3.5, fiber: 9.5 },
          },
          {
            name: 'Dal Tadka (Yellow Lentil Curry)',
            source: 'indian_db',
            confirmedGrams: 150,
            nutrientsPer100g: { energy: 115, protein: 5.8, carbs: 14.5, fat: 4.0, fiber: 3.2 },
          },
        ],
      },
    ];

    const today = new Date();
    let totalMealsCreated = 0;

    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const mealDate = new Date(today);
      mealDate.setDate(mealDate.getDate() - dayOffset);

      // Create Breakfast, Lunch, Snacks, Dinner for each day
      for (const tpl of mealTemplates) {
        // Vary gram weights slightly each day for realistic variance
        const varianceFactor = 0.9 + Math.random() * 0.2; // 0.9x to 1.1x

        let totalEnergy = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        let totalFiber = 0;

        const calculatedFoods = tpl.foods.map((food) => {
          const grams = Math.round(food.confirmedGrams * varianceFactor);
          const nutrients = food.nutrientsPer100g;

          const energy = Math.round((nutrients.energy * grams) / 100);
          const protein = Math.round(((nutrients.protein * grams) / 100) * 10) / 10;
          const carbs = Math.round(((nutrients.carbs * grams) / 100) * 10) / 10;
          const fat = Math.round(((nutrients.fat * grams) / 100) * 10) / 10;
          const fiber = Math.round(((nutrients.fiber * grams) / 100) * 10) / 10;

          totalEnergy += energy;
          totalProtein += protein;
          totalCarbs += carbs;
          totalFat += fat;
          totalFiber += fiber;

          return {
            name: food.name,
            source: food.source,
            confirmedGrams: grams,
            nutrientsPer100g: nutrients,
            calculatedNutrients: { energy, protein, carbs, fat, fiber },
            confidence: 'high',
            userConfirmed: true,
          };
        });

        // Set meal time appropriately
        const mealTime = new Date(mealDate);
        if (tpl.type === 'Breakfast') mealTime.setHours(8, 30, 0);
        else if (tpl.type === 'Lunch') mealTime.setHours(13, 0, 0);
        else if (tpl.type === 'Snacks') mealTime.setHours(17, 15, 0);
        else if (tpl.type === 'Dinner') mealTime.setHours(20, 30, 0);

        await Meal.create({
          userId: demoUser._id,
          mealType: tpl.type,
          consumedAt: mealTime,
          foods: calculatedFoods,
          totals: {
            energy: Math.round(totalEnergy),
            protein: Math.round(totalProtein * 10) / 10,
            carbs: Math.round(totalCarbs * 10) / 10,
            fat: Math.round(totalFat * 10) / 10,
            fiber: Math.round(totalFiber * 10) / 10,
          },
          notes: `${tpl.type} log seeded for demo`,
        });

        totalMealsCreated++;
      }
    }

    console.log(`✅ Seeded ${totalMealsCreated} meal logs across the last 7 days`);
    console.log('\n======================================================');
    console.log('🎉 NutriScan Database Successfully Seeded!');
    console.log(`👉 Login with: ${DEMO_EMAIL}`);
    console.log(`👉 Password:   ${DEMO_PASSWORD}`);
    console.log('======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedDatabase();

