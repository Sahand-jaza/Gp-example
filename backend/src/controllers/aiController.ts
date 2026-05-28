import type { Request, Response } from "express";
import StudySession from "../models/StudySession";
import AiSummary from "../models/AiSummary";
import StudentProfile from "../models/StudentProfile";
import ParentProfile from "../models/ParentProfile";
import Video from "../models/Video";
import { 
  GetObjectCommand 
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../config/r2Storage";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper to generate Signed URL for viewing (S3/R2)
const getSignedViewUrl = async (blobName: string) => {
  const bucketName = process.env.R2_BUCKET_NAME || "gp-container";
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: blobName,
  });
  // 1 hour expiry for Gemini access
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};


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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.3 }
    });

    const text = response.text ?? "";
    res.json({ summary: text });
  } catch (error: any) {
    console.error("AI Error:", error);
    if (error?.status === 503) {
      res.status(503).json({ message: "The AI service is currently experiencing high demand. Please try again in a few moments." });
      return;
    }
    res.status(500).json({ message: "AI generation failed" });
  }
};

export const summarizeVideo = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;

    // 1. Check if we already generated a summary for this video
    const existingSummary = await AiSummary.findOne({ videoId });
    if (existingSummary) {
      res.json({ summary: existingSummary.summaryText });
      return;
    }

    // 2. Fetch the Video
    const video = await Video.findById(videoId);
    if (!video) {
       res.status(404).json({ message: "Video not found" });
       return;
    }

    // 3. Generate Signed URL for Gemini (R2) to access the video
    const videoUrl = await getSignedViewUrl(video.s3Key);
    
    console.log(`Sending Video to Gemini for summarization: ${videoUrl.substring(0, 50)}...`);

    // 4. Send to Gemini
    const prompt = `Watch this educational video and provide a concise, comprehensive summary of its key learning points. Format your response into short, highly-readable bullet points that a student can quickly review. Only return the text summary, no extra conversational preamble. Do not use markdown headers, just return a bulleted list.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { fileData: { fileUri: videoUrl, mimeType: "video/mp4" } }
          ]
        }
      ],
      config: {
        temperature: 0.3,
      }
    });

    const summaryText = response.text;
    if (!summaryText) {
      throw new Error("Gemini returned empty response");
    }

    // 5. Cache the result
    await AiSummary.create({
      videoId,
      summaryText,
    });

    // 6. Return to user
    res.json({ summary: summaryText });
  } catch (error: any) {
    console.error("Generate Video Summary Error:", error);
    if (error?.status === 503) {
      res.status(503).json({ message: "The AI service is currently experiencing high demand. Please try again in a few moments." });
      return;
    }
    res.status(500).json({ message: "Failed to summarize video", error: error.message });
  }
};
