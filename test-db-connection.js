/**
 * Test MongoDB Connection
 */

require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');

// Get connection string
const getConnectionString = () => {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 27017;
  const database = process.env.DB_NAME || 'leadrouter';
  const user = process.env.DB_USER || '';
  const password = process.env.DB_PASSWORD || '';
  
  if (user && password) {
    return `mongodb://${user}:${password}@${host}:${port}/${database}?authSource=admin`;
  }
  
  return `mongodb://${host}:${port}/${database}`;
};

const connectionString = getConnectionString();
const maskedUri = connectionString.replace(/:[^:@]+@/, ':****@');

console.log('Connection String:', maskedUri);
console.log('');

mongoose.connect(connectionString, {
  serverSelectionTimeoutMS: 5000,
})
  .then(() => {
    console.log('✅ Successfully connected to MongoDB!');
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('');
    console.error('Possible issues:');
    console.error('  1. MONGODB_URI is incorrect');
    console.error('  2. MongoDB service is not running');
    console.error('  3. Network/firewall blocking connection');
    console.error('  4. Authentication credentials are incorrect');
    console.error('  5. IP address not whitelisted (for MongoDB Atlas)');
    process.exit(1);
  });
