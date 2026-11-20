import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('[MongoDB] Warning: MONGO_URI is not defined in environment variables.');
    console.warn('[MongoDB] Authentication and saved analysis history will be unavailable until MONGO_URI is configured.');
    return null;
  }

  try {
    const options = {};
    if (process.env.MONGO_DATABASE) {
      options.dbName = process.env.MONGO_DATABASE;
    }

    const conn = await mongoose.connect(uri, options);
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.error('[MongoDB] The server will continue running, but database features will fail until connection succeeds.');
    return null;
  }
};

export const isDatabaseConnected = () => mongoose.connection.readyState === 1;

export default connectDB;
