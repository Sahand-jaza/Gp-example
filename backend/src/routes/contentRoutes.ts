import express from "express";
import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import User from "../models/User";
import { requireAuth, requireOrgRole } from "../middleware/auth";
import {
  getUploadUrl,
  createCourse,
  addVideoToCourse,
  getCourseVideos,
  getMyCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  updateVideo,
  deleteVideo,
  reorderVideos,
} from "../controllers/contentController";

const router = express.Router();

// Fix #4: Role guard — allows students, teachers, and admins (prevents parents from accessing video URLs)
const requireStudentOrTeacher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authData = getAuth(req);
    const { userId, orgRole } = authData;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    let userRole = (req as any).userRole || null;

    if (!userRole) {
      // Priority check: MongoDB first
      try {
        const dbUser = await User.findOne({ clerkId: userId }).lean() as any;
        if (dbUser && dbUser.role) {
          userRole = dbUser.role;
        }
      } catch (err) {
        console.error("Error fetching user from MongoDB:", err);
      }
    }

    if (!userRole) {
      // Fallback: Clerk public/unsafe metadata
      try {
        const user = await clerkClient.users.getUser(userId);
        userRole = (user.publicMetadata?.role as string);
      } catch (err) {
        console.error("Error fetching user from Clerk API:", err);
      }
    }

    // Attach to request
    (req as any).userRole = userRole;

    const role = (userRole || "") as string;
    const normalised = role.replace("org:", "");
    if (
      ["student", "teacher", "admin"].includes(normalised) ||
      ["org:student", "org:teacher", "org:admin"].includes(role) ||
      (orgRole && ["org:admin", "admin"].includes(orgRole))
    ) {
      return next();
    }
    res.status(403).json({ error: "Forbidden: Students and Teachers only" });
  } catch (error) {
    console.error("Error in requireStudentOrTeacher middleware:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Protected routes (Teacher only)
router.post(
  "/upload/sign",
  requireAuth(),
  requireOrgRole("org:teacher"),
  getUploadUrl,
);
router.get(
  "/my-courses",
  requireAuth(),
  requireOrgRole("org:teacher"),
  getMyCourses,
);
router.post("/", requireAuth(), requireOrgRole("org:teacher"), createCourse); // Create Course
router.get(
  "/:courseId",
  requireAuth(),
  requireOrgRole("org:teacher"),
  getCourse,
);
router.patch(
  "/:courseId",
  requireAuth(),
  requireOrgRole("org:teacher"),
  updateCourse,
);
router.delete(
  "/:courseId",
  requireAuth(),
  requireOrgRole("org:teacher"),
  deleteCourse,
);
router.post(
  "/:courseId/videos",
  requireAuth(),
  requireOrgRole("org:teacher"),
  addVideoToCourse,
);

// Fix #4 — Student/Teacher both can view videos for a course (parents cannot)
// requireStudentOrTeacher reads userRole set by requireOrgRole-like logic in the prior middleware run
router.get("/:courseId/videos", requireAuth(), requireStudentOrTeacher, getCourseVideos);

router.patch(
  "/:courseId/videos/reorder",
  requireAuth(),
  requireOrgRole("org:teacher"),
  reorderVideos,
);
router.patch(
  "/:courseId/videos/:videoId",
  requireAuth(),
  requireOrgRole("org:teacher"),
  updateVideo,
);
router.delete(
  "/:courseId/videos/:videoId",
  requireAuth(),
  requireOrgRole("org:teacher"),
  deleteVideo,
);

export default router;
