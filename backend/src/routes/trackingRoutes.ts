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

// Fix #5: Teachers/Parents/Admins can request analytics for a specific student.
// Controller enforces: students see only their own data, unknown roles are blocked.
router.get("/analytics/:studentId", requireAuth(), getStudentAnalytics);

export default router;

