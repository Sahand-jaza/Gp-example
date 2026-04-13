import type { Request, Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import ParentProfile from "../models/ParentProfile";
import StudentProfile from "../models/StudentProfile";
import User from "../models/User";
import crypto from "crypto";

const generateConnectionCode = () => {
  return crypto.randomBytes(3).toString("hex").toUpperCase(); // e.g. "A1B2C3"
};

export const getParentProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    let profile = await ParentProfile.findOne({ parentId: userId });

    // Auto-create profile if it doesn't exist (for local dev without webhooks)
    if (!profile) {
      console.log(`Auto-creating ParentProfile for user: ${userId}`);
      let code: string;
      let isUnique = false;

      // Generate a unique connection code
      do {
        code = generateConnectionCode();
        const existing = await ParentProfile.findOne({ connectionCode: code });
        isUnique = !existing;
      } while (!isUnique);

      profile = await ParentProfile.create({
        parentId: userId,
        connectionCode: code,
      });

      console.log(`Created ParentProfile with code: ${code}`);
    }

    res.json({ success: true, profile });
  } catch (error) {
    console.error("Get Parent Profile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getConnectedStudents = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Find all student profiles linked to this parent
    const linkedProfiles = await StudentProfile.find({ parentId: userId });

    // Enrich with user details from MongoDB
    const studentIds = linkedProfiles.map((p) => p.studentId);
    const users = await User.find({ clerkId: { $in: studentIds } }).select(
      "clerkId name email"
    );

    const userMap = new Map(users.map((u) => [u.clerkId, u]));

    const students = linkedProfiles.map((profile) => {
      const user = userMap.get(profile.studentId);
      return {
        studentId: profile.studentId,
        name: user?.name || "Unknown Student",
        email: user?.email || "",
        linkedAt: profile.createdAt,
      };
    });

    res.json({ success: true, students });
  } catch (error) {
    console.error("Get Connected Students Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
