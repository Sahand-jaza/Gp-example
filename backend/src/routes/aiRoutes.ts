import express from "express";
import { requireAuth } from "../middleware/auth";
import { generateLiveSummary } from "../controllers/aiController";

const router = express.Router();

router.post("/live-summary", requireAuth(), generateLiveSummary);

export default router;
