import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vibechat';

async function dropAllSocketIdIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    console.log('\n📋 Current indexes:');
    const indexes = await usersCollection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Drop ALL socketId related indexes
    console.log('\n🗑️  Dropping ALL socketId indexes...');
    
    const socketIdIndexes = ['socketId_1', 'socketId_sparse_1'];
    
    for (const indexName of socketIdIndexes) {
      try {
        await usersCollection.dropIndex(indexName);
        console.log(`✅ Dropped ${indexName}`);
      } catch (error) {
        if (error.codeName === 'IndexNotFound') {
          console.log(`ℹ️  ${indexName} not found (already dropped)`);
        } else {
          console.error(`❌ Error dropping ${indexName}:`, error.message);
        }
      }
    }

    console.log('\n📋 Remaining indexes:');
    const remainingIndexes = await usersCollection.indexes();
    remainingIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ All socketId indexes dropped!');
    console.log('ℹ️  Restart your backend server now.');
    console.log('ℹ️  The model will NOT recreate socketId index anymore.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

dropAllSocketIdIndexes();



