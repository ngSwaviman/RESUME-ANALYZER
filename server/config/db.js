const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 * Accepts either a local MongoDB instance or a MongoDB Atlas connection string.
 */
const connectDB = async () => {
  let uri = process.env.MONGO_URI;

  if (!uri) {
    // A hosted instance has no local MongoDB, so falling back to localhost only
    // produces a confusing ECONNREFUSED. Fail with the actual reason instead.
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'MONGO_URI is not set. Add it in Render → Environment (MongoDB Atlas connection string) and redeploy.'
      );
    }
    uri = 'mongodb://127.0.0.1:27017/resume_analyzer';
  }

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
