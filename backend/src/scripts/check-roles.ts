import dotenv from "dotenv";
import { clerkClient } from "@clerk/express";

dotenv.config({ path: ".env" });

async function check() {
  try {
    const users = await clerkClient.users.getUserList({ limit: 10 });
    for (const u of users.data) {
      console.log(`User: ${u.id}, Role: ${(u.publicMetadata as any)?.role || "None"}`);
    }
  } catch (error) {
    console.error("Clerk check failed:", error);
  }
}

check();
