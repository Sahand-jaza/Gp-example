import type { Request, Response } from "express";
import Comment from "../models/Comment";

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
    const comments = await Comment.find({ videoId }).populate(
      "userId",
      "name role",
    ); // Populate optional
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
