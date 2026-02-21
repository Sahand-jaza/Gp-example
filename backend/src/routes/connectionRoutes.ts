import express from "express";
import { requireAuth, requireOrgRole } from "../middleware/auth";
import { linkStudentToParent } from "../controllers/connectionController";

const router = express.Router();

// Student only
router.post(
  "/link",
  requireAuth(),
  requireOrgRole("org:student"),
  linkStudentToParent,
);

export default router;
