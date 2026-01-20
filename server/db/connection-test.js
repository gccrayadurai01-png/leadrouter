/**
 * Database Connection Test
 * Test database connectivity and configuration
 */

require('dotenv').config();
const mongoose = require('./index');

async function testConnection() {
  console.log('Testing database connection...\n');
  
  try {
    // Wait for MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve, reject) => {
        mongoose.connection.once('connected', resolve);
        mongoose.connection.once('error', reject);
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      });
    }
    
    console.log('✅ Database connection successful!');
    console.log(`   MongoDB version: ${mongoose.version || 'unknown'}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}:${mongoose.connection.port}\n`);
    
    // Test if collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('⚠️  No collections found. Run setup first: npm run setup');
    } else {
      console.log(`✅ Found ${collections.length} collections:`);
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    }
    
    console.log('\n✅ Database connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error(`   Error: ${error.message}\n`);
    console.error('Please check:');
    console.error('   1. MongoDB is running');
    console.error('   2. Database credentials in .env are correct');
    console.error('   3. Connection string is valid');
    console.error('   4. Network connectivity\n');
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

if (require.main === module) {
  testConnection();
}

module.exports = { testConnection };
