import express from "express";
import { requireAuth, requireOrgRole } from "../middleware/auth";
import { getParentProfile, getConnectedStudents } from "../controllers/parentController";

const router = express.Router();

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

export default router;
