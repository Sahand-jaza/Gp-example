import type { Request, Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import User from "../models/User";
import StudentProfile from "../models/StudentProfile";
import ParentProfile from "../models/ParentProfile";
import { ROLE_PERMISSIONS } from "../config/permissions";
import Course from "../models/Course";
import Video from "../models/Video";
import { 
  GetObjectCommand 
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../config/r2Storage";
import Quiz from "../models/Quiz";
import QuizScore from "../models/QuizScore";

// Helper to generate Signed URL for viewing (S3/R2)
const getSignedViewUrl = async (blobName: string) => {
  const bucketName = process.env.R2_BUCKET_NAME || "gp-container";
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: blobName,
  });
  return await getSignedUrl(s3Client, command, { expiresIn: 7200 }); // 2 hours
};

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
            thumbnailUrl = await getSignedViewUrl(course.thumbnail);
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
        thumbnailUrl = await getSignedViewUrl(course.thumbnail);
      } catch (err) {
        console.error("Failed to generate thumbnail url for", course._id);
      }
    }

    // Fetch videos for course
    const videos = await Video.find({ courseId }).sort({ order: 1, createdAt: 1 });

    const videosWithUrls = await Promise.all(
      videos.map(async (v, index) => {
        const url = await getSignedViewUrl(v.s3Key);

        const quiz = await Quiz.findOne({ videoId: v._id });
        const passedScore = await QuizScore.findOne({
          studentId: userId,
          videoId: v._id,
          hasPassed: true,
        });
        // For quiz-free videos, check the completedVideos array on the student profile
        const studentProfile = await StudentProfile.findOne({ studentId: userId });
        const completedCheck = studentProfile?.completedVideos?.some(
          (id) => id.toString() === v._id.toString()
        );

        let isUnlocked = false;
        if (index === 0) {
          isUnlocked = true;
        } else {
          const prevVideoId = videos[index - 1]!._id;
          const prevQuiz = await Quiz.findOne({ videoId: prevVideoId });
          if (!prevQuiz) {
            // No quiz on previous video — unlock if it's in completedVideos
            const prevCompleted = studentProfile?.completedVideos?.some(
              (id) => id.toString() === prevVideoId.toString()
            );
            isUnlocked = !!prevCompleted;
          } else {
            const prevPassedScore = await QuizScore.findOne({
              studentId: userId,
              videoId: prevVideoId,
              hasPassed: true,
            });
            isUnlocked = !!prevPassedScore;
          }
        }

        // isCompleted: passed the quiz OR (no quiz AND marked watched in completedVideos)
        const isCompleted = !!passedScore || (!quiz && !!completedCheck);

        return { ...v.toObject(), url, isUnlocked, isCompleted };
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

// Mark a quiz-free video as completed (watched >= 95%)
export const markVideoComplete = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const video = await Video.findById(videoId);
    if (!video) {
      res.status(404).json({ message: "Video not found" });
      return;
    }

    // Only mark as complete if there's no quiz attached (quiz-free flow)
    const quiz = await Quiz.findOne({ videoId });
    if (quiz) {
      res.status(400).json({ message: "This video has a quiz. Complete the quiz to mark it as done." });
      return;
    }

    await StudentProfile.findOneAndUpdate(
      { studentId: userId },
      { $addToSet: { completedVideos: videoId } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Mark Video Complete Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
