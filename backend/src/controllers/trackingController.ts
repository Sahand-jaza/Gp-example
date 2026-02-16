import type { Request, Response } from "express";
import StudySession from "../models/StudySession";
import Video from "../models/Video";

// Start a Study Session
export const startSession = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.body; // Or get from auth if student is calling
    // For Desktop app, it might send studentId directly if auth is tricky, but preferably use req.auth.userId

    if (!studentId) {
      res.status(400).json({ message: "studentId required" });
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

    if (!sessionId) {
      res.status(400).json({ message: "sessionId required" });
      return;
    }

    const session = await StudySession.findById(sessionId);
    if (!session) {
      res.status(404).json({ message: "Session not found" });
      return;
    }

    // Update session
    if (logs && Array.isArray(logs)) {
      session.logs.push(...logs);
    }
    if (averageFocus) session.averageFocus = averageFocus;
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
    await StudySession.findByIdAndUpdate(sessionId, {
      endTime: new Date(),
      status: "COMPLETED",
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get Analytics (For Parent/Student)
export const getStudentAnalytics = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;

    // Example aggregation: Total study time, Avg focus
    const sessions = await StudySession.find({
      studentId,
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
