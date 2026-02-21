import type { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import StudySession from "../models/StudySession";
import AiSummary from "../models/AiSummary";
import StudentProfile from "../models/StudentProfile";
import ParentProfile from "../models/ParentProfile";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const generateLiveSummary = async (req: Request, res: Response) => {
  try {
    const { studentId: targetStudentId } = req.body; // or req.params
    const reqUserId = (req as any).auth.userId;

    if (!targetStudentId) {
      res.status(400).json({ message: "studentId is required" });
      return;
    }

    // Authorization Check: Must be the student themselves OR their linked parent (or a Teacher)
    const reqOrgRole = (req as any).auth.orgRole;
    if (reqOrgRole !== "org:teacher") {
      if (reqOrgRole === "org:student") {
        if (targetStudentId !== reqUserId) {
          res
            .status(403)
            .json({
              message: "Forbidden: Cannot view another student's summary",
            });
          return;
        }
      } else if (reqOrgRole === "org:parent" || !reqOrgRole) {
        // Defaulting parent/no-role fallback
        const studentProfile = await StudentProfile.findOne({
          studentId: targetStudentId,
        });
        if (!studentProfile || studentProfile.parentId !== reqUserId) {
          res
            .status(403)
            .json({ message: "Forbidden: Not linked to this student" });
          return;
        }
      }
    }

    // Fetch recent sessions
    const recentSessions = await StudySession.find({
      studentId: targetStudentId,
    })
      .sort({ startTime: -1 })
      .limit(5);

    // Prepare data for AI
    const sessionData = recentSessions.map((s) => ({
      topic: s.sessionTopic,
      duration: s.endTime
        ? (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) /
          60000
        : "Ongoing",
      avgFocus: s.averageFocus,
      status: s.status,
    }));

    if (sessionData.length === 0) {
      res.json({ summary: "No recent study sessions found." });
      return;
    }

    const prompt = `
      You are an academic advisor. Here is the recent study data for a student: ${JSON.stringify(sessionData)}.
      Provide a concise 2-sentence summary of their performance and focus for the parent dashboard.
      Do not use markdown.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ summary: text });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ message: "AI generation failed" });
  }
};
