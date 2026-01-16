/**
 * Database Seed Script
 * Creates initial admin user and sample data
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'leadrouter',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database seed...');
    await client.query('BEGIN');
    
    // Create admin user
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminHash = await bcrypt.hash(adminPassword, 10);
    
    const adminResult = await client.query(`
      INSERT INTO users (email, password_hash, role, name)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, role
    `, ['admin@leadrouter.com', adminHash, 'admin', 'Admin User']);
    
    if (adminResult.rows.length > 0) {
      console.log('✅ Created admin user: admin@leadrouter.com');
      console.log('   Password: admin123 (change this in production!)');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
    
    // Create BDR user
    const bdrPassword = process.env.BDR_PASSWORD || 'bdr123';
    const bdrHash = await bcrypt.hash(bdrPassword, 10);
    
    const bdrResult = await client.query(`
      INSERT INTO users (email, password_hash, role, name)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, role
    `, ['bdr@leadrouter.com', bdrHash, 'bdr', 'BDR User']);
    
    if (bdrResult.rows.length > 0) {
      console.log('✅ Created BDR user: bdr@leadrouter.com');
      console.log('   Password: bdr123 (change this in production!)');
    } else {
      console.log('ℹ️  BDR user already exists');
    }
    
    // Create sample reps (optional - only if none exist)
    const repCount = await client.query('SELECT COUNT(*) FROM reps');
    if (parseInt(repCount.rows[0].count) === 0) {
      console.log('Creating sample reps...');
      
      const sampleReps = [
        { name: 'John Doe', email: 'john@example.com', queue: 'SMB', weight: 1.0, hubspot_owner_id: '12345678' },
        { name: 'Jane Smith', email: 'jane@example.com', queue: 'SMB', weight: 1.5, hubspot_owner_id: '12345679' },
        { name: 'Bob Johnson', email: 'bob@example.com', queue: 'ENT', weight: 1.0, hubspot_owner_id: '12345680' },
        { name: 'Alice Williams', email: 'alice@example.com', queue: 'ENT', weight: 1.8, hubspot_owner_id: '12345681' },
      ];
      
      for (const rep of sampleReps) {
        await client.query(`
          INSERT INTO reps (name, email, queue, weight, hubspot_owner_id)
          VALUES ($1, $2, $3, $4, $5)
        `, [rep.name, rep.email, rep.queue, rep.weight, rep.hubspot_owner_id]);
      }
      
      console.log(`✅ Created ${sampleReps.length} sample reps`);
    } else {
      console.log('ℹ️  Reps already exist, skipping sample data');
    }
    
    await client.query('COMMIT');
    console.log('✅ Database seed completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seed };

