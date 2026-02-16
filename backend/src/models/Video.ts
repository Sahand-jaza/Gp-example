import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  title: { type: String, required: true },
  s3Key: { type: String, required: true }, // Not the public URL
  duration: { type: Number }, // in seconds
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Video", videoSchema);
