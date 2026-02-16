import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String },
  role: {
    type: String,
    enum: ["student", "parent", "teacher", "admin"],
    default: "student",
  },
  permissions: {
    type: [String],
    default: [],
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
