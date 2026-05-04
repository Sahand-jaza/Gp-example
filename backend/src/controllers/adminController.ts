import type { Request, Response } from "express";
import { clerkClient } from "@clerk/express";
import multer from "multer";
import path from "path";
import fs from "fs";

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/thumbnails";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({ storage });

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }
    const imageUrl = `/uploads/thumbnails/${req.file.filename}`;
    res.json({ success: true, imageUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: "Upload failed" });
  }
};
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
    
    const studentIds = users.filter((u: any) => u.role === "student").map((u: any) => u.clerkId);
    const parentIds = users.filter((u: any) => u.role === "parent").map((u: any) => u.clerkId);

    const studentProfiles = await StudentProfile.find({ studentId: { $in: studentIds } }).lean();
    const parentProfiles = await ParentProfile.find({ parentId: { $in: parentIds } }).lean();

    const profileMap = new Map();
    studentProfiles.forEach((p: any) => {
      if (p.connectionCode) profileMap.set(p.studentId, p.connectionCode);
    });
    parentProfiles.forEach((p: any) => {
      if (p.connectionCode) profileMap.set(p.parentId, p.connectionCode);
    });

    const populatedUsers = users.map((u: any) => ({
      ...u,
      connectionCode: profileMap.get(u.clerkId) || null
    }));

    res.json({ success: true, users: populatedUsers });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
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
    
    const parentIds = parents.map((u: any) => u.clerkId);
    const parentProfiles = await ParentProfile.find({ parentId: { $in: parentIds } }).lean();

    const profileMap = new Map();
    parentProfiles.forEach((p: any) => {
      if (p.connectionCode) profileMap.set(p.parentId, p.connectionCode);
    });

    const populatedParents = parents.map((u: any) => ({
      ...u,
      connectionCode: profileMap.get(u.clerkId) || null
    }));

    res.json({ success: true, parents: populatedParents });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const resolveThumbnail = async (course: any) => {
  // 1. If it's a local upload or full URL
  if (course.thumbnailUrl) {
    if (course.thumbnailUrl.startsWith("http")) return course.thumbnailUrl;
    const baseUrl = process.env.BACKEND_URL || "http://localhost:5000";
    return `${baseUrl}${course.thumbnailUrl.startsWith("/") ? "" : "/"}${course.thumbnailUrl}`;
  }
  
  // 2. If it's an S3/R2 key
  if (course.thumbnail) {
    try {
      const { GetObjectCommand } = await import("@aws-sdk/client-s3");
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
      const { default: s3Client } = await import("../config/r2Storage");
      
      const bucketName = process.env.R2_BUCKET_NAME || "gp-container";
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: course.thumbnail,
      });
      return await getSignedUrl(s3Client, command, { expiresIn: 7200 });
    } catch (err) {
      console.error("S3 Thumbnail resolve failed:", err);
    }
  }
  
  return null;
};

export const getAllCourses = async (req: Request, res: Response) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 }).lean();
    
    // Process courses in parallel
    const processedCourses = await Promise.all(courses.map(async (course) => {
      const studentCount = await StudentProfile.countDocuments({
        enrolledCourses: course._id
      });
      
      const finalThumbnailUrl = await resolveThumbnail(course);
      
      return { 
        ...course, 
        studentCount,
        thumbnailUrl: finalThumbnailUrl 
      };
    }));

    res.json({ success: true, courses: processedCourses });
  } catch (error) {
    console.error("Error fetching courses:", error);
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

    if (!name || !email || !role || !password) {
      res.status(400).json({ success: false, message: "All fields are required." });
      return;
    }

    // 1. Create user in Clerk
    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [email],
      firstName: name.split(" ")[0],
      lastName: name.split(" ").slice(1).join(" ") || " ",
      publicMetadata: { role },
      password,
      skipPasswordChecks: true,   // Allow admin to set any initial password
    });

    // 2. Sync to local MongoDB with correct role permissions
    const { ROLE_PERMISSIONS } = await import("../config/permissions");
    const newUser = await User.create({
      clerkId: clerkUser.id,
      name,
      email,
      role,
      permissions: ROLE_PERMISSIONS[role] || []
    });

    // 3. Auto-generate profiles for Students/Parents to provide Connection Keys
    let connectionCode = null;
    if (role === "student") {
      connectionCode = `STU-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      await StudentProfile.create({
        studentId: clerkUser.id,
        connectionCode,
      });
    } else if (role === "parent") {
      connectionCode = `TEAM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      await ParentProfile.create({
        parentId: clerkUser.id,
        connectionCode,
      });
    }

    res.json({ success: true, user: { ...newUser.toObject(), connectionCode } });
  } catch (error: any) {
    console.error("User creation failed:", JSON.stringify(error?.errors || error?.message || error));
    const message = error?.errors?.[0]?.longMessage 
      || error?.errors?.[0]?.message 
      || error?.message 
      || "Failed to create user";
    res.status(500).json({ success: false, message });
  }
};

export const createAdminCourse = async (req: Request, res: Response) => {
  try {
    const { title, category, description, thumbnailUrl } = req.body;
    const newCourse = await Course.create({
      title,
      category,
      description: description || `New ${category} course created by system administrator.`,
      thumbnailUrl: thumbnailUrl || "",
      teacherId: "admin", // Admin created course
      isPublished: true
    });
    res.json({ success: true, course: newCourse });
  } catch (error) {
    console.error("Course creation failed:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { title, category, description, thumbnailUrl } = req.body;
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { title, category, description, thumbnailUrl },
      { new: true }
    );
    res.json({ success: true, course: updatedCourse });
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

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    console.log(`[Admin Portal] Request to delete course: ${courseId}`);
    
    const course = await Course.findById(courseId);
    if (!course) {
      console.warn(`[Admin Portal] Deletion failed: Course ${courseId} not found.`);
      res.status(404).json({ success: false, message: "Course not found" });
      return;
    }

    await Course.findByIdAndDelete(courseId);
    console.log(`[Admin Portal] Successfully purged course: ${course.title} (${courseId})`);
    
    res.json({ success: true, message: "Course deleted successfully" });
  } catch (error: any) {
    console.error(`[Admin Portal] FATAL ERROR deleting course ${req.params.courseId}:`, error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { name, email, role } = req.body;

    // 1. Update Clerk first
    try {
      console.log(`[Admin Sync] Updating Clerk Metadata for User: ${userId} to Role: ${role}`);
      const clerkResult = await clerkClient.users.updateUserMetadata(userId, {
        publicMetadata: { role }
      });
      console.log(`[Admin Sync] Clerk Metadata Update SUCCESS for ${userId}. New Role: ${clerkResult.publicMetadata?.role}`);
      
      // Also update name in Clerk
      await clerkClient.users.updateUser(userId, {
        firstName: name.split(" ")[0],
        lastName: name.split(" ").slice(1).join(" "),
      });
    } catch (e) {
      console.error("[Admin Sync] Clerk user update FAILED:", e);
    }

    // 2. Update local MongoDB
    const { ROLE_PERMISSIONS } = await import("../config/permissions");
    const updatedDbUser = await User.findOneAndUpdate(
      { clerkId: userId },
      { 
        name,
        email,
        role, 
        permissions: ROLE_PERMISSIONS[role] || [] 
      },
      { new: true, upsert: true }
    );
    
    console.log(`[Admin Sync] User ${userId} updated to role ${role} in MongoDB. Success: ${!!updatedDbUser}`);

    res.json({ success: true, user: updatedDbUser });
  } catch (error: any) {
    console.error("[Admin Sync] Update failed:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};
