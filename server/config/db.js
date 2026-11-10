// config/db.js
// ---------------------------------------------------------
// Connects to MongoDB Atlas using the MONGO_URI from .env
// Called once when the server starts.
// If the connection fails, the process exits so we don't
// serve requests against a disconnected database.
// ---------------------------------------------------------

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options silence deprecation warnings in Mongoose 6+
      // They are the defaults in Mongoose 7+ but safe to set explicitly.
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    // Exit with failure code so the process manager (nodemon/PM2) knows
    process.exit(1);
  }
};

module.exports = connectDB;

