/**
 * Test Database Connection
 */

require('dotenv').config();
const { Client } = require('pg');

console.log('Testing database connection...');
console.log('Host:', process.env.DB_HOST || 'localhost');
console.log('Port:', process.env.DB_PORT || 5432);
console.log('User:', process.env.DB_USER || 'postgres');
console.log('Password:', process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-2) : 'not set');
console.log('');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: 'postgres'
});

client.connect()
  .then(() => {
    console.log('✅ Successfully connected to PostgreSQL!');
    return client.query('SELECT version()');
  })
  .then((result) => {
    console.log('PostgreSQL version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    client.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('');
    console.error('Possible issues:');
    console.error('  1. Password is incorrect');
    console.error('  2. PostgreSQL service is not running');
    console.error('  3. Port 5432 is blocked');
    console.error('  4. User does not exist');
    client.end();
    process.exit(1);
  });

