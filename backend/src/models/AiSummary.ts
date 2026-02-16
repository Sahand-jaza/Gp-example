import mongoose from "mongoose";

const aiSummarySchema = new mongoose.Schema({
  studentId: { type: String, required: true, ref: "User" },
  parentId: { type: String, ref: "User" },
  summaryText: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

export default mongoose.model("AiSummary", aiSummarySchema);
