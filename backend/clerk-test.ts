import dotenv from "dotenv";
dotenv.config();

import { clerkClient } from "@clerk/express";

try {
  const u = await clerkClient.users.createUser({
    emailAddress: ["test.debug999@example.com"],
    firstName: "TestDebug",
    lastName: "User",
    password: "TestPassword123!",
    skipPasswordChecks: true,
    publicMetadata: { role: "teacher" }
  });
  console.log("SUCCESS:", u.id);
  await clerkClient.users.deleteUser(u.id);
  console.log("Cleaned up test user");
} catch(e: any) {
  console.error("CLERK ERROR:", JSON.stringify(e?.errors || e?.message || e, null, 2));
  console.error("STATUS:", e?.status);
}
