import mongoose from "mongoose";

const quizScoreSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  studentId: {
    type: String, // Clerk User ID
    required: true,
  },
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
    required: true,
  },
  bestScore: { type: Number, default: 0 },
  hasPassed: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
  lastAttemptAt: { type: Date, default: Date.now },
});

// A student can only have one score record per quiz
quizScoreSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

export default mongoose.model("QuizScore", quizScoreSchema);
