import mongoose from "mongoose";

const studentProfileSchema = new mongoose.Schema({
  studentId: { type: String, required: true, ref: "User" },
  parentId: { type: String, ref: "User" },
  connectionCode: { type: String }, // Optional now, or removed if not needed for student
  createdAt: { type: Date, default: Date.now },
});

// Index for fast lookup logic
studentProfileSchema.index({ connectionCode: 1 });
studentProfileSchema.index({ studentId: 1 });

export default mongoose.model("StudentProfile", studentProfileSchema);
