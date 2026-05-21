import express from "express";
import type { Request, Response, NextFunction } from "express";
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
const requireStudentOrTeacher = (req: Request, res: Response, next: NextFunction) => {
  const role = ((req as any).userRole || "") as string;
  const normalised = role.replace("org:", "");
  if (
    ["student", "teacher", "admin"].includes(normalised) ||
    ["org:student", "org:teacher", "org:admin"].includes(role)
  ) {
    return next();
  }
  res.status(403).json({ error: "Forbidden: Students and Teachers only" });
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
