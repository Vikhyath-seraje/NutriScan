// api/index.js
// ---------------------------------------------------------
// Vercel Serverless Function entry point for NutriScan backend.
// Exports Express app directly for Vercel Serverless Runtime.
// ---------------------------------------------------------

const mongoose = require('mongoose');
const app = require('../server/app');

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://vikhyathseraje_db_user:NutriScan12345@cluster0.iiqrshi.mongodb.net/nutriscan?retryWrites=true&w=majority';

let isConnected = false;

// Middleware to ensure MongoDB is connected before handling any API request
app.use(async (req, res, next) => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return next();
  }

  try {
    const db = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = db.connections[0].readyState === 1;
    console.log('✅ MongoDB connected in Vercel');
    next();
  } catch (err) {
    console.error('❌ MongoDB Connection Error in Vercel:', err.message);
    return res.status(500).json({
      success: false,
      error: `Database connection error: ${err.message}`,
    });
  }
});

module.exports = app;
