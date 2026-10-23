import mongoose from 'mongoose';

/**
 * Connect to MongoDB database instance
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
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
