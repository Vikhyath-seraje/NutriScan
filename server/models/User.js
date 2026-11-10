// models/User.js
// ---------------------------------------------------------
// Mongoose schema for NutriScan users.
// Stores:
//   - Account credentials (email, hashed password, name)
//   - Optional physical profile (age, sex, height, weight, activityLevel, goal)
//   - Daily calorie and macronutrient targets
// ---------------------------------------------------------

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password in queries by default
    },
    // Physical profile for calorie target calculation (all optional)
    profile: {
      age: { type: Number, min: 10, max: 120 },
      sex: { type: String, enum: ['male', 'female'] },
      heightCm: { type: Number, min: 100, max: 250 },
      weightKg: { type: Number, min: 20, max: 300 },
      activityLevel: {
        type: String,
        enum: ['sedentary', 'light', 'moderate', 'active', 'extra_active'],
        default: 'moderate',
      },
      goal: {
        type: String,
        enum: ['lose', 'maintain', 'gain'],
        default: 'maintain',
      },
      preferredUnits: {
        type: String,
        enum: ['metric', 'imperial'],
        default: 'metric',
      },
    },
    // Daily nutrition targets
    calorieGoal: {
      type: Number,
      default: 2000,
      min: [800, 'Calorie goal cannot be below 800 kcal'],
      max: [6000, 'Calorie goal cannot exceed 6000 kcal'],
    },
    macroGoals: {
      proteinGrams: { type: Number, default: 150 },
      carbsGrams: { type: Number, default: 250 },
      fatGrams: { type: Number, default: 65 },
    },
  },
  {
    timestamps: true, // auto creates createdAt and updatedAt
  }
);

// ── Hash password before saving if modified ───────────────
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// ── Instance method to compare entered password with hash ─
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// ── Transform JSON output to remove internal fields ───────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
