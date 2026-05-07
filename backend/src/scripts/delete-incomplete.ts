import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config({ path: ".env" });

async function fix() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    const res = await User.deleteMany({ email: { $exists: false } });
    console.log(`Deleted ${res.deletedCount} users without email.`);
    process.exit(0);
  } catch (error) {
    console.error("Fix failed:", error);
    process.exit(1);
  }
}

fix();
