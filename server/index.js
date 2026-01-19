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
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy - required for Render and other reverse proxies
// Set to 1 to only trust the first proxy (Render's load balancer)
// This prevents IP-based rate limiting bypass while still allowing correct IP detection
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  contentSecurityPolicy: isProduction 
    ? {
        // Production CSP - strict but allows same-origin API calls
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'"], // Same origin only (React app and API on same domain)
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Needed for React inline styles
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "data:"],
        },
      }
    : {
        // Development CSP - allows localhost connections
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", "http://localhost:3001", "http://localhost:3000"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Needed for React dev
          styleSrc: ["'self'", "'unsafe-inline'"], // Needed for inline styles
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "data:"],
        },
      }
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
    
    // Check if users table exists and has data
    let usersCount = 0;
    try {
      const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
      usersCount = parseInt(usersResult.rows[0].count);
    } catch (err) {
      // Table might not exist
    }
    
    res.json({ 
      status: 'ok', 
      database: 'connected',
      usersTableExists: usersCount > 0,
      usersCount: usersCount,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      database: 'disconnected',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString() 
    });
  }
});

// TEMPORARY: Database setup endpoint - REMOVE AFTER SETUP!
// ⚠️ SECURITY WARNING: Remove this endpoint after database is set up!
app.post('/api/setup-database', async (req, res) => {
  try {
    const { setupDatabase } = require('./db/setup');
    await setupDatabase();
    res.json({ 
      success: true, 
      message: 'Database setup completed successfully!',
      warning: 'Please remove this endpoint for security.'
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ 
      error: 'Setup failed', 
      message: process.env.NODE_ENV === 'development' ? error.message : 'Check server logs'
    });
  }
});

// TEMPORARY: Migration endpoint to add missing columns - REMOVE AFTER MIGRATION!
// ⚠️ SECURITY WARNING: Remove this endpoint after migration is complete!
app.post('/api/migrate-add-columns', async (req, res) => {
  const pool = require('./db');
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Add missing columns to assignments table
    await client.query(`
      ALTER TABLE assignments 
      ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS company_domain VARCHAR(255),
      ADD COLUMN IF NOT EXISTS is_manual BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_company_match BOOLEAN NOT NULL DEFAULT false
    `);
    
    // Add indexes for company matching
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_assignments_company_domain ON assignments(company_domain)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_assignments_company_name ON assignments(company_name)
    `);
    
    await client.query('COMMIT');
    
    console.log('✅ Migration: Added missing columns to assignments table');
    
    res.json({ 
      success: true, 
      message: 'Migration completed successfully! Missing columns added to assignments table.',
      warning: 'Please remove this endpoint for security.'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration error:', error);
    res.status(500).json({ 
      error: 'Migration failed', 
      message: process.env.NODE_ENV === 'development' ? error.message : 'Check server logs',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reps', require('./routes/reps'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/hubspot', require('./routes/hubspot').router);

// Serve React app in production or if build exists
const buildPath = path.join(__dirname, '../client/build');
const buildExists = fs.existsSync(buildPath);

// Root route handler (only if React app is not built)
if (!buildExists) {
  app.get('/', (req, res) => {
    res.json({
      message: 'LeadRouter API Server',
      status: 'running',
      environment: process.env.NODE_ENV || 'development',
      buildAvailable: false,
      apiEndpoints: {
        health: '/health',
        auth: '/api/auth',
        reps: '/api/reps',
        assignments: '/api/assignments',
        audit: '/api/audit',
        hubspot: '/api/hubspot'
      },
      note: 'React app build not found. Run "npm run build" to build the client application.'
    });
  });
}

if (isProduction || buildExists) {
  if (buildExists) {
    app.use(express.static(buildPath));
    
    // Serve React app for all non-API routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(buildPath, 'index.html'));
    });
  } else if (isProduction) {
    console.warn('⚠️  Production mode but React build not found at:', buildPath);
    console.warn('   Run: npm run build');
  }
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler (only if React app is not being served)
if (!isProduction && !buildExists) {
  app.use((req, res) => {
    res.status(404).json({ 
      error: 'Route not found',
      availableRoutes: {
        root: '/',
        health: '/health',
        api: '/api/*'
      }
    });
  });
}

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 LeadRouter server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test database connection on startup
  try {
    const pool = require('./db');
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Auto-migrate: Check and add missing columns if needed
    try {
      const checkColumns = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'assignments' 
        AND column_name IN ('company_name', 'company_domain', 'is_manual', 'is_company_match')
      `);
      
      const existingColumns = checkColumns.rows.map(r => r.column_name);
      const requiredColumns = ['company_name', 'company_domain', 'is_manual', 'is_company_match'];
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('⚠️  Missing columns detected, running auto-migration...');
        await pool.query(`
          ALTER TABLE assignments 
          ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
          ADD COLUMN IF NOT EXISTS company_domain VARCHAR(255),
          ADD COLUMN IF NOT EXISTS is_manual BOOLEAN NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS is_company_match BOOLEAN NOT NULL DEFAULT false
        `);
        
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_assignments_company_domain ON assignments(company_domain)
        `);
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_assignments_company_name ON assignments(company_name)
        `);
        
        console.log('✅ Auto-migration completed: Missing columns added');
      }
    } catch (migrationError) {
      console.warn('⚠️  Auto-migration warning:', migrationError.message);
      // Don't fail startup if migration has issues
    }
  } catch (error) {
    console.error('❌ Database connection failed on startup:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error details:', {
      message: error.message,
      code: error.code,
      host: process.env.DATABASE_URL ? 'from DATABASE_URL' : process.env.DB_HOST,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    });
    console.error('   The server will continue, but database operations may fail.');
    console.error('   Check:');
    console.error('   1. DATABASE_URL is set in Render environment variables');
    console.error('   2. Database is linked to your service (Settings → Databases)');
    console.error('   3. Database is running and accessible');
  }
});

module.exports = app;

