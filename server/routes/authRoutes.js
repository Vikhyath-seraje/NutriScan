// routes/authRoutes.js
// ---------------------------------------------------------
// Authentication routes:
//   POST /api/auth/register
//   POST /api/auth/login
//   GET  /api/auth/me
// ---------------------------------------------------------

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, registerRules, loginRules } = require('../middleware/validate');

// Strict rate limiter for login to prevent brute force (5 attempts per 15 mins)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', registerRules, validate, register);
router.post('/login', loginLimiter, loginRules, validate, login);
router.get('/me', protect, getMe);

module.exports = router;

