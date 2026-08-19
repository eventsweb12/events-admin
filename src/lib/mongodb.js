import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

// Next.js dev mode-ში hot-reload ყოველ request-ზე ხელახლა უშვებს ფაილს,
// ამიტომ connection-ს globalThis-ზე ვინახავთ რომ არ გავამრავლოთ.
let cached = globalThis._mongoose;

if (!cached) {
  cached = globalThis._mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    console.log("✅ MongoDB: using existing cached connection");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("⏳ MongoDB: connecting...");
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .then((mongoose) => {
        console.log("✅ MongoDB: connected successfully to", mongoose.connection.name);
        return mongoose;
      })
      .catch((err) => {
        console.error("❌ MongoDB: connection failed —", err.message);
        cached.promise = null; // საშვებელი გამეორება შემდეგ request-ზე
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;