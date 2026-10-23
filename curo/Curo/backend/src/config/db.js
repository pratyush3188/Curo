import mongoose from 'mongoose';

/**
 * Connect to MongoDB database instance
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/curo';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[Database Notice] MongoDB connection attempt failed: ${error.message}`);
    console.warn(`[Database Notice] Backend is running in development resilience mode. Set MONGO_URI in .env to connect to live cluster.`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export default connectDB;
