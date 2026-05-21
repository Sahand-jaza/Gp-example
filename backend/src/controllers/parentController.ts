import type { Request, Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import ParentProfile from "../models/ParentProfile";
import StudentProfile from "../models/StudentProfile";
import User from "../models/User";
import QuizScore from "../models/QuizScore";
import Video from "../models/Video";
import StudySession from "../models/StudySession";
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

    // Ensure role is set in Clerk metadata
    const clerkUser = await clerkClient.users.getUser(userId);
    if (!clerkUser.publicMetadata?.role) {
      await clerkClient.users.updateUserMetadata(userId, {
        publicMetadata: {
          role: "parent"
        }
      });
      console.log(`[AUTH] Assigned default 'parent' role to user ${userId} in Clerk`);
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

    const students = await Promise.all(linkedProfiles.map(async (profile) => {
      let user = userMap.get(profile.studentId);
      let name = "Student (Pending Sync)";
      let email = "";

      if (user) {
        name = (user.name && user.name !== "Unknown") ? user.name : (user.email || "Unnamed Student");
        email = user.email || "";
      } else {
        // Fallback: Fetch directly from Clerk if not in our DB yet
        try {
          const clerkUser = await clerkClient.users.getUser(profile.studentId);
          const fullName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
          name = fullName || clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress || "New Student";
          email = clerkUser.emailAddresses[0]?.emailAddress || "";
          
          // Optional: You could even trigger a background sync here if you wanted
        } catch (e) {
          console.error(`Failed to fetch Clerk user ${profile.studentId}:`, e);
        }
      }

      return {
        studentId: profile.studentId,
        name,
        email,
        linkedAt: profile.createdAt,
      };
    }));

    res.json({ success: true, students });
  } catch (error) {
    console.error("Get Connected Students Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getStudentStats = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    const { studentId } = req.params;

    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    // Verify this is a linked student
    const linkage = await StudentProfile.findOne({ studentId, parentId: userId });
    if (!linkage) {
       res.status(403).json({ message: "Access denied to this student's data" });
       return;
    }

    // 1. Get all quiz scores for student
    const scores = await QuizScore.find({ studentId }).populate('videoId', 'title courseId');

    // 2. Get all study sessions to count videos watched (active engagement)
    const sessions = await StudySession.find({ studentId });
    const watchedVideoIds = new Set();
    
    // Add from scores
    scores.forEach(s => {
      if (s.videoId?._id) watchedVideoIds.add(s.videoId._id.toString());
    });
    
    // Add from session logs (if they have videoId)
    sessions.forEach(session => {
      session.logs.forEach(log => {
        if (log.videoId) watchedVideoIds.add(log.videoId.toString());
      });
    });

    const totalVideosWatched = watchedVideoIds.size;
    const totalVideosPassed = scores.filter(s => s.hasPassed).length;
    
    // Total courses from enrollment list in profile
    const totalCourses = linkage.enrolledCourses?.length || 0;
    
    const avgScore = scores.length > 0 
      ? Math.round(scores.reduce((acc, s) => acc + s.bestScore, 0) / scores.length)
      : 0;

    // 3. Recent Scores (top 5)
    const recentScores = [...scores]
      .sort((a, b) => b.lastAttemptAt.getTime() - a.lastAttemptAt.getTime())
      .slice(0, 5)
      .map((s: any) => ({
        videoTitle: s.videoId?.title || "Unknown Lesson",
        score: s.bestScore,
        passed: s.hasPassed,
        date: s.lastAttemptAt
      }));

    res.json({
      success: true,
      stats: {
        totalCourses,
        totalVideosWatched,
        totalVideosPassed,
        avgScore,
        recentScores
      }
    });

  } catch (error) {
    console.error("Get Student Stats Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
