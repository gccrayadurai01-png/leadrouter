/**
 * Database Health Check Middleware
 * Checks database connectivity before processing requests
 */

const pool = require('../db');

async function checkDatabaseHealth(req, res, next) {
  try {
    // Simple query to check connection
    await pool.query('SELECT 1');
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


