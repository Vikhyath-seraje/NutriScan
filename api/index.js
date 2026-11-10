// api/index.js
// ---------------------------------------------------------
// Vercel Serverless Function entry point for NutriScan.
// ---------------------------------------------------------

const mongoose = require('mongoose');
const app = require('../server/app');

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://vikhyathseraje_db_user:NutriScan12345@cluster0.iiqrshi.mongodb.net/nutriscan?retryWrites=true&w=majority';

let cachedDb = null;

async function connectDB() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    cachedDb = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });
    console.log('✅ MongoDB connected in Vercel Serverless');
    return cachedDb;
  } catch (err) {
    console.error('❌ MongoDB Atlas Connection Error:', err.message);
    cachedDb = null;
    throw err;
  }
}

// Fast health-check that bypasses DB connection requirement
app.get('/api/health-fast', (req, res) => {
  return res.status(200).json({
    status: 'UP',
    serverless: true,
    mongoState: mongoose.connection.readyState,
    time: new Date().toISOString(),
  });
});

module.exports = async (req, res) => {
  // Let health-fast pass without waiting for DB
  if (req.url === '/api/health-fast' || req.url === '/health-fast') {
    return app(req, res);
  }

  try {
    await connectDB();
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Database connection failed. Please ensure MongoDB Atlas Network Access allows 0.0.0.0/0. Error: ${err.message}`,
    });
  }

  return app(req, res);
};
