import express from "express";
import { handleClerkWebhook } from "../controllers/webhookController";

const router = express.Router();

router.post("/clerk", handleClerkWebhook);

export default router;
