import mongoose from "mongoose";

const aiSummarySchema = new mongoose.Schema({
  studentId: { type: String, ref: "User" }, // For parent summaries
  parentId: { type: String, ref: "User" },
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video" }, // For caching video summaries
  summaryText: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

export default mongoose.model("AiSummary", aiSummarySchema);
