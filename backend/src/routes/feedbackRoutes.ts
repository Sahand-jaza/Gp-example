import express from "express";
import {
  submitFeedback,
  getCourseFeedback,
  getAllFeedback,
} from "../controllers/feedbackController";
import { requireAuth, requireOrgRole } from "../middleware/auth";

const router = express.Router();

// Public / Authenticated
router.get("/course/:courseId", getCourseFeedback);

// Authenticated Student
router.post("/", requireAuth(), submitFeedback);

// Teacher / Admin
router.get("/all", requireAuth(), requireOrgRole("org:teacher"), getAllFeedback);

export default router;
