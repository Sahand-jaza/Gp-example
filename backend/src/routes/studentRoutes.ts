import express from "express";
import type { Request, Response } from "express";
import { requireOrgRole, requireAuth } from "../middleware/auth";
import StudentProfile from "../models/StudentProfile";
import { getAuth } from "@clerk/express";
import { syncUser } from "../controllers/studentController";

const router = express.Router();

// POST /api/student/sync
// Syncs the user from Clerk to MongoDB
router.post("/sync", requireAuth(), syncUser);

// GET /api/student/profile
// Returns the student's profile and connection status
router.get(
  "/profile",
  requireOrgRole("org:student"),
  async (req: Request, res: Response) => {
    try {
      const { userId } = getAuth(req);

      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const studentProfile = await StudentProfile.findOne({
        studentId: userId,
      });

      if (!studentProfile) {
        res.status(404).json({ message: "Student profile not found" });
        return;
      }

      res.json({
        success: true,
        profile: {
          studentId: studentProfile.studentId,
          parentId: studentProfile.parentId || null,
          isLinked: !!studentProfile.parentId,
        },
      });
    } catch (error) {
      console.error("Error fetching student profile:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

export default router;
