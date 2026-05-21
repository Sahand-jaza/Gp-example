import express from "express";
import { requireAuth, requireOrgRole } from "../middleware/auth";
import { linkStudentToParent } from "../controllers/connectionController";

const router = express.Router();

// Student links themselves to parent using a parent connection code.
// requireAuth() is enough here — the controller validates via StudentProfile/ParentProfile.
// We intentionally do NOT use requireOrgRole("org:student") because on first login
// the student's User document may not exist yet (webhook hasn't fired), causing a
// chicken-and-egg 403 that prevents the student from ever completing setup.
router.post("/link", requireAuth(), linkStudentToParent);

export default router;
