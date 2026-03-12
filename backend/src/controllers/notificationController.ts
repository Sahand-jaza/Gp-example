import type { Request, Response } from "express";
import Notification from "../models/Notification";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).auth.userId;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(notifications);
  } catch (error) {
    console.error("Error in getNotifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).auth.userId;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }

    res.json(notification);
  } catch (error) {
    console.error("Error in markAsRead:", error);
    res.status(500).json({ message: "Server error" });
  }
};
