import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/it-consultancy-admin";

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (
  global as typeof globalThis & {
    mongoose?: { conn: unknown; promise: unknown };
  }
).mongoose;

if (!cached) {
  cached = (
    global as typeof globalThis & {
      mongoose?: { conn: unknown; promise: unknown };
    }
  ).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (!cached) {
    throw new Error("Mongoose cache is not initialized");
  }
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
