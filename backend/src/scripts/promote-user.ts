import mongoose from "mongoose";
import dotenv from "dotenv";
import { clerkClient } from "@clerk/express";
import User from "../models/User.js";

dotenv.config({ path: ".env" });

const CLERK_ID = "user_3DnswJYEZjkSzPi0OaAS8L4GS9i";
const ROLE = "admin";

async function promote() {
  try {
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("Connected to MongoDB");

    // 1. Update in MongoDB
    const updatedUser = await User.findOneAndUpdate(
      { clerkId: CLERK_ID },
      { role: ROLE, permissions: ["admin"] },
      { new: true, upsert: true }
    );
    console.log("Updated in MongoDB:", updatedUser);

    // 2. Update in Clerk
    console.log(`Updating Clerk metadata for ${CLERK_ID}...`);
    await clerkClient.users.updateUserMetadata(CLERK_ID, {
      publicMetadata: {
        role: ROLE
      }
    });
    console.log("Updated Clerk publicMetadata successfully");

    process.exit(0);
  } catch (error) {
    console.error("Promotion failed:", error);
    process.exit(1);
  }
}

promote();
