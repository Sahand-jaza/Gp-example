import type { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import StudySession from "../models/StudySession";
import AiSummary from "../models/AiSummary";
import StudentProfile from "../models/StudentProfile";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const generateLiveSummary = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.body; // or req.params

    // Fetch recent sessions
    const recentSessions = await StudySession.find({ studentId })
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
