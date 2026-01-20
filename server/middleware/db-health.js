/**
 * Database Health Check Middleware
 * Checks database connectivity before processing requests
 */

const mongoose = require('../db');

async function checkDatabaseHealth(req, res, next) {
  try {
    // Wait for MongoDB connection if still connecting
    if (mongoose.connection.readyState === 0) {
      // Connecting - wait up to 5 seconds
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('MongoDB connection timeout'));
        }, 5000);
        
        mongoose.connection.once('connected', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        mongoose.connection.once('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
        
        // If already connected, resolve immediately
        if (mongoose.connection.readyState === 1) {
          clearTimeout(timeout);
          resolve();
        }
      });
    }
    
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
