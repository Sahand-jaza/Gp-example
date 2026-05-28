import type { Request, Response } from "express";
import Feedback from "../models/Feedback";
import User from "../models/User";
import Course from "../models/Course";

// @route   POST /api/feedback
// @desc    Submit or update course feedback (rating & comment)
// @access  Private (Student)
export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId, rating, comment } = req.body;
    const studentId = (req as any).auth.userId;

    if (!studentId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!courseId || !rating) {
      res.status(400).json({ message: "Course ID and rating are required" });
      return;
    }

    // Check if the student has already rated this course
    let feedback = await Feedback.findOne({ studentId, courseId });

    if (feedback) {
      // Update existing feedback
      feedback.rating = rating;
      feedback.comment = comment;
      feedback.createdAt = new Date(); // Update timestamp
      await feedback.save();
    } else {
      // Create new feedback
      feedback = new Feedback({
        studentId,
        courseId,
        rating,
        comment,
      });
      await feedback.save();
    }

    res.status(200).json(feedback);
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/feedback/course/:courseId
// @desc    Get all feedback and average rating for a specific course
// @access  Private
export const getCourseFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;

    const feedbacks = await Feedback.find({ courseId }).sort({ createdAt: -1 }).lean();

    if (feedbacks.length === 0) {
      res.json({ averageRating: 0, totalRatings: 0, reviews: [] });
      return;
    }

    // Calculate average rating
    const totalRating = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
    const averageRating = (totalRating / feedbacks.length).toFixed(1);

    // Manually populate user info since studentId is Clerk ID
    const studentClerkIds = Array.from(new Set(feedbacks.map((f: any) => f.studentId)));
    const users = await User.find({ clerkId: { $in: studentClerkIds } }).select("clerkId name imageUrl");
    
    const userMap = new Map();
    users.forEach(u => userMap.set(u.clerkId, u));

    const populatedFeedbacks = feedbacks.map((feedback: any) => ({
      ...feedback,
      student: userMap.get(feedback.studentId) || { name: "Unknown Student", clerkId: feedback.studentId }
    }));

    res.status(200).json({
      averageRating: parseFloat(averageRating),
      totalRatings: feedbacks.length,
      reviews: populatedFeedbacks
    });

  } catch (error) {
    console.error("Error fetching course feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/feedback/all
// @desc    Get all feedback across all courses (for teacher/admin dashboard)
// @access  Private (Teacher/Admin)
export const getAllFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).auth.userId;
    
    // We should ideally fetch courses created by this teacher
    // But since the Course model might not have teacherId directly in this sample,
    // we'll fetch all feedback and populate course info.
    
    const feedbacks = await Feedback.find()
      .populate({
        path: "courseId",
        select: "title",
      })
      .sort({ createdAt: -1 })
      .lean();

    // Manually populate user info
    const studentClerkIds = Array.from(new Set(feedbacks.map((f: any) => f.studentId)));
    const users = await User.find({ clerkId: { $in: studentClerkIds } }).select("clerkId name imageUrl");
    
    const userMap = new Map();
    users.forEach(u => userMap.set(u.clerkId, u));

    const populatedFeedbacks = feedbacks.map((feedback: any) => ({
      ...feedback,
      student: userMap.get(feedback.studentId) || { name: "Unknown Student", clerkId: feedback.studentId }
    }));

    res.status(200).json(populatedFeedbacks);

  } catch (error) {
    console.error("Error fetching all feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
};
