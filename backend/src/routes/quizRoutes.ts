import express from "express";
import { requireAuth, requireOrgRole } from "../middleware/auth";
import {
  createQuiz,
  getQuizzesByVideo,
  getQuizById,
  submitQuiz,
  getQuizResults,
} from "../controllers/quizController";

const router = express.Router();

// Teacher only (ideally)
router.post("/", requireAuth(), requireOrgRole("org:teacher"), createQuiz);

// Student/Teacher
router.get("/video/:videoId", requireAuth(), getQuizzesByVideo);
router.get("/:quizId", requireAuth(), getQuizById);

// Student only
router.post(
  "/:quizId/submit",
  requireAuth(),
  requireOrgRole("org:student"),
  submitQuiz,
);
router.get(
  "/:quizId/results",
  requireAuth(),
  requireOrgRole("org:student"),
  getQuizResults,
);

export default router;
