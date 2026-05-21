import express from "express";
import { requireAuth, requireOrgRole } from "../middleware/auth";
import { generateLiveSummary, summarizeVideo } from "../controllers/aiController";

const router = express.Router();

// Fix #7: Restrict live-summary to students only (prevents parents/unauthenticated from triggering AI calls)
router.post("/live-summary", requireAuth(), requireOrgRole("org:student"), generateLiveSummary);


// Student clicks "Summarize It" on a video
router.get("/summarize/video/:videoId", requireAuth(), requireOrgRole("org:student"), summarizeVideo);

export default router;
