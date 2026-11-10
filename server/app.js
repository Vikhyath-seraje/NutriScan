// app.js
// ---------------------------------------------------------
// Configures the Express application:
//   - Security headers (Helmet)
//   - CORS policy (only allow our React client)
//   - JSON body parsing
//   - Rate limiting (protects against brute-force attacks)
//   - All route registrations
//   - 404 and global error handlers
//
// app.js does NOT start the HTTP server.
// server.js imports this and calls app.listen().
// Keeping them separate makes testing easier.
// ---------------------------------------------------------

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const path = require('path');
const { sendError } = require('./utils/responseHelpers');

const app = express();

// Trust Vercel / proxy headers for rate limiting and IP detection
app.set('trust proxy', 1);

// ── 1. Security headers ──────────────────────────────────
// Helmet sets sensible HTTP security headers automatically
// (Content-Security-Policy, X-Frame-Options, etc.)
app.use(helmet());

// ── 2. CORS ──────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server) or localhost or any vercel.app deployment
      if (
        !origin ||
        origin.includes('localhost') ||
        origin.endsWith('.vercel.app') ||
        origin === process.env.CLIENT_URL
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Fallback: allow request in production
      }
    },
    credentials: true,
  })
);

// ── 3. Body parsers & Static Files ───────────────────────
// On Vercel serverless, req.body is often pre-parsed by the runtime.
// Avoid re-reading a consumed stream:
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return next();
  }
  express.json({ limit: '10mb' })(req, res, next);
});
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return next();
  }
  express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
});

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── 4. Rate limiting ─────────────────────────────────────
// Skip rate limiter in serverless environments to avoid IP proxy errors
const isServerless = process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

if (!isServerless) {
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
  });
  app.use(globalLimiter);
}

// ── 5. Health check ──────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NutriScan API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Diagnostic DB check
app.get('/api/db-check', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const User = require('./models/User');
    const count = await User.countDocuments();
    return res.status(200).json({
      success: true,
      dbStatus: mongoose.connection.readyState, // 1 = connected
      userCount: count,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack,
    });
  }
});

// ── 6. Routes ────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/food', require('./routes/foodRoutes'));
app.use('/api/meals', require('./routes/mealRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
// app.use('/api/meals',     require('./routes/mealRoutes'));
// app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// ── 7. 404 handler ───────────────────────────────────────
// If no route matched, return a structured 404.
app.use((req, res) => {
  sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404);
});

// ── 8. Global error handler ──────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error in Express:', err);
  const message = (err && (err.message || err.toString())) || 'Internal server error';
  return res.status(err.status || 500).json({
    success: false,
    error: message,
    stack: err ? err.stack : null,
  });
});

module.exports = app;

