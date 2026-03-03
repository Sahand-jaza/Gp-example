import type { Request, Response } from "express";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../config/s3";
import { GoogleGenAI } from "@google/genai";
import Video from "../models/Video";
import Quiz from "../models/Quiz";
import QuizScore from "../models/QuizScore";
import Course from "../models/Course";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Configure Gemini to output strict JSON matching our Mongoose schema
// Configure Gemini to output strict JSON matching our Mongoose schema
const quizSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING", description: "A short, engaging title for this video quiz." },
    questions: {
      type: "ARRAY",
      description: "A list of 3-5 multiple choice questions based on the video.",
      items: {
        type: "OBJECT",
        properties: {
          questionText: { type: "STRING" },
          options: { type: "ARRAY", items: { type: "STRING" }, description: "Exactly 4 multiple choice options." },
          correctAnswerIndex: { type: "INTEGER", description: "The array index (0-3) of the correct option." }
        },
        required: ["questionText", "options", "correctAnswerIndex"]
      }
    }
  },
  required: ["title", "questions"]
};

// 1. Generate Quiz (Teacher Only)
export const generateQuiz = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const teacherId = (req as any).auth.userId;

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

    // Generate S3 URL for Gemini
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: video.s3Key,
    });
    const videoUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    console.log(`Sending Video to Gemini from URL: ${videoUrl.substring(0, 50)}...`);

    // Call Gemini with the Video URL
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: "Watch this educational video and generate a multiple choice quiz to test a student's comprehension. Respond ONLY in valid JSON matching the schema." },
            { fileData: { fileUri: videoUrl, mimeType: "video/mp4" } }
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
  }
};

// 1.5 Update Quiz Manually (Teacher)
export const updateQuiz = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const { title, questions } = req.body;
    const teacherId = (req as any).auth.userId;

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

// 2. Get Video's Quiz (Teacher or Student)
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
    const studentId = (req as any).auth.userId;

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

    // Default to 80 if schema isn't updated yet in old docs
    const passingScore = (quiz as any).passingScore || 80; 
    const scorePercentage = Math.round((correctCount / quiz.questions.length) * 100);
    const hasPassed = scorePercentage >= passingScore;

    // Save Attempt
    const quizScore = await QuizScore.findOneAndUpdate(
      { quizId, studentId },
      {
        $setOnInsert: { videoId: quiz.videoId },
        $max: { bestScore: scorePercentage },
        $set: { hasPassed: hasPassed, lastAttemptAt: new Date() },
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
