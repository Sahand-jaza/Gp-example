import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
    required: true,
  },
  userId: { type: String, required: true, ref: "User" },
  text: { type: String, required: true },
  replies: [
    {
      userId: { type: String, required: true, ref: "User" },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Comment", commentSchema);
