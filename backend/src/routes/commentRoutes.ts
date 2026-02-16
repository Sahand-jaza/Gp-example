import express from "express";
import { requireAuth } from "../middleware/auth";
import {
  addComment,
  getCommentsConfig,
} from "../controllers/commentController";

const router = express.Router();

router.post("/", requireAuth(), addComment);
router.get("/:videoId", requireAuth(), getCommentsConfig);

export default router;
