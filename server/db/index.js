/**
 * Database Connection Pool
 * Supports both DATABASE_URL (Render, Heroku) and individual DB_* variables
 */

const { Pool } = require('pg');
require('dotenv').config();

// Use DATABASE_URL if available (Render, Heroku, etc.), otherwise use individual vars
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      // Enable SSL for Render databases (dpg- hostname), AWS, or render.com URLs
      ssl: process.env.DATABASE_URL.includes('render.com') || 
           process.env.DATABASE_URL.includes('dpg-') || 
           process.env.DATABASE_URL.includes('amazonaws.com')
        ? { rejectUnauthorized: false }
        : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'leadrouter',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Log connection config (without password) for debugging
if (process.env.NODE_ENV === 'development' || process.env.DEBUG_DB) {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    console.log('📊 Database Config:', {
      host: url.hostname,
      port: url.port,
      database: url.pathname.slice(1),
      user: url.username,
      ssl: poolConfig.ssl ? 'enabled' : 'disabled'
    });
  } else {
    console.log('📊 Database Config:', {
      host: poolConfig.host,
      port: poolConfig.port,
      database: poolConfig.database,
      user: poolConfig.user,
      ssl: poolConfig.ssl ? 'enabled' : 'disabled'
    });
  }
}

module.exports = pool;

