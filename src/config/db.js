import mongoose from "mongoose";
// import 'dotenv/config'
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;
const MONGODB_NAME = process.env.MONGO_NAME;

let cachedDb = null;

const connectDB = async () => {
  if (cachedDb) {
    console.log("Using cached MongoDB connection");
    return cachedDb;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_NAME,
    });
    console.log(`Connected to MongoDB (${MONGODB_NAME})`);
    cachedDb = mongoose.connection;
    return cachedDb;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};

export default connectDB;
