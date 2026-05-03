import { Webhook } from "svix";
import type { Request, Response } from "express";
import { clerkClient } from "@clerk/express";
import User from "../models/User";
import StudentProfile from "../models/StudentProfile";
import ParentProfile from "../models/ParentProfile";
import { ROLE_PERMISSIONS } from "../config/permissions";

export const handleClerkWebhook = async (req: Request, res: Response) => {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!SIGNING_SECRET) {
    throw new Error(
      "Error: Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env",
    );
  }

  // Create new Svix instance with secret
  const wh = new Webhook(SIGNING_SECRET);

  // Get headers
  const svix_id = req.headers["svix-id"] as string;
  const svix_timestamp = req.headers["svix-timestamp"] as string;
  const svix_signature = req.headers["svix-signature"] as string;

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    res.status(400).json({
      success: false,
      message: "Error: Missing svix headers",
    });
    return;
  }

  let evt: any;

  // Attempt to verify the incoming request (req.body is a Buffer thanks to express.raw)
  const payload = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body);
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err: any) {
    console.log("Error: Could not verify webhook:", err.message);
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Do something with payload
  // For this guide, log payload to console
  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const email = evt.data.email_addresses[0].email_address;
    const name = `${evt.data.first_name} ${evt.data.last_name}`.trim();
    const unsafeRole = evt.data.unsafe_metadata?.role;
    const publicRole = evt.data.public_metadata?.role;
    const role = unsafeRole || publicRole || "student"; // Default to student if not set
    const permissions = ROLE_PERMISSIONS[role] || [];

    try {
      await User.findOneAndUpdate(
        { clerkId: id },
        { email, name, role, permissions },
        { upsert: true, new: true },
      );
      console.log(`User synced: ${id} (${role})`);

      // If this is a new signup with a role provided by the frontend, lock it into publicMetadata
      if (eventType === "user.created" && unsafeRole) {
        try {
          await clerkClient.users.updateUserMetadata(id, {
            publicMetadata: { role: unsafeRole }
          });
          console.log(`Clerk publicMetadata updated with role '${unsafeRole}' for user ${id}`);
        } catch (clerkErr) {
          console.error("Error updating Clerk metadata:", clerkErr);
        }
      }

      // Automatically create ParentProfile if role is parent
      if (role === "parent") {
        const existingProfile = await ParentProfile.findOne({ parentId: id });
        if (!existingProfile) {
          // Generate unique code for Parent (e.g., TEAM-XA92)
          const code = `TEAM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
          await ParentProfile.create({
            parentId: id,
            connectionCode: code,
          });
          console.log(`ParentProfile created with code: ${code}`);
        }
      }

      // Ensure StudentProfile exists (with code) for new students
      if (role === "student") {
        const existingProfile = await StudentProfile.findOne({ studentId: id });
        if (!existingProfile) {
          // Generate unique code for Student (e.g., STU-XA92)
          const code = `STU-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
          await StudentProfile.create({
            studentId: id,
            connectionCode: code,
          });
          console.log(`StudentProfile created with code: ${code}`);
        }
      }
    } catch (error) {
      console.error("Error syncing user:", error);
      res.status(500).json({ success: false, message: "Database error" });
      return;
    }
  }

  if (eventType === "user.deleted") {
    try {
      await User.findOneAndDelete({ clerkId: id });
      console.log(`User deleted: ${id}`);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  }

  res.status(200).json({
    success: true,
    message: "Webhook received",
  });
};
