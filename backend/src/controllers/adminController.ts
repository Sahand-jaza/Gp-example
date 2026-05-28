import type { Request, Response } from "express";
import { clerkClient } from "@clerk/express";
import User from "../models/User";
import Course from "../models/Course";
import StudentProfile from "../models/StudentProfile";
import ParentProfile from "../models/ParentProfile";
import { getSignedViewUrl } from "../utils/s3";
import { ROLE_PERMISSIONS } from "../config/permissions";
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
    
    // Fetch user details for all unique teacherIds
    const teacherIds = Array.from(new Set(courses.map((c: any) => c.teacherId)));
    const teachers = await User.find({ clerkId: { $in: teacherIds } }).select("clerkId name email").lean();
    const teacherMap = new Map<string, { name: string; email: string }>();
    teachers.forEach((t: any) => {
      teacherMap.set(t.clerkId, { name: t.name || "Unknown Teacher", email: t.email || "" });
    });

    // Generate signed URLs for thumbnails and attach teacher details
    const coursesWithDetails = await Promise.all(
      courses.map(async (course: any) => {
        let thumbnailUrl = null;
        if (course.thumbnail) {
          try {
            thumbnailUrl = await getSignedViewUrl(course.thumbnail);
          } catch (err) {
            console.error("Failed to generate thumbnail url for", course._id);
          }
        }
        const teacherInfo = teacherMap.get(course.teacherId) || { name: "Unknown Teacher", email: "N/A" };
        return { 
          ...course, 
          thumbnailUrl,
          teacherName: teacherInfo.name,
          teacherEmail: teacherInfo.email
        };
      })
    );

    res.json({ success: true, courses: coursesWithDetails });
  } catch (error) {
    console.error("Error fetching courses with teacher details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

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

    // 2. Sync to local MongoDB (Fix #3: assign correct permissions based on role)
    const newUser = await User.create({
      clerkId: clerkUser.id,
      name,
      email,
      role,
      permissions: ROLE_PERMISSIONS[role] || []
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
    const { title } = req.body;
    const newCourse = await Course.create({
      title,
      teacherId: "admin", // Admin created course
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
    const userId = req.params.userId as string;
    const { name, email, role } = req.body;

    // Fix #2: Build update payload including permissions when role changes
    const updatePayload: Record<string, unknown> = { name, email };
    if (role) {
      updatePayload.role = role;
      updatePayload.permissions = ROLE_PERMISSIONS[role] || [];
    }

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      updatePayload,
      { new: true }
    );

    // Fix #2: Sync the new role to Clerk publicMetadata so JWT reflects the change immediately
    if (role) {
      try {
        await clerkClient.users.updateUserMetadata(userId, {
          publicMetadata: { role },
        });
      } catch (clerkErr) {
        console.error("[updateUser] Failed to sync role to Clerk:", clerkErr);
        // Non-fatal — MongoDB is updated; Clerk will catch up via webhook
      }
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateAdminCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { isPublished, isFeatured } = req.body;

    const updateData: any = {};
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

    const course = await Course.findByIdAndUpdate(
      courseId,
      { $set: updateData },
      { new: true }
    );

    if (!course) {
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    res.json({ success: true, course });
  } catch (error) {
    console.error("Error updating admin course:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
