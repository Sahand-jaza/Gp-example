import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config({ path: ".env" });

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    const users = await User.find().lean();
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("DB check failed:", error);
    process.exit(1);
  }
}

check();
