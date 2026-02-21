import type { Request, Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import User from "../models/User";
import StudentProfile from "../models/StudentProfile";
import ParentProfile from "../models/ParentProfile";
import { ROLE_PERMISSIONS } from "../config/permissions";

export const syncUser = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Fetch user details from Clerk directly to ensure validity and get latest info
    const clerkUser = await clerkClient.users.getUser(userId);

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const name =
      `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
    // Use role from metadata or valid default
    const role = (clerkUser.publicMetadata?.role as string) || "student";
    const permissions = ROLE_PERMISSIONS[role] || [];

    // Upsert User
    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        email,
        name,
        role,
        permissions,
      },
      { upsert: true, new: true },
    );

    // Create Profile based on role
    if (role === "student") {
      const existingProfile = await StudentProfile.findOne({
        studentId: userId,
      });
      if (!existingProfile) {
        const code = `STU-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        await StudentProfile.create({
          studentId: userId,
          connectionCode: code,
        });
        console.log(`Created StudentProfile for ${userId}`);
      }
    } else if (role === "parent") {
      const existingProfile = await ParentProfile.findOne({ parentId: userId });
      if (!existingProfile) {
        const code = `TEAM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        await ParentProfile.create({
          parentId: userId,
          connectionCode: code,
        });
        console.log(`Created ParentProfile for ${userId}`);
      }
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error syncing user:", error);
    res.status(500).json({ message: "Failed to sync user" });
  }
};
