import express from "express";
import { requireAuth, requireOrgRole } from "../middleware/auth";
import {
  getUploadUrl,
  createCourse,
  addVideoToCourse,
  getCourseVideos,
} from "../controllers/contentController";

const router = express.Router();

// Protected routes (Teacher only)
router.post(
  "/upload/sign",
  requireAuth(),
  requireOrgRole("org:teacher"),
  getUploadUrl,
);
router.post("/", requireAuth(), requireOrgRole("org:teacher"), createCourse); // Create Course
router.post(
  "/:courseId/videos",
  requireAuth(),
  requireOrgRole("org:teacher"),
  addVideoToCourse,
);

// Student/Teacher
router.get("/:courseId/videos", requireAuth(), getCourseVideos);

export default router;
