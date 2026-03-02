import express from "express";
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

// Student/Teacher
router.get("/:courseId/videos", requireAuth(), getCourseVideos);

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
