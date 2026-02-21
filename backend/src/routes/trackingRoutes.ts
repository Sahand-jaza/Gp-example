import express from "express";
import { requireAuth, requireOrgRole } from "../middleware/auth";
import {
  startSession,
  heartbeat,
  endSession,
  getStudentAnalytics,
} from "../controllers/trackingController";

const router = express.Router();

// Ideally these should be protected.
// For Desktop app, ensure it sends the Bearer token.
// Student only
router.post(
  "/session/start",
  requireAuth(),
  requireOrgRole("org:student"),
  startSession,
);
router.post(
  "/heartbeat",
  requireAuth(),
  requireOrgRole("org:student"),
  heartbeat,
);
router.post(
  "/session/end",
  requireAuth(),
  requireOrgRole("org:student"),
  endSession,
);

// Teacher/Parent/Student (But for now, usually requested for a specific student id; we can leave as auth only if others need to view, but if strictly student sending data, it's student)
router.get("/analytics/:studentId", requireAuth(), getStudentAnalytics);

export default router;
