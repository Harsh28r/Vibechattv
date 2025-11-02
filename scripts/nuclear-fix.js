import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ometv';

async function nuclearFix() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Step 1: Show current indexes
    console.log('📋 Current indexes:');
    const indexes = await usersCollection.indexes();
    indexes.forEach(index => {
      console.log(`  ✓ ${index.name}`);
    });

    // Step 2: Drop ALL indexes except _id
    console.log('\n🗑️  Dropping ALL indexes except _id_...');
    await usersCollection.dropIndexes();
    console.log('✅ All custom indexes dropped!');

    // Step 3: Verify
    console.log('\n📋 Remaining indexes:');
    const remaining = await usersCollection.indexes();
    remaining.forEach(index => {
      console.log(`  ✓ ${index.name}`);
    });

    // Step 4: Create only the indexes we need (without socketId)
    console.log('\n📌 Creating necessary indexes...');
    
    await usersCollection.createIndex(
      { username: 1 },
      { unique: true, sparse: true, name: 'username_1' }
    );
    console.log('  ✅ username_1');

    await usersCollection.createIndex(
      { email: 1 },
      { unique: true, sparse: true, name: 'email_1' }
    );
    console.log('  ✅ email_1');

    await usersCollection.createIndex(
      { facebookId: 1 },
      { unique: true, sparse: true, name: 'facebookId_1' }
    );
    console.log('  ✅ facebookId_1');

    await usersCollection.createIndex(
      { googleId: 1 },
      { unique: true, sparse: true, name: 'googleId_1' }
    );
    console.log('  ✅ googleId_1');

    await usersCollection.createIndex(
      { isOnline: 1, inChat: 1 },
      { name: 'isOnline_1_inChat_1' }
    );
    console.log('  ✅ isOnline_1_inChat_1');

    await usersCollection.createIndex(
      { lastActive: -1 },
      { name: 'lastActive_-1' }
    );
    console.log('  ✅ lastActive_-1');

    // Step 5: Final verification
    console.log('\n📋 Final indexes:');
    const final = await usersCollection.indexes();
    final.forEach(index => {
      console.log(`  ✓ ${index.name}`);
    });

    console.log('\n✅ FIXED! No socketId index!');
    console.log('\n🎯 Now restart your backend server.');
    console.log('   Signup should work perfectly!\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

nuclearFix();

