import mongoose from 'mongoose';

/**
 * Connect to MongoDB database instance
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/curo';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    // Auto-seed initial clinic data if collections are empty
    import('./seedData.js').then((module) => {
      module.seedPrivateClinicDatabase().catch((err) => {
        console.warn('[Seed Error]', err.message);
      });
    });
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    // Do not crash the app immediately if DB is optional in dev skeleton, or exit
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export default connectDB;
