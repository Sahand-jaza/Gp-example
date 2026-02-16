import express from "express";
import { requireAuth } from "../middleware/auth";
import { linkStudentToParent } from "../controllers/connectionController";

const router = express.Router();

router.post("/link", requireAuth(), linkStudentToParent);

export default router;
