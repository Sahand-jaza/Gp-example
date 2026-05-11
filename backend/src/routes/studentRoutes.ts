import express, { type Request, type Response } from "express";
import { requireOrgRole, requireAuth } from "../middleware/auth";
import StudentProfile from "../models/StudentProfile";
import { getAuth } from "@clerk/express";
import { syncUser, getStudentCourses, getStudentCourse, enrollInCourse, getStudentProfile, markVideoComplete } from "../controllers/studentController";

const router = express.Router();

// POST /api/student/sync
// Syncs the user from Clerk to MongoDB
router.post("/sync", requireAuth(), syncUser);

// GET /api/student/profile
// Returns the student's profile and connection status
router.get(
  "/profile",
  requireAuth(),
  requireOrgRole("org:student"),
  getStudentProfile,
);

// GET /api/student/courses
// Returns all published courses
router.get("/courses", requireAuth(), requireOrgRole("org:student"), getStudentCourses);

// GET /api/student/courses/:courseId
// Returns details and videos for a specific course
router.get("/courses/:courseId", requireAuth(), requireOrgRole("org:student"), getStudentCourse);

// POST /api/student/courses/:courseId/enroll
// Enrolls a student in a course
router.post("/courses/:courseId/enroll", requireAuth(), requireOrgRole("org:student"), enrollInCourse);

// POST /api/student/videos/:videoId/complete
// Marks a quiz-free video as completed (95% watched)
router.post("/videos/:videoId/complete", requireAuth(), requireOrgRole("org:student"), markVideoComplete);

export default router;
