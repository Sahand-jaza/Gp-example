import mongoose from "mongoose";

const focusLogSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    focusLevel: { type: Number },
    currentActivity: { type: String },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video" },
  },
  { _id: false },
);

const studySessionSchema = new mongoose.Schema({
  studentId: { type: String, required: true, ref: "User" },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  lastActive: { type: Date, default: Date.now },
  averageFocus: { type: Number },
  sessionTopic: { type: String },
  status: {
    type: String,
    enum: ["ACTIVE", "COMPLETED", "DROPPED"],
    default: "ACTIVE",
  },
  logs: [focusLogSchema],
});

studySessionSchema.index({ studentId: 1, status: 1 });

export default mongoose.model("StudySession", studySessionSchema);
