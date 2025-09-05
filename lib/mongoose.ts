import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: MongooseCache = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    // Build connection URI with database name if specified
    let connectionUri = MONGODB_URI;
    if (MONGODB_DB_NAME && !MONGODB_URI.includes('mongodb.net/') && !MONGODB_URI.includes('localhost/')) {
      // Add database name if not already in URI
      connectionUri = MONGODB_URI.replace(/(\?|$)/, `/${MONGODB_DB_NAME}$1`);
    } else if (MONGODB_DB_NAME && MONGODB_URI.includes('mongodb.net/') && !MONGODB_URI.includes('mongodb.net/' + MONGODB_DB_NAME)) {
      // For MongoDB Atlas, insert database name after the domain
      connectionUri = MONGODB_URI.replace('mongodb.net/', `mongodb.net/${MONGODB_DB_NAME}`);
    }

    cached.promise = mongoose.connect(connectionUri, opts).then((mongoose) => {
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
