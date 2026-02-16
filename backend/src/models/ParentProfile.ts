import mongoose from "mongoose";

const parentProfileSchema = new mongoose.Schema({
  parentId: { type: String, required: true, ref: "User" },
  connectionCode: { type: String, unique: true, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Index for fast lookup

parentProfileSchema.index({ parentId: 1 });

export default mongoose.model("ParentProfile", parentProfileSchema);
