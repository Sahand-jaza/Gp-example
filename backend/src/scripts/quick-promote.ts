import { clerkClient } from "@clerk/express";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const CLERK_ID = "user_3DnswJYEZjkSzPi0OaAS8L4GS9i";
const ROLE = "admin";

async function setClerkRole() {
  try {
    console.log(`Updating Clerk metadata for ${CLERK_ID}...`);
    await clerkClient.users.updateUserMetadata(CLERK_ID, {
      publicMetadata: {
        role: ROLE
      }
    });
    console.log("Successfully assigned 'admin' role in Clerk!");
    process.exit(0);
  } catch (error) {
    console.error("Clerk update failed:", error);
    process.exit(1);
  }
}

setClerkRole();
