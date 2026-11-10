// server.js
// ---------------------------------------------------------
// Entry point for the Node.js process.
// Responsibilities:
//   1. Load environment variables from .env
//   2. Connect to MongoDB
//   3. Import the configured Express app
//   4. Start the HTTP server on the configured PORT
//
// Keep this file minimal. All Express config lives in app.js.
// ---------------------------------------------------------

// Load .env variables FIRST — before any other require()
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB, then start the HTTP server.
// If DB connection fails, connectDB() calls process.exit(1).
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 NutriScan server running on http://localhost:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  });
};

startServer();

