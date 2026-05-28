import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  teacherId: { type: String, required: true, ref: "User" },
  title: { type: String, required: true },
  description: { type: String },
  thumbnail: { type: String },
  isPublished: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  grade: { type: String },
  subject: { type: String },
  duration: { type: String },
  rating: { type: Number, default: 4.5 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Course", courseSchema);
