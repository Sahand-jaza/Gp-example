import { clerkClient } from "@clerk/express";
import dotenv from "dotenv";

dotenv.config();

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("Usage: bun run src/scripts/setRole.ts <clerkUserId> <role>");
  console.error("Roles: admin, teacher, parent, student");
  process.exit(1);
}

const [userId, role] = args as [string, string];

const validRoles = ["admin", "teacher", "parent", "student"];

if (!validRoles.includes(role)) {
  console.error(
    `Invalid role: ${role}. Must be one of: ${validRoles.join(", ")}`,
  );
  process.exit(1);
}

async function setRole() {
  try {
    console.log(`Setting role for ${userId} to ${role}...`);
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: role,
      },
    });
    console.log(`Success! User ${userId} is now a ${role}.`);
  } catch (error) {
    console.error("Error setting role:", error);
  }
}

setRole();
