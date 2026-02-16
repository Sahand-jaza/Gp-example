import mongoose from "mongoose";

const quizResultSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  studentId: {
    type: String, // Clerk User ID
    required: true,
  },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  answers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId }, // If questions have IDs
      questionIndex: { type: Number },
      selectedOptionIndex: { type: Number, required: true },
      isCorrect: { type: Boolean, required: true },
    },
  ],
  completedAt: { type: Date, default: Date.now },
});

// Prevent multiple submissions if desired, or allow retakes (keeping multiple)
// For now, allow multiples.

export default mongoose.model("QuizResult", quizResultSchema);
