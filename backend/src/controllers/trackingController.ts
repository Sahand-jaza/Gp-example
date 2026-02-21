import type { Request, Response } from "express";
import StudySession from "../models/StudySession";
import Video from "../models/Video";

// Start a Study Session
export const startSession = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).auth.userId;

    if (!studentId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const session = await StudySession.create({
      studentId,
      startTime: new Date(),
      status: "ACTIVE",
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Heartbeat (Aggregated Data from Desktop App)
// Desktop App sends this every 30-60s
export const heartbeat = async (req: Request, res: Response) => {
  try {
    const { sessionId, logs, averageFocus } = req.body;
    const studentId = (req as any).auth.userId;

    if (!sessionId) {
      res.status(400).json({ message: "sessionId required" });
      return;
    }

    const session = await StudySession.findById(sessionId);
    if (!session) {
      res.status(404).json({ message: "Session not found" });
      return;
    }

    // Verify ownership
    if (session.studentId !== studentId) {
      res
        .status(403)
        .json({ message: "Forbidden: Cannot update someone else's session" });
      return;
    }

    // Update session
    if (logs && Array.isArray(logs)) {
      session.logs.push(...logs);
    }
    if (averageFocus !== undefined) session.averageFocus = averageFocus;
    session.lastActive = new Date();

    await session.save();

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// End Session
export const endSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    const studentId = (req as any).auth.userId;

    const session = await StudySession.findById(sessionId);
    if (!session) {
      res.status(404).json({ message: "Session not found" });
      return;
    }

    // Verify ownership
    if (session.studentId !== studentId) {
      res
        .status(403)
        .json({ message: "Forbidden: Cannot end someone else's session" });
      return;
    }

    session.endTime = new Date();
    session.status = "COMPLETED";
    await session.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get Analytics (For Parent/Student/Teacher)
export const getStudentAnalytics = async (req: Request, res: Response) => {
  try {
    const { studentId: targetStudentId } = req.params;
    const reqUserId = (req as any).auth.userId;
    const reqOrgRole = (req as any).auth.orgRole; // if using Clerk orgs

    // Security check: Only the student themselves, their parent, or a teacher should see this.
    // For now, if role is student, they can only see their own.
    if (reqOrgRole === "org:student" && targetStudentId !== reqUserId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    // Example aggregation: Total study time, Avg focus
    const sessions = await StudySession.find({
      studentId: targetStudentId,
      status: "COMPLETED",
    });

    let totalMinutes = 0;
    let totalFocus = 0;

    sessions.forEach((s) => {
      if (s.startTime && s.endTime) {
        const diff =
          new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
        totalMinutes += diff / 1000 / 60;
      }
      totalFocus += s.averageFocus || 0;
    });

    const avgFocus = sessions.length > 0 ? totalFocus / sessions.length : 0;

    res.json({
      totalSessions: sessions.length,
      totalStudyTimeMinutes: Math.round(totalMinutes),
      averageFocusScore: Math.round(avgFocus),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
