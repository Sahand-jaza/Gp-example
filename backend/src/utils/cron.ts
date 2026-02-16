import cron from "node-cron";
import User from "../models/User";
import StudentProfile from "../models/StudentProfile";
import StudySession from "../models/StudySession";
import AiSummary from "../models/AiSummary";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Resend } from "resend";
import admin from "../config/firebase";

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const startCronJobs = () => {
  // Run every day at 8 PM
  cron.schedule("0 20 * * *", async () => {
    console.log("Running Daily Summary Job...");

    try {
      const students = await StudentProfile.find().populate("parentId");

      for (const student of students) {
        if (!student.parentId) continue;

        // Fetch today's sessions
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sessions = await StudySession.find({
          studentId: student.studentId,
          startTime: { $gte: today },
        });

        if (sessions.length === 0) continue;

        // Generate Summary
        const sessionData = sessions.map((s) => ({
          focus: s.averageFocus,
          topic: s.sessionTopic,
        }));

        const prompt = `
                    Analyze this daily study data: ${JSON.stringify(sessionData)}.
                    Write a helpful 3-sentence daily report for the parent.
                 `;

        if (!genAI) {
          console.log("Skipping AI summary: No API Key");
          continue;
        }
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const summaryText = result.response.text();

        // Save to DB
        await AiSummary.create({
          studentId: student.studentId,
          parentId: student.parentId,
          summaryText,
        });

        // Send Email
        // Need parent email. student.parentId is just ID, need to fetch User.
        // Assuming populate worked or we fetch user:
        // const parentUser = await User.findOne({ clerkId: student.parentId });
        // if (parentUser?.email) {
        //   await resend.emails.send({ ... });
        // }

        // Send FCM Notification
        // const message = {
        //   notification: { title: 'Daily Report', body: summaryText },
        //   topic: `parent_${student.parentId}`
        // };
        // await admin.messaging().send(message);
      }
    } catch (error) {
      console.error("Cron Error:", error);
    }
  });
};
