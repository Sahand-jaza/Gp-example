import type { Request, Response } from "express";
import StudentProfile from "../models/StudentProfile";
import User from "../models/User";
import ParentProfile from "../models/ParentProfile";

export const linkParentToStudent = async (req: Request, res: Response) => {
  try {
    const { connectionCode } = req.body;
    const parentId = (req as any).auth.userId; // Clerk ID from middleware

    if (!connectionCode) {
      res.status(400).json({ message: "Connection code is required" });
      return;
    }

    // Find student with this code
    const studentProfile = await StudentProfile.findOne({ connectionCode });

    if (!studentProfile) {
      res.status(404).json({ message: "Invalid connection code" });
      return;
    }

    if (studentProfile.parentId) {
      res
        .status(400)
        .json({ message: "Student is already connected to a parent" });
      return;
    }

    // Link them
    studentProfile.parentId = parentId;
    await studentProfile.save();

    // Verify parent role (optional, but good for consistency)
    const parentUser = await User.findOne({ clerkId: parentId });
    if (parentUser && parentUser.role !== "parent") {
      // Could auto-update role here or just warn
    }

    res.json({ success: true, message: "Connected successfully to student" });
  } catch (error) {
    console.error("Link Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const linkStudentToParent = async (req: Request, res: Response) => {
  try {
    const { connectionCode } = req.body;
    const studentId = (req as any).auth.userId;

    if (!connectionCode) {
      res.status(400).json({ message: "Connection code is required" });
      return;
    }

    const parentProfile = await ParentProfile.findOne({ connectionCode });

    if (!parentProfile) {
      res.status(404).json({ message: "Invalid connection code" });
      return;
    }

    const studentProfile = await StudentProfile.findOne({ studentId });

    if (!studentProfile) {
      res.status(404).json({ message: "Student profile not found" });
      return;
    }

    if (studentProfile.parentId) {
      res
        .status(400)
        .json({ message: "Student is already connected to a parent" });
      return;
    }

    studentProfile.parentId = parentProfile.parentId;
    await studentProfile.save();

    res.json({ success: true, message: "Connected successfully to parent" });
  } catch (error) {
    console.error("Link Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
