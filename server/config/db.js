const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 * Accepts either a local MongoDB instance or a MongoDB Atlas connection string.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resume_analyzer';

  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    // eslint-disable-next-line no-console
    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[db] MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
