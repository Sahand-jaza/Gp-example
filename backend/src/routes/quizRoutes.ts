import express from "express";
import { requireAuth, requireOrgRole } from "../middleware/auth";
import {
  generateQuiz,
  updateQuiz,
  getQuizByVideo,
  getStudentQuizByVideo,
  getQuizzesByCourse,
  submitQuiz,
} from "../controllers/quizController";

const router = express.Router();

// AI Quiz Generation (Teacher only)
router.post("/generate/:videoId", requireAuth(), requireOrgRole("org:teacher"), generateQuiz);

// Manual Quiz Update (Teacher only)
router.put("/update/:videoId", requireAuth(), requireOrgRole("org:teacher"), updateQuiz);

// Teacher - Get the AI generated quiz for a specific video
router.get("/video/:videoId", requireAuth(), requireOrgRole("org:teacher"), getQuizByVideo);

// Student - Get the quiz for a specific video (strips answers)
router.get("/student/video/:videoId", requireAuth(), requireOrgRole("org:student"), getStudentQuizByVideo);

// Teacher - Get all quizzes for a specific course
router.get("/course/:courseId", requireAuth(), requireOrgRole("org:teacher"), getQuizzesByCourse);

// Student only - Submit answers & get graded
router.post(
  "/:quizId/submit",
  requireAuth(),
  requireOrgRole("org:student"),
  submitQuiz,
);

export default router;
