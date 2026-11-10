// controllers/authController.js
// ---------------------------------------------------------
// Authentication controller:
//   - register: creates new user, hashes password, returns JWT
//   - login: verifies email & password, returns JWT
//   - getMe: returns currently authenticated user
// ---------------------------------------------------------

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/responseHelpers');

// Helper to generate signed JWT token
const generateToken = (userId) => {
  const secret =
    process.env.JWT_SECRET ||
    '52829ce54c92adf7f7862866d4b0fde1fc4cf2e9c02c3bb9a21b422a4ce423bfe1359b87d85b7c9d473012073ba8e1d816c3cf161c4cb0a1ca65113c214353a0';
  return jwt.sign({ id: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 'An account with this email already exists.', 400);
    }

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
      name,
      email,
      passwordHash: password,
    });

    // Generate JWT
    const token = generateToken(user._id);

    return sendSuccess(
      res,
      {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profile: user.profile,
          calorieGoal: user.calorieGoal,
          macroGoals: user.macroGoals,
        },
      },
      'Registration successful!',
      201
    );
  } catch (error) {
    console.error('Registration error:', error);
    return sendError(res, error.message || 'Server error during registration.', 500);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email and explicitly select passwordHash
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    // Generate token
    const token = generateToken(user._id);

    return sendSuccess(
      res,
      {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profile: user.profile,
          calorieGoal: user.calorieGoal,
          macroGoals: user.macroGoals,
        },
      },
      'Login successful!'
    );
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, error.message || 'Server error during login.', 500);
  }
};

// @desc    Get logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  return sendSuccess(res, { user: req.user }, 'User retrieved successfully');
};

module.exports = {
  register,
  login,
  getMe,
};

