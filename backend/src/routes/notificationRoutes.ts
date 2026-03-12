import express from "express";
import { requireAuth } from "../middleware/auth";
import {
  getNotifications,
  markAsRead,
} from "../controllers/notificationController";

const router = express.Router();

router.get("/", requireAuth(), getNotifications);
router.put("/:id/read", requireAuth(), markAsRead);

export default router;
