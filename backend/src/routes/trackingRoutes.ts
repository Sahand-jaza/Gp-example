import express from "express";
import { requireAuth } from "../middleware/auth";
import {
  startSession,
  heartbeat,
  endSession,
  getStudentAnalytics,
} from "../controllers/trackingController";

const router = express.Router();

// Ideally these should be protected.
// For Desktop app, ensure it sends the Bearer token.
router.post("/session/start", requireAuth(), startSession);
router.post("/heartbeat", requireAuth(), heartbeat);
router.post("/session/end", requireAuth(), endSession);
router.get("/analytics/:studentId", requireAuth(), getStudentAnalytics);

export default router;
