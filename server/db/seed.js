/**
 * Database Seed Script
 * Creates initial admin user and sample data
 */

require('dotenv').config();
const mongoose = require('./index');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./models/User');
const Rep = require('./models/Rep');
const RepScore = require('./models/RepScore');

async function seed() {
  try {
    // Wait for MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
      });
    }
    
    console.log('Starting database seed...');
    
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
    
    if (adminUser.isNew) {
      console.log('✅ Created admin user: admin@leadrouter.com');
      console.log('   Password: admin123 (change this in production!)');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
    
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
    
    if (bdrUser.isNew) {
      console.log('✅ Created BDR user: bdr@leadrouter.com');
      console.log('   Password: bdr123 (change this in production!)');
    } else {
      console.log('ℹ️  BDR user already exists');
    }
    
    // Create sample reps (optional - only if none exist)
    const repCount = await Rep.countDocuments();
    if (repCount === 0) {
      console.log('Creating sample reps...');
      
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
      
      console.log(`✅ Created ${sampleReps.length} sample reps`);
    } else {
      console.log('ℹ️  Reps already exist, skipping sample data');
    }
    
    console.log('✅ Database seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
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
