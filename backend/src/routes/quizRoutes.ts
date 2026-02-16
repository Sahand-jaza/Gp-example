import express from "express";
import { requireAuth } from "../middleware/auth";
import {
  createQuiz,
  getQuizzesByVideo,
  getQuizById,
  submitQuiz,
  getQuizResults,
} from "../controllers/quizController";

const router = express.Router();

// Teacher only (ideally)
router.post("/", requireAuth(), createQuiz);

// Student/Teacher
router.get("/video/:videoId", requireAuth(), getQuizzesByVideo);
router.get("/:quizId", requireAuth(), getQuizById);
router.post("/:quizId/submit", requireAuth(), submitQuiz);
router.get("/:quizId/results", requireAuth(), getQuizResults);

export default router;
