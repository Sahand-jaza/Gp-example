import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import StudentProfile from "../models/StudentProfile";
import ParentProfile from "../models/ParentProfile";

export const linkStudentToParent = async (req: Request, res: Response) => {
  try {
    const { connectionCode } = req.body;
    const { userId } = getAuth(req);

    if (!connectionCode) {
      res.status(400).json({ message: "Connection code is required" });
      return;
    }

    const parentProfile = await ParentProfile.findOne({
      connectionCode: connectionCode.trim().toUpperCase(),
    });

    if (!parentProfile) {
      res.status(404).json({ message: "Invalid connection code" });
      return;
    }

    // Auto-create StudentProfile if it doesn't exist (for local dev without webhooks)
    let studentProfile = await StudentProfile.findOne({ studentId: userId });

    if (!studentProfile) {
      console.log(`Auto-creating StudentProfile for user: ${userId}`);
      const code = `STU-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      studentProfile = await StudentProfile.create({
        studentId: userId,
        connectionCode: code,
      });
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
