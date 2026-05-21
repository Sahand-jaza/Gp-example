import express from "express";
import { requireAuth, requireOrgRole } from "../middleware/auth";
import {
  addComment,
  getCommentsConfig,
  getAllCommentsForTeacher,
  replyToComment,
} from "../controllers/commentController";

const router = express.Router();

// Fix #6: Apply role restrictions to all comment endpoints
// Students post comments, teachers manage/reply
router.post("/", requireAuth(), requireOrgRole("org:student"), addComment);
router.get("/teacher/all", requireAuth(), requireOrgRole("org:teacher"), getAllCommentsForTeacher);
router.post("/:commentId/reply", requireAuth(), requireOrgRole("org:teacher"), replyToComment);
// Both students and teachers can read comments on a video
router.get("/:videoId", requireAuth(), getCommentsConfig);

export default router;
