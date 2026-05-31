import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { 
  GetObjectCommand 
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../config/r2Storage";
import { GoogleGenAI, Type } from "@google/genai";
import Video from "../models/Video";
import Quiz from "../models/Quiz";
import QuizScore from "../models/QuizScore";
import Course from "../models/Course";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper to generate Signed URL for viewing (S3/R2)
const getSignedViewUrl = async (blobName: string) => {
  const bucketName = process.env.R2_BUCKET_NAME || "gp-container";
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: blobName,
  });

  // Generate a signed URL that expires in 1 hour (3600 seconds) for Gemini
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

// Configure Gemini to output strict JSON matching our Mongoose schema
const quizSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A short, engaging title for this video quiz." },
    questions: {
      type: Type.ARRAY,
      description: "A list of 3-5 multiple choice questions based on the video.",
      items: {
        type: Type.OBJECT,
        properties: {
          questionText: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exactly 4 multiple choice options." },
          correctAnswerIndex: { type: Type.INTEGER, description: "The array index (0-3) of the correct option." }
        },
        required: ["questionText", "options", "correctAnswerIndex"]
      }
    }
  },
  required: ["title", "questions"]
};

import fs from "fs";
import path from "path";
import os from "os";
import { pipeline } from "stream/promises";

// 1. Generate Quiz (Teacher Only)
export const generateQuiz = async (req: Request, res: Response) => {
  let tempFilePath: string | null = null;
  let geminiFileName: string | null = null;
  
  try {
    const { videoId } = req.params;
    const { userId: teacherId } = getAuth(req);

    const video = await Video.findById(videoId);
    if (!video) {
      res.status(404).json({ message: "Video not found" });
      return;
    }

    // Verify ownership
    const course = await Course.findOne({ _id: video.courseId, teacherId });
    if (!course) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    // Generate Signed URL for Gemini (R2)
    const videoUrl = await getSignedViewUrl(video.s3Key);

    console.log(`Downloading Video from URL: ${videoUrl.substring(0, 50)}...`);

    // 1. Download video to a temporary file
    const fetchResponse = await fetch(videoUrl);
    if (!fetchResponse.ok || !fetchResponse.body) {
      throw new Error(`Failed to download video: ${fetchResponse.statusText}`);
    }
    
    tempFilePath = path.join(os.tmpdir(), `video-${Date.now()}.mp4`);
    
    // Convert Web stream to Node stream for pipeline
    const { Readable } = require("stream");
    const nodeReadable = Readable.fromWeb(fetchResponse.body as any);
    const fileStream = fs.createWriteStream(tempFilePath);
    
    await pipeline(nodeReadable, fileStream);
    
    console.log(`Video downloaded to ${tempFilePath}, uploading to Gemini File API...`);

    // 2. Upload to Gemini File API
    const uploadResult = await ai.files.upload({
      file: tempFilePath,
      config: { mimeType: "video/mp4" },
    });
    
    geminiFileName = uploadResult.name || null;
    console.log(`Uploaded to Gemini as ${geminiFileName}. Waiting for processing...`);
    
    // 3. Wait for the video to be processed by Gemini (state = ACTIVE)
    let fileState = uploadResult.state;
    let attempts = 0;
    while (fileState === "PROCESSING" && attempts < 30) {
      await new Promise(r => setTimeout(r, 2000)); // Wait 2s
      const fileInfo = await ai.files.get({ name: geminiFileName! });
      fileState = fileInfo.state;
      attempts++;
    }
    
    if (fileState === "FAILED") {
      throw new Error("Gemini File API failed to process the video.");
    }
    
    console.log(`Video processing complete. State: ${fileState}. Generating quiz...`);

    // 4. Call Gemini with the Video URL
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { fileData: { fileUri: uploadResult.uri, mimeType: "video/mp4" } },
            { text: "Watch this educational video and generate a multiple choice quiz to test a student's comprehension. Respond ONLY in valid JSON matching the schema." }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
        temperature: 0.2, // Low temp for factual questions
      }
    });

    const aiText = response.text;
    if (!aiText) {
      throw new Error("Gemini returned empty response");
    }

    const quizData = JSON.parse(aiText);

    // Upsert the Quiz into Database
    const quiz = await Quiz.findOneAndUpdate(
      { videoId },
      {
        title: quizData.title,
        courseId: video.courseId,
        teacherId,
        questions: quizData.questions
      },
      { new: true, upsert: true }
    );

    res.json(quiz);
  } catch (error: any) {
    console.error("Generate Quiz Error:", error);
    res.status(500).json({ message: "Failed to generate quiz", error: error.message });
  } finally {
    // Cleanup temporary file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        console.error("Failed to delete temp file:", e);
      }
    }
    
    // Optionally delete from Gemini to save space
    if (geminiFileName) {
      try {
        await ai.files.delete({ name: geminiFileName });
        console.log(`Deleted ${geminiFileName} from Gemini.`);
      } catch (e) {
        console.error("Failed to delete file from Gemini:", e);
      }
    }
  }
};

// 1.5 Update Quiz Manually (Teacher)
export const updateQuiz = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const { title, questions } = req.body;
    const { userId: teacherId } = getAuth(req);

    const video = await Video.findById(videoId);
    if (!video) {
      res.status(404).json({ message: "Video not found" });
      return;
    }

    // Verify ownership
    const course = await Course.findOne({ _id: video.courseId, teacherId });
    if (!course) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const quiz = await Quiz.findOneAndUpdate(
      { videoId },
      {
        title: title || "Video Quiz",
        courseId: video.courseId,
        teacherId,
        questions
      },
      { new: true, upsert: true }
    );

    res.json(quiz);
  } catch (error) {
    console.error("Update Quiz Error:", error);
    res.status(500).json({ message: "Failed to update quiz" });
  }
};

// 2. Get Video's Quiz (Teacher Only)
export const getQuizByVideo = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const quiz = await Quiz.findOne({ videoId });
    if (!quiz) {
       res.status(404).json({ message: "Quiz not found for this video" });
       return;
    }

    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// 2.1 Get Video's Quiz for Student (Strips correct answers)
export const getStudentQuizByVideo = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const quiz = await Quiz.findOne({ videoId });
    if (!quiz) {
       res.status(404).json({ message: "Quiz not found for this video" });
       return;
    }

    // Strip correct answers
    const quizObj = quiz.toObject();
    (quizObj as any).questions = quizObj.questions.map((q: any) => {
      delete q.correctAnswerIndex;
      return q;
    });

    res.json(quizObj);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// 2.5 Get All Quizzes for a Course
export const getQuizzesByCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const quizzes = await Quiz.find({ courseId });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// 3. Submit Quiz Attempt (Student Only)
export const submitQuiz = async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body; // Array of selected indexes
    const { userId: studentId } = getAuth(req);

    if (!studentId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      res.status(404).json({ message: "Quiz not found" });
      return;
    }

    // Grade it
    let correctCount = 0;
    quiz.questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const passingScore = quiz.passingScore ?? 80;
    const scorePercentage = Math.round((correctCount / quiz.questions.length) * 100);
    const hasPassed = scorePercentage >= passingScore;

    // Save Attempt — hasPassed can only ever be upgraded (true), never downgraded back to false
    const quizScore = await QuizScore.findOneAndUpdate(
      { quizId, studentId },
      {
        $setOnInsert: { videoId: quiz.videoId },
        $max: { bestScore: scorePercentage },
        $set: { lastAttemptAt: new Date() },
        ...(hasPassed ? { $set: { hasPassed: true, lastAttemptAt: new Date() } } : {}),
        $inc: { attempts: 1 }
      },
      { new: true, upsert: true }
    );

    res.json({
      score: scorePercentage,
      passed: hasPassed,
      correctCount,
      total: quiz.questions.length
    });
  } catch (error) {
    console.error("Submit Quiz Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
