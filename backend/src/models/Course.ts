import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  teacherId: { type: String, required: true, ref: "User" },
  title: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Course", courseSchema);
