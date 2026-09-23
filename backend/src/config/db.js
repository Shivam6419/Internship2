import mongoose from 'mongoose';

let isDbConnected = false;

/**
 * Connects to MongoDB Atlas with graceful fallback
 * The game server will stay fully functional in memory even if MongoDB is not reachable.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️ [DATABASE] MONGODB_URI not set in environment. Running with in-memory persistence.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000 // Timeout fast if atlas cluster unreachable
    });
    isDbConnected = true;
    console.log(`🌿 [DATABASE] MongoDB Atlas connected: ${conn.connection.host}`);
  } catch (error) {
    isDbConnected = false;
    console.warn(`⚠️ [DATABASE] MongoDB connection failed (${error.message}). Running with in-memory storage.`);
  }
}

export function isConnected() {
  return isDbConnected;
}
