import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vibechat';

async function fixIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    console.log('\n📋 Current indexes:');
    const indexes = await usersCollection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Drop the old socketId unique index
    console.log('\n🗑️  Dropping old socketId_1 index...');
    try {
      await usersCollection.dropIndex('socketId_1');
      console.log('✅ Dropped socketId_1 index');
    } catch (error) {
      if (error.codeName === 'IndexNotFound') {
        console.log('ℹ️  Index socketId_1 not found (already dropped)');
      } else {
        throw error;
      }
    }

    // Create new sparse index for socketId
    console.log('\n📌 Creating new sparse index for socketId...');
    await usersCollection.createIndex(
      { socketId: 1 },
      { 
        unique: true, 
        sparse: true, // Only index non-null values
        name: 'socketId_sparse_1' 
      }
    );
    console.log('✅ Created sparse index');

    console.log('\n📋 Updated indexes:');
    const newIndexes = await usersCollection.indexes();
    console.log(JSON.stringify(newIndexes, null, 2));

    console.log('\n✅ Index fix complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixIndexes();




