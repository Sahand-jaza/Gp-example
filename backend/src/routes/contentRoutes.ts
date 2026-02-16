import express from "express";
import { requireAuth } from "../middleware/auth";
import {
  getUploadUrl,
  createCourse,
  addVideoToCourse,
  getCourseVideos,
} from "../controllers/contentController";

const router = express.Router();

// Protected routes
router.post("/upload/sign", requireAuth(), getUploadUrl);
router.post("/", requireAuth(), createCourse); // Create Course
router.post("/:courseId/videos", requireAuth(), addVideoToCourse);
router.get("/:courseId/videos", requireAuth(), getCourseVideos);

export default router;
