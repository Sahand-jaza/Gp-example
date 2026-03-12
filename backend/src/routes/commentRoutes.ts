import express from "express";
import { requireAuth } from "../middleware/auth";
import {
  addComment,
  getCommentsConfig,
  getAllCommentsForTeacher,
  replyToComment,
} from "../controllers/commentController";

const router = express.Router();

router.post("/", requireAuth(), addComment);
router.get("/teacher/all", requireAuth(), getAllCommentsForTeacher);
router.post("/:commentId/reply", requireAuth(), replyToComment);
router.get("/:videoId", requireAuth(), getCommentsConfig);

export default router;
