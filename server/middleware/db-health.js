/**
 * Database Health Check Middleware
 * Checks database connectivity before processing requests
 */

const mongoose = require('../db');

async function checkDatabaseHealth(req, res, next) {
  try {
    // Check MongoDB connection state
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB not connected');
    }
    next();
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(503).json({
      error: 'Database unavailable',
      message: 'The database connection is not available. Please contact support.'
    });
  }
}

module.exports = checkDatabaseHealth;
