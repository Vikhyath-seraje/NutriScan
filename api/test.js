// api/test.js
// ---------------------------------------------------------
// Diagnostic endpoint to check MongoDB connection and env on Vercel
// ---------------------------------------------------------

const mongoose = require('mongoose');

module.exports = async (req, res) => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      'mongodb+srv://vikhyathseraje_db_user:NutriScan12345@cluster0.iiqrshi.mongodb.net/nutriscan?retryWrites=true&w=majority';

    const maskedUri = mongoUri.replace(/:([^:@]+)@/, ':****@');

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });

    const User = require('../server/models/User');
    const userCount = await User.countDocuments();

    return res.status(200).json({
      status: 'OK',
      connected: true,
      mongoUri: maskedUri,
      userCount,
      envNode: process.env.NODE_ENV,
      jwtSecretLength: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
    });
  } catch (err) {
    return res.status(500).json({
      status: 'ERROR',
      message: err.message,
      stack: err.stack,
    });
  }
};
