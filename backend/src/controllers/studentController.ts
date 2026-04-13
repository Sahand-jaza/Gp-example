import type { Request, Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import User from "../models/User";
import StudentProfile from "../models/StudentProfile";
import ParentProfile from "../models/ParentProfile";
import { ROLE_PERMISSIONS } from "../config/permissions";
import Course from "../models/Course";
import Video from "../models/Video";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../config/s3";
import Quiz from "../models/Quiz";
import QuizScore from "../models/QuizScore";

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

// Get all published courses
export const getStudentCourses = async (req: Request, res: Response) => {
  try {
    const courses = await Course.find({ isPublished: true }).sort({ createdAt: -1 });

    const coursesWithThumbnails = await Promise.all(
      courses.map(async (course) => {
        let thumbnailUrl = null;
        if (course.thumbnail) {
          try {
            const command = new GetObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: course.thumbnail,
            });
            thumbnailUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
          } catch (err) {
            console.error("Failed to generate thumbnail url for", course._id);
          }
        }
        return { ...course.toObject(), thumbnailUrl };
      })
    );

    res.json(coursesWithThumbnails);
  } catch (error) {
    console.error("Get Student Courses Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get specific course and videos
export const getStudentCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const course = await Course.findOne({ _id: courseId, isPublished: true });
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Auto-enroll the student if not already enrolled
    try {
      await StudentProfile.findOneAndUpdate(
        { studentId: userId },
        { $addToSet: { enrolledCourses: courseId } }
      );
    } catch (e) {
      console.error("Auto-enroll error:", e);
    }

    let thumbnailUrl = null;
    if (course.thumbnail) {
      try {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: course.thumbnail,
        });
        thumbnailUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      } catch (err) {
        console.error("Failed to generate thumbnail url for", course._id);
      }
    }

    // Fetch videos for course
    const videos = await Video.find({ courseId }).sort({ order: 1, createdAt: 1 });

    const videosWithUrls = await Promise.all(
      videos.map(async (v, index) => {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: v.s3Key,
        });
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 * 2 });

        let isUnlocked = false;
        if (index === 0) {
          isUnlocked = true;
        } else {
          const prevVideoId = videos[index - 1]._id;
          const prevQuiz = await Quiz.findOne({ videoId: prevVideoId });
          if (!prevQuiz) {
            isUnlocked = true; // No quiz on previous video = unlocked
          } else {
            const passedScore = await QuizScore.findOne({
              studentId: userId,
              videoId: prevVideoId,
              hasPassed: true,
            });
            isUnlocked = !!passedScore;
          }
        }

        return { ...v.toObject(), url, isUnlocked };
      })
    );

    res.json({ ...course.toObject(), thumbnailUrl, videos: videosWithUrls });
  } catch (error) {
    console.error("Get Student Course Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Enroll in a course
export const enrollInCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const course = await Course.findOne({ _id: courseId, isPublished: true });
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const updatedProfile = await StudentProfile.findOneAndUpdate(
      { studentId: userId },
      { $addToSet: { enrolledCourses: courseId } },
      { new: true }
    );

    res.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error("Enroll Course Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getStudentProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const profile = await StudentProfile.findOne({ studentId: userId });
    if (!profile) {
      res.status(404).json({ message: "Profile not found" });
      return;
    }

    const quizScoresCount = await QuizScore.countDocuments({ studentId: userId });
    const passedQuizzesCount = await QuizScore.countDocuments({ studentId: userId, hasPassed: true });

    res.json({
      success: true,
      profile: {
        ...profile.toObject(),
        enrolledCount: profile.enrolledCourses?.length || 0,
        quizzesCount: quizScoresCount,
        passedQuizzesCount
      }
    });
  } catch (error) {
    console.error("Get Student Profile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
