/**
 * Database Connection Test
 * Test database connectivity and configuration
 */

require('dotenv').config();
const pool = require('./index');

async function testConnection() {
  console.log('Testing database connection...\n');
  
  try {
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Database connection successful!');
    console.log(`   Current time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}\n`);
    
    // Test if tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No tables found. Run migrations first: npm run migrate');
    } else {
      console.log(`✅ Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    console.log('\n✅ Database connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error(`   Error: ${error.message}\n`);
    console.error('Please check:');
    console.error('   1. PostgreSQL is running');
    console.error('   2. Database credentials in .env are correct');
    console.error('   3. Database exists');
    console.error('   4. Network connectivity\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  testConnection();
}

module.exports = { testConnection };


