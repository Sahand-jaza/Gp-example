import type { Request, Response } from "express";
import { clerkClient } from "@clerk/express";
import User from "../models/User";
import Course from "../models/Course";
import StudentProfile from "../models/StudentProfile";
import ParentProfile from "../models/ParentProfile";
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalStudents,
      recentStudents,
      totalTeachers,
      recentTeachers,
      totalParents,
      recentParents,
      totalCourses,
      recentActivity
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "student", createdAt: { $gt: sevenDaysAgo } }),
      User.countDocuments({ role: "teacher" }),
      User.countDocuments({ role: "teacher", createdAt: { $gt: sevenDaysAgo } }),
      User.countDocuments({ role: "parent" }),
      User.countDocuments({ role: "parent", createdAt: { $gt: sevenDaysAgo } }),
      Course.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).lean()
    ]);

    res.json({
      success: true,
      stats: [
        { name: "Total Students", value: totalStudents.toString(), change: `+${recentStudents}`, changeType: "increase" },
        { name: "Total Teachers", value: totalTeachers.toString(), change: `+${recentTeachers}`, changeType: "increase" },
        { name: "Active Courses", value: totalCourses.toString(), change: "+0", changeType: "increase" },
        { name: "Total Parents", value: totalParents.toString(), change: `+${recentParents}`, changeType: "increase" },
      ],
      recentActivity: recentActivity.map((u: any) => ({
        id: u._id,
        user: u.name || u.email,
        action: "joined the platform as",
        target: u.role,
        time: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Recently"
      }))
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllTeachers = async (req: Request, res: Response) => {
  try {
    const teachers = await User.find({ role: "teacher" }).sort({ name: 1 }).lean();
    res.json({ success: true, teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllParents = async (req: Request, res: Response) => {
  try {
    const parents = await User.find({ role: "parent" }).sort({ name: 1 }).lean();
    res.json({ success: true, parents });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllCourses = async (req: Request, res: Response) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // 1. Delete from Clerk first
    try {
      await clerkClient.users.deleteUser(userId);
    } catch (e) {
      console.warn("Clerk user deletion failed or user not found in Clerk:", e);
    }

    // 2. Delete from MongoDB
    await User.findOneAndDelete({ clerkId: userId });
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, role, password } = req.body;

    // 1. Create user in Clerk
    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [email],
      firstName: name.split(" ")[0],
      lastName: name.split(" ").slice(1).join(" "),
      publicMetadata: { role },
      password: password || Math.random().toString(36).slice(-12),
      skipPasswordRequirement: !password
    });

    // 2. Sync to local MongoDB
    const newUser = await User.create({
      clerkId: clerkUser.id,
      name,
      email,
      role,
      permissions: []
    });

    res.json({ success: true, user: newUser });
  } catch (error: any) {
    console.error("Clerk creation failed:", error);
    res.status(500).json({ 
      success: false, 
      message: error.errors?.[0]?.longMessage || "Failed to create user in Clerk" 
    });
  }
};

export const createAdminCourse = async (req: Request, res: Response) => {
  try {
    const { title, category } = req.body;
    const newCourse = await Course.create({
      title,
      category,
      instructorId: "admin", // Admin created course
      instructorName: "Admin",
      isPublished: true
    });
    res.json({ success: true, course: newCourse });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      { isActive },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { name, email, role } = req.body;

    // 1. Update Clerk first
    try {
      await clerkClient.users.updateUserMetadata(userId, {
        publicMetadata: { role }
      });
      // Also update email/name in Clerk if needed
      await clerkClient.users.updateUser(userId, {
        firstName: name.split(" ")[0],
        lastName: name.split(" ").slice(1).join(" "),
      });
    } catch (e) {
      console.warn("Clerk user update failed:", e);
    }

    // 2. Update local MongoDB
    const { ROLE_PERMISSIONS } = await import("../config/permissions");
    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      { 
        name, 
        email, 
        role, 
        permissions: ROLE_PERMISSIONS[role] || [] 
      },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
