import express from "express";
import { requireAuth, requireOrgRole } from "../middleware/auth";
import { generateLiveSummary, summarizeVideo } from "../controllers/aiController";

const router = express.Router();

router.post("/live-summary", requireAuth(), generateLiveSummary);

// Student clicks "Summarize It" on a video
router.get("/summarize/video/:videoId", requireAuth(), requireOrgRole("org:student"), summarizeVideo);

export default router;
