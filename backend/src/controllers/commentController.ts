import type { Request, Response } from "express";
import Comment from "../models/Comment";
import Course from "../models/Course";
import Video from "../models/Video";
import User from "../models/User";
import Notification from "../models/Notification";

export const addComment = async (req: Request, res: Response) => {
  try {
    const { videoId, text } = req.body;
    const userId = (req as any).auth.userId;

    const comment = await Comment.create({
      videoId,
      userId,
      text,
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getCommentsConfig = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const comments = await Comment.find({ videoId })
      .sort({ createdAt: 1 })
      .lean();

    // Manually populate user info
    const studentClerkIds = Array.from(new Set(comments.map((c: any) => c.userId)));
    const users = await User.find({ clerkId: { $in: studentClerkIds } }).select("clerkId name role");
    
    const userMap = new Map();
    users.forEach(u => userMap.set(u.clerkId, u));

    const populatedComments = comments.map((comment: any) => ({
      ...comment,
      userId: userMap.get(comment.userId) || { name: "Unknown User", clerkId: comment.userId }
    }));

    res.json(populatedComments);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllCommentsForTeacher = async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).auth.userId;

    // 1. Get all courses for this teacher
    const courses = await Course.find({ teacherId });
    const courseIds = courses.map((c) => c._id);

    // 2. Get all videos for these courses
    const videos = await Video.find({ courseId: { $in: courseIds } });
    const videoIds = videos.map((v) => v._id);

    // 3. Get all comments for these videos
    // We avoid .populate("userId") because userId stores the Clerk ID (String) 
    // and User model uses ObjectId by default, triggering a CastError.
    const comments = await Comment.find({ videoId: { $in: videoIds } })
      .populate({
        path: "videoId",
        select: "title courseId",
        populate: {
          path: "courseId",
          select: "title",
        },
      })
      .sort({ createdAt: -1 })
      .lean(); // Use lean for easier manual population

    // 4. Manually populate user info
    const studentClerkIds = Array.from(new Set(comments.map((c: any) => c.userId)));
    const users = await User.find({ clerkId: { $in: studentClerkIds } }).select("clerkId name role");
    
    const userMap = new Map();
    users.forEach(u => userMap.set(u.clerkId, u));

    const populatedComments = comments.map((comment: any) => ({
      ...comment,
      userId: userMap.get(comment.userId) || { name: "Unknown Student", clerkId: comment.userId }
    }));

    res.json(populatedComments);
  } catch (error) {
    console.error("Error in getAllCommentsForTeacher:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const replyToComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = (req as any).auth.userId;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    comment.replies.push({
      userId,
      text,
      createdAt: new Date(),
    } as any);

    await comment.save();

    // Create a notification for the student (original commenter)
    try {
      if (comment.userId !== userId) { // Only notify if the replier is not the commenter
        // Fetch video to get courseId for the link
        const video = await Video.findById(comment.videoId);
        const courseLink = video ? `/course/${video.courseId}` : `/`;

        await Notification.create({
          userId: comment.userId,
          type: "reply",
          message: `The teacher replied to your question!`,
          link: courseLink,
        });
      }
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error("Error in replyToComment:", error);
    res.status(500).json({ message: "Server error" });
  }
};
