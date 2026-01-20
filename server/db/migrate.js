/**
 * Database Migration Script
 * MongoDB doesn't require migrations like SQL databases.
 * This script ensures indexes are created.
 */

require('dotenv').config();
const mongoose = require('./index');

// Import all models to ensure they're registered
require('./models/User');
require('./models/Rep');
require('./models/RepScore');
require('./models/Assignment');
require('./models/AuditLog');
require('./models/HubSpotSync');

async function migrate() {
  try {
    console.log('Starting database migration (indexes)...');
    
    // Wait for MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
      });
    }
    
    // Create all indexes
    console.log('Creating indexes...');
    await mongoose.connection.db.collection('users').createIndexes();
    await mongoose.connection.db.collection('reps').createIndexes();
    await mongoose.connection.db.collection('repscores').createIndexes();
    await mongoose.connection.db.collection('assignments').createIndexes();
    await mongoose.connection.db.collection('auditlogs').createIndexes();
    await mongoose.connection.db.collection('hubspotsyncs').createIndexes();
    
    console.log('✅ Database migration (indexes) completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { migrate };
