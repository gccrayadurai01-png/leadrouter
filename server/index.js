/**
 * LeadRouter Server
 * Production Express server with weighted round robin lead assignment
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false
}));

// CORS configuration
if (isProduction) {
  // In production, serve React app from same origin, so CORS is less critical
  app.use(cors({
    origin: process.env.CLIENT_URL || false,
    credentials: true
  }));
} else {
  // Development: allow localhost:3000
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  }));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database health check (except health endpoint)
app.use((req, res, next) => {
  if (req.path === '/health') {
    return next();
  }
  const checkDatabaseHealth = require('./middleware/db-health');
  return checkDatabaseHealth(req, res, next);
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const pool = require('./db');
    await pool.query('SELECT 1');
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      database: 'disconnected',
      timestamp: new Date().toISOString() 
    });
  }
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reps', require('./routes/reps'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/hubspot', require('./routes/hubspot').router);

// Serve React app in production
if (isProduction) {
  const buildPath = path.join(__dirname, '../client/build');
  app.use(express.static(buildPath));
  
  // Serve React app for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler (only in development, production uses React router)
if (!isProduction) {
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LeadRouter server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

