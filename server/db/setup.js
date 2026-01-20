/**
 * Complete Database Setup
 * Creates database, runs migrations, and seeds data
 */

require('dotenv').config();
const mongoose = require('./index');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./models/User');
const Rep = require('./models/Rep');
const RepScore = require('./models/RepScore');

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');
  
  try {
    // Wait for MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
      });
    }
    
    console.log('✅ Connected to MongoDB\n');
    
    // MongoDB doesn't need explicit schema creation - collections are created automatically
    // But we can ensure indexes are created
    console.log('📋 Ensuring indexes...');
    await User.createIndexes();
    await Rep.createIndexes();
    await RepScore.createIndexes();
    console.log('✅ Indexes created\n');
    
    // Step 3: Seed initial data
    console.log('🌱 Seeding initial data...');
    
    // Create admin user
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminHash = await bcrypt.hash(adminPassword, 10);
    
    const adminUser = await User.findOneAndUpdate(
      { email: 'admin@leadrouter.com' },
      {
        email: 'admin@leadrouter.com',
        password_hash: adminHash,
        role: 'admin',
        name: 'Admin User',
        active: true
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ Admin user created/updated');
    console.log(`   Email: admin@leadrouter.com`);
    console.log(`   Password: ${adminPassword} (change in production!)\n`);
    
    // Create BDR user
    const bdrPassword = process.env.BDR_PASSWORD || 'bdr123';
    const bdrHash = await bcrypt.hash(bdrPassword, 10);
    
    const bdrUser = await User.findOneAndUpdate(
      { email: 'bdr@leadrouter.com' },
      {
        email: 'bdr@leadrouter.com',
        password_hash: bdrHash,
        role: 'bdr',
        name: 'BDR User',
        active: true
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ BDR user created/updated');
    console.log(`   Email: bdr@leadrouter.com`);
    console.log(`   Password: ${bdrPassword} (change in production!)\n`);
    
    // Create sample reps (only if none exist)
    const repCount = await Rep.countDocuments();
    if (repCount === 0) {
      console.log('👥 Creating sample reps...');
      
      const sampleReps = [
        { name: 'John Doe', email: 'john@example.com', queue: 'SMB', weight: 1.0, hubspot_owner_id: '12345678' },
        { name: 'Jane Smith', email: 'jane@example.com', queue: 'SMB', weight: 1.5, hubspot_owner_id: '12345679' },
        { name: 'Bob Johnson', email: 'bob@example.com', queue: 'ENT', weight: 1.0, hubspot_owner_id: '12345680' },
        { name: 'Alice Williams', email: 'alice@example.com', queue: 'ENT', weight: 1.8, hubspot_owner_id: '12345681' },
      ];
      
      for (const repData of sampleReps) {
        const rep = new Rep(repData);
        await rep.save();
        
        // Initialize score
        const repScore = new RepScore({
          rep_id: rep._id,
          queue: rep.queue,
          current_score: 0.0
        });
        await repScore.save();
      }
      
      console.log(`✅ Created ${sampleReps.length} sample reps\n`);
    } else {
      console.log('ℹ️  Reps already exist, skipping sample data\n');
    }
    
    console.log('🎉 Database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Open http://localhost:3000');
    console.log('   3. Login with admin@leadrouter.com / admin123');
    
  } catch (error) {
    console.error('❌ Database setup failed!');
    console.error(`   Error: ${error.message}\n`);
    console.error('Please check:');
    console.error('   1. MongoDB is running');
    console.error('   2. Database credentials in .env are correct');
    console.error('   3. Connection string is valid');
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
