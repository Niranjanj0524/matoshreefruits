import mongoose from "mongoose";

/**
 * Cached Mongoose connection.
 * In dev, Next.js hot-reloads modules on every change — without a cached
 * connection we would open a new pool per reload and exhaust Atlas connections.
 */
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn(
    "[mongo] MONGODB_URI is not set. Add it to .env.local (see .env.local.example)."
  );
}

let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is missing. Copy .env.local.example to .env.local and set your Atlas connection string."
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // allow a fresh attempt on the next request
    throw err;
  }

  return cached.conn;
}

export async function disconnectDB() {
  if (!cached.conn) return;
  await mongoose.disconnect();
  cached.conn = null;
  cached.promise = null;
}

export async function dbStatus() {
  try {
    await connectDB();
    return { ok: true, state: mongoose.connection.readyState };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
