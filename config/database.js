import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://db1:123456g@cluster0.fcyiy3l.mongodb.net/deltacrm?retryWrites=true&w=majority&appName=Cluster0', {
      // mongodb+srv://hars_h:<M028663@cluster0.ws9f0.mongodb.net/
      maxPoolSize: 50,
      minPoolSize: 10,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    await dropUniqueSocketIdIndexes(conn.connection);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

async function dropUniqueSocketIdIndexes(connection) {
  try {
    const users = connection.collection('users');
    const indexes = await users.indexes();
    for (const idx of indexes) {
      const keys = Object.keys(idx.key || {});
      if (idx.unique && keys.length === 1 && keys[0] === 'socketId') {
        await users.dropIndex(idx.name);
        console.log(`🗑️  Dropped unique users index ${idx.name} (was breaking OAuth signups)`);
      }
    }
  } catch (error) {
    console.error('socketId index cleanup failed:', error.message);
  }
}

export default connectDB;

