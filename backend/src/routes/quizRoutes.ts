import express from "express";
import { requireAuth, requireOrgRole } from "../middleware/auth";
import {
  generateQuiz,
  updateQuiz,
  getQuizByVideo,
  getQuizzesByCourse,
  submitQuiz,
} from "../controllers/quizController";

const router = express.Router();

// AI Quiz Generation (Teacher only)
router.post("/generate/:videoId", requireAuth(), requireOrgRole("org:teacher"), generateQuiz);

// Manual Quiz Update (Teacher only)
router.put("/update/:videoId", requireAuth(), requireOrgRole("org:teacher"), updateQuiz);

// Student/Teacher
// Student/Teacher - Get the AI generated quiz for a specific video
router.get("/video/:videoId", requireAuth(), getQuizByVideo);

// Student/Teacher - Get all quizzes for a specific course
router.get("/course/:courseId", requireAuth(), getQuizzesByCourse);

// Student only - Submit answers & get graded
router.post(
  "/:quizId/submit",
  requireAuth(),
  submitQuiz,
);

export default router;
