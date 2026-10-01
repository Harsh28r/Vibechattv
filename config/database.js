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
    await fixNullableUniqueIndexes(conn.connection);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Unique indexes on optional fields treat missing/null as one value, so the
// second Google signup dies (mobile_1, socketId_1). Keep uniqueness only
// when the field is an actual string.
const NULLABLE_UNIQUE_FIELDS = ['mobile', 'phone', 'socketId'];

export async function fixNullableUniqueIndexes(connection) {
  const users = connection.collection('users');
  const indexes = await users.indexes();
  for (const idx of indexes) {
    const keys = Object.keys(idx.key || {});
    if (!idx.unique || keys.length !== 1) continue;
    const field = keys[0];
    if (!NULLABLE_UNIQUE_FIELDS.includes(field)) continue;
    if (idx.partialFilterExpression?.[field]?.$type === 'string') continue;

    await users.dropIndex(idx.name);
    await users.createIndex(
      { [field]: 1 },
      {
        unique: true,
        name: idx.name,
        partialFilterExpression: { [field]: { $type: 'string' } },
      }
    );
    console.log(`🗑️  Rebuilt unique users index ${idx.name} so null ${field} is allowed`);
  }
}

export default connectDB;

