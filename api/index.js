// api/index.js
// ---------------------------------------------------------
// Vercel Serverless Function entry point for NutriScan backend.
// Bridges the Express app into Vercel's serverless environment.
// ---------------------------------------------------------

require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') });
const mongoose = require('mongoose');
const app = require('../server/app');

// Cache database connection across serverless warm invocations
let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = db.connections[0].readyState === 1;
    console.log('✅ MongoDB connected in Vercel Serverless');
  } catch (err) {
    console.error('❌ Vercel MongoDB connection error:', err.message);
  }
};

module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};

