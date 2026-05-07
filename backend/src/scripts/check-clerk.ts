import mongoose from "mongoose";
import dotenv from "dotenv";
import { clerkClient } from "@clerk/express";

dotenv.config({ path: ".env" });

async function check() {
  try {
    console.log("Checking Clerk connection...");
    const users = await clerkClient.users.getUserList({ limit: 5 });
    console.log("Found users:", users.data.map(u => u.id));
    
    const targetId = "user_3DIMbMGfmCcrXNiLOX2JgSY8eH7";
    const user = users.data.find(u => u.id === targetId);
    if (user) {
      console.log(`User ${targetId} found in list!`);
    } else {
      console.log(`User ${targetId} NOT found in first 5 users.`);
      try {
        const u = await clerkClient.users.getUser(targetId);
        console.log(`User ${targetId} found via direct fetch!`);
      } catch (e) {
        console.error(`User ${targetId} NOT found via direct fetch either.`);
      }
    }
  } catch (error) {
    console.error("Clerk check failed:", error);
  }
}

check();
