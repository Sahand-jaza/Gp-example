import express from "express";
import { requireAuth, requireOrgRole } from "../middleware/auth";
import { getParentProfile, getConnectedStudents, getStudentStats } from "../controllers/parentController";

const router = express.Router();

// Router-level Logging
router.use((req, res, next) => {
  console.log(`[DEBUG] ParentRouter Hit: ${req.method} ${req.path}`);
  next();
});

// Parent only
router.get(
  "/profile",
  requireAuth(),
  requireOrgRole("org:parent"),
  getParentProfile,
);

router.get(
  "/students",
  requireAuth(),
  requireOrgRole("org:parent"),
  getConnectedStudents,
);
router.get(
  "/students/:studentId/stats",
  requireAuth(),
  requireOrgRole("org:parent"),
  getStudentStats,
);

export default router;
