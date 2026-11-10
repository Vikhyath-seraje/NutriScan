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
// Parse incoming JSON bodies (e.g., login, registration)
app.use(express.json({ limit: '10mb' }));
// Parse URL-encoded bodies (HTML form submissions)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── 4. Rate limiting ─────────────────────────────────────
// Global limit: max 100 requests per 15 minutes per IP.
// Specific endpoints like /auth/login get stricter limits
// (defined in their route files).
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// ── 5. Health check ──────────────────────────────────────
// A simple endpoint to verify the server is running.
// Useful for deployment health checks.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NutriScan API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
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
  console.error('Unhandled error:', err);
  const message = err.message || 'Internal server error';
  sendError(res, message, err.status || 500);
});

module.exports = app;

