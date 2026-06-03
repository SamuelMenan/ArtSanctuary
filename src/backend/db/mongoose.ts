import "server-only";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Define la variable MONGODB_URI en .env.local. " +
      "Ejemplo: MONGODB_URI=mongodb://localhost:27017/artsanctuary"
  );
}

/**
 * Caché global de conexión para reutilizar entre hot-reloads en desarrollo.
 * En producción, Next.js solo carga esto una vez, pero en desarrollo
 * cada recarga destruye el módulo y reconectaría sin caché.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

 
declare global {
  var _mongoose: MongooseCache | undefined;
}
 

const cached: MongooseCache = global._mongoose ?? { conn: null, promise: null };
global._mongoose = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
