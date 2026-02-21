import type { Request, Response } from "express";
import StudentProfile from "../models/StudentProfile";
import User from "../models/User";
import ParentProfile from "../models/ParentProfile";

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
