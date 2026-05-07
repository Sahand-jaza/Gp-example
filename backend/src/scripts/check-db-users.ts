import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config({ path: ".env" });

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    const count = await User.countDocuments();
    const users = await User.find().limit(5);
    console.log(`Total users in DB: ${count}`);
    console.log(`Sample users:`, users.map(u => ({ clerkId: u.clerkId, role: u.role })));
    process.exit(0);
  } catch (error) {
    console.error("DB check failed:", error);
    process.exit(1);
  }
}

check();
