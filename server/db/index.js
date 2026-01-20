/**
 * MongoDB Connection
 * Supports both MONGODB_URI (MongoDB Atlas, Render) and individual DB_* variables
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load .env from root directory (default) or server directory
const rootEnvPath = path.join(process.cwd(), '.env');
const serverEnvPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
} else if (fs.existsSync(serverEnvPath)) {
  require('dotenv').config({ path: serverEnvPath });
} else {
  // Try default location
  require('dotenv').config();
}

// Use MONGODB_URI if available (MongoDB Atlas, Render), otherwise use individual vars
const getConnectionString = () => {
  // Check for MONGODB_URI first (highest priority)
  if (process.env.MONGODB_URI) {
    let uri = process.env.MONGODB_URI.trim();
    
    // Fix common .env file mistakes:
    // 1. Remove "MONGODB_URI=" if it's included in the value
    if (uri.startsWith('MONGODB_URI=')) {
      uri = uri.replace(/^MONGODB_URI\s*=\s*/, '');
    }
    
    // 2. Remove any leading/trailing quotes
    uri = uri.replace(/^["']|["']$/g, '');
    
    uri = uri.trim();
    
    // Check if URI has placeholder password
    if (uri.includes('<db_password>') || uri.includes('<password>') || uri.match(/:[^:@]*<[^>]+>/)) {
      console.error('❌ ERROR: MONGODB_URI contains password placeholder!');
      console.error('   Found:', uri.match(/:[^:@]*<[^>]+>/)?.[0] || '<db_password>');
      console.error('   Please replace the placeholder with your actual MongoDB password.');
      console.error('');
      console.error('   Your current URI:');
      console.error('   ' + uri.replace(/:[^:@]+@/, ':****@'));
      console.error('');
      console.error('   Should be:');
      console.error('   mongodb+srv://raya:YOUR_ACTUAL_PASSWORD@leaderrouter.mxhm03r.mongodb.net/leadrouter?appName=leaderrouter');
      console.error('');
      throw new Error('MONGODB_URI contains password placeholder');
    }
    
    // Ensure database name is in the URI
    // Pattern: mongodb+srv://user:pass@host/?appName=... should become mongodb+srv://user:pass@host/leadrouter?appName=...
    if (uri.match(/\/\?/)) {
      // URI has /? (no database name before query params)
      return uri.replace(/\/(\?)/, '/leadrouter$1');
    } else if (uri.match(/\/[^\/\?]+\?/)) {
      // URI already has a database name before query params - keep it
      return uri;
    } else if (uri.match(/^mongodb\+srv:\/\/[^\/]+\/?$/)) {
      // URI ends with just / or nothing after host
      return uri.replace(/\/(\?|$)/, '/leadrouter$1');
    } else if (!uri.includes('/') || uri.endsWith('/')) {
      // URI has no path or ends with /
      return uri.replace(/\/(\?|$)/, '/leadrouter$1');
    }
    
    // URI already has database name or is valid
    return uri;
  }
  
  // If MONGODB_URI is not set, require it (no localhost fallback)
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ERROR: MONGODB_URI is required in production!');
    console.error('   Please set MONGODB_URI in your environment variables.');
    console.error('   Example: mongodb+srv://username:password@cluster.mongodb.net/leadrouter');
    throw new Error('MONGODB_URI is required in production');
  }
  
  // Build connection string from individual variables (development only)
  const host = process.env.DB_HOST;
  if (!host) {
    console.error('❌ ERROR: MONGODB_URI or DB_HOST must be set!');
    console.error('   For MongoDB Atlas, set MONGODB_URI');
    console.error('   For local MongoDB, set DB_HOST=localhost');
    throw new Error('Database connection configuration missing');
  }
  
  // MongoDB default port is 27017, not 5432 (PostgreSQL)
  let port = process.env.DB_PORT || 27017;
  // If port is set to PostgreSQL port (5432), use MongoDB default instead
  if (port === '5432' || port === 5432) {
    console.warn('⚠️  DB_PORT is set to 5432 (PostgreSQL port). Using MongoDB default port 27017 instead.');
    port = 27017;
  }
  const database = process.env.DB_NAME || 'leadrouter';
  const user = process.env.DB_USER || '';
  const password = process.env.DB_PASSWORD || '';
  
  // Detect PostgreSQL credentials and warn user
  if (user && user.toLowerCase() === 'postgres') {
    console.warn('⚠️  DB_USER is set to "postgres" (PostgreSQL default). Ignoring authentication for MongoDB.');
    console.warn('   To use MongoDB Atlas, set MONGODB_URI instead.');
    console.warn('   For local MongoDB without auth, remove DB_USER and DB_PASSWORD.\n');
  }
  
  // Only use authentication if:
  // 1. User and password are provided AND
  // 2. User is NOT "postgres" (PostgreSQL default username)
  // This prevents using PostgreSQL credentials with MongoDB
  if (user && password && user.toLowerCase() !== 'postgres') {
    return `mongodb://${user}:${password}@${host}:${port}/${database}?authSource=admin`;
  }
  
  // For local MongoDB without authentication (development only)
  return `mongodb://${host}:${port}/${database}`;
};

const connectionString = getConnectionString();

// Connection options
const options = {
  maxPoolSize: 20,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Log connection config (without password) for debugging
console.log('🔍 Checking MongoDB connection...');
console.log('📁 Environment files checked:');
console.log('   Root .env:', fs.existsSync(rootEnvPath) ? '✅ Found' : '❌ Not found');
console.log('   Server .env:', fs.existsSync(serverEnvPath) ? '✅ Found' : '❌ Not found');

if (process.env.MONGODB_URI) {
  console.log('✅ Using MONGODB_URI from environment');
  const maskedUri = connectionString.replace(/:[^:@]+@/, ':****@');
  console.log('📊 Connection String:', maskedUri);
} else {
  console.log('⚠️  MONGODB_URI not found, using individual DB_* variables');
  console.log('💡 To use MongoDB Atlas, add MONGODB_URI to your .env file');
  console.log('   Example: MONGODB_URI=mongodb+srv://raya:password@leaderrouter.mxhm03r.mongodb.net/leadrouter?appName=leaderrouter');
}

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_DB) {
  try {
    const url = new URL(connectionString);
    console.log('📊 MongoDB Config:', {
      host: url.hostname,
      port: url.port || 'default',
      database: url.pathname.slice(1) || 'default',
      user: url.username || 'none',
      ssl: connectionString.includes('mongodb+srv') ? 'enabled' : 'disabled',
      source: process.env.MONGODB_URI ? 'MONGODB_URI' : 'DB_* variables'
    });
  } catch (e) {
    console.log('📊 MongoDB Config:', { connectionString: connectionString.replace(/:[^:@]+@/, ':****@') });
  }
}

// Connect to MongoDB
mongoose.connect(connectionString, options)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(-1);
  });

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

module.exports = mongoose;
