// api/index.js
// ---------------------------------------------------------
// Vercel Serverless Function entry point for NutriScan backend.
// ---------------------------------------------------------

const mongoose = require('mongoose');
const app = require('../server/app');

// Ensure MongoDB URI is picked up either from Vercel env or local
const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://vikhyathseraje_db_user:NutriScan12345@cluster0.iiqrshi.mongodb.net/nutriscan?retryWrites=true&w=majority';

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET =
    '52829ce54c92adf7f7862866d4b0fde1fc4cf2e9c02c3bb9a21b422a4ce423bfe1359b87d85b7c9d473012073ba8e1d816c3cf161c4cb0a1ca65113c214353a0';
}

let isConnected = false;

async function connectToDatabase() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    const db = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      bufferCommands: false, // Prevents serverless functions hanging on disconnected DB
    });
    isConnected = db.connections[0].readyState === 1;
    console.log('✅ Connected to MongoDB Atlas in Vercel');
  } catch (err) {
    console.error('❌ MongoDB Connection Error in Vercel:', err.message);
    throw err;
  }
}

module.exports = async (req, res) => {
  try {
    await connectToDatabase();
    return app(req, res);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Database connection failed: ${err.message}`,
    });
  }
};
