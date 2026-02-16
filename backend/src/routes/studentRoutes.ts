import express, { Request, Response } from "express";
import { requireOrgRole } from "../middleware/auth";
import StudentProfile from "../models/StudentProfile";
import { getAuth } from "@clerk/express";

const router = express.Router();

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
