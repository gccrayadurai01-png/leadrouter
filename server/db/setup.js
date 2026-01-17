/**
 * Complete Database Setup
 * Creates database, runs migrations, and seeds data
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Support both DATABASE_URL (Render, Heroku) and individual DB_* variables
const DB_CONFIG = process.env.DATABASE_URL
  ? null // Will use connectionString directly
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };

const DB_NAME = process.env.DB_NAME || 'leadrouter';

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');
  
  // For managed databases (like Render), the database already exists
  // For local development, we may need to create it
  const isManagedDB = process.env.DATABASE_URL || process.env.RENDER;
  
  let dbClient;
  
  try {
    if (process.env.DATABASE_URL) {
      // Use DATABASE_URL (Render, Heroku, etc.) - database already exists
      console.log('📦 Using DATABASE_URL (managed database)');
      dbClient = new Client({
        connectionString: process.env.DATABASE_URL,
        // Enable SSL for Render databases (dpg- hostname), AWS, or render.com URLs
        ssl: process.env.DATABASE_URL.includes('render.com') || 
             process.env.DATABASE_URL.includes('dpg-') || 
             process.env.DATABASE_URL.includes('amazonaws.com')
          ? { rejectUnauthorized: false }
          : false
      });
    } else if (!isManagedDB && DB_CONFIG) {
      // Step 1: Connect to postgres database to create our database (local only)
      const adminClient = new Client({
        ...DB_CONFIG,
        database: 'postgres'
      });
      
      await adminClient.connect();
      console.log('✅ Connected to PostgreSQL server');
      
      // Check if database exists
      const dbCheck = await adminClient.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [DB_NAME]
      );
      
      if (dbCheck.rows.length === 0) {
        console.log(`📦 Creating database: ${DB_NAME}...`);
        await adminClient.query(`CREATE DATABASE ${DB_NAME}`);
        console.log(`✅ Database ${DB_NAME} created`);
      } else {
        console.log(`ℹ️  Database ${DB_NAME} already exists`);
      }
      
      await adminClient.end();
      
      // Step 2: Connect to our database
      dbClient = new Client({
        ...DB_CONFIG,
        database: DB_NAME
      });
    } else {
      // Fallback: use individual config vars
      dbClient = new Client({
        ...DB_CONFIG,
        database: DB_NAME
      });
    }
    
    await dbClient.connect();
    console.log(`✅ Connected to database: ${DB_NAME}\n`);
    
    // Run schema
    console.log('📋 Running migrations...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await dbClient.query(schema);
    console.log('✅ Migrations completed\n');
    
    // Step 3: Seed initial data
    console.log('🌱 Seeding initial data...');
    
    // Create admin user
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminHash = await bcrypt.hash(adminPassword, 10);
    
    const adminResult = await dbClient.query(`
      INSERT INTO users (email, password_hash, role, name)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET password_hash = $2
      RETURNING id, email, role
    `, ['admin@leadrouter.com', adminHash, 'admin', 'Admin User']);
    
    console.log('✅ Admin user created/updated');
    console.log(`   Email: admin@leadrouter.com`);
    console.log(`   Password: ${adminPassword} (change in production!)\n`);
    
    // Create BDR user
    const bdrPassword = process.env.BDR_PASSWORD || 'bdr123';
    const bdrHash = await bcrypt.hash(bdrPassword, 10);
    
    const bdrResult = await dbClient.query(`
      INSERT INTO users (email, password_hash, role, name)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET password_hash = $2
      RETURNING id, email, role
    `, ['bdr@leadrouter.com', bdrHash, 'bdr', 'BDR User']);
    
    console.log('✅ BDR user created/updated');
    console.log(`   Email: bdr@leadrouter.com`);
    console.log(`   Password: ${bdrPassword} (change in production!)\n`);
    
    // Create sample reps (only if none exist)
    const repCount = await dbClient.query('SELECT COUNT(*) FROM reps');
    if (parseInt(repCount.rows[0].count) === 0) {
      console.log('👥 Creating sample reps...');
      
      const sampleReps = [
        { name: 'John Doe', email: 'john@example.com', queue: 'SMB', weight: 1.0, hubspot_owner_id: '12345678' },
        { name: 'Jane Smith', email: 'jane@example.com', queue: 'SMB', weight: 1.5, hubspot_owner_id: '12345679' },
        { name: 'Bob Johnson', email: 'bob@example.com', queue: 'ENT', weight: 1.0, hubspot_owner_id: '12345680' },
        { name: 'Alice Williams', email: 'alice@example.com', queue: 'ENT', weight: 1.8, hubspot_owner_id: '12345681' },
      ];
      
      for (const rep of sampleReps) {
        await dbClient.query(`
          INSERT INTO reps (name, email, queue, weight, hubspot_owner_id)
          VALUES ($1, $2, $3, $4, $5)
        `, [rep.name, rep.email, rep.queue, rep.weight, rep.hubspot_owner_id]);
      }
      
      console.log(`✅ Created ${sampleReps.length} sample reps\n`);
    } else {
      console.log('ℹ️  Reps already exist, skipping sample data\n');
    }
    
    await dbClient.end();
    
    console.log('🎉 Database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Open http://localhost:3000');
    console.log('   3. Login with admin@leadrouter.com / admin123');
    
  } catch (error) {
    console.error('❌ Database setup failed!');
    console.error(`   Error: ${error.message}\n`);
    console.error('Please check:');
    console.error('   1. PostgreSQL is running');
    console.error('   2. Database credentials in .env are correct');
    console.error('   3. User has CREATE DATABASE permission');
    process.exit(1);
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };


