// middleware/auth.js
// ---------------------------------------------------------
// JWT Authentication Middleware.
// Extracts and verifies Bearer token from the Authorization header:
//   Authorization: Bearer <token>
// If valid, fetches the user from DB (minus passwordHash) and attaches to req.user.
// If invalid or missing, returns 401 Unauthorized.
// ---------------------------------------------------------

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/responseHelpers');

const protect = async (req, res, next) => {
  let token = null;

  // 1. Check for Authorization header with Bearer format
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. Reject if no token
  if (!token) {
    return sendError(
      res,
      'Access denied. No authentication token provided.',
      401
    );
  }

  try {
    // 3. Verify token signature
    const secret =
      process.env.JWT_SECRET ||
      '52829ce54c92adf7f7862866d4b0fde1fc4cf2e9c02c3bb9a21b422a4ce423bfe1359b87d85b7c9d473012073ba8e1d816c3cf161c4cb0a1ca65113c214353a0';
    const decoded = jwt.verify(token, secret);

    // 4. Find user in database
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return sendError(
        res,
        'The user belonging to this token no longer exists.',
        401
      );
    }

    // 5. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);

    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Session expired. Please log in again.', 401);
    }

    return sendError(res, 'Invalid token. Please log in again.', 401);
  }
};

module.exports = { protect };

