import mongoose, { Document, Schema } from "mongoose";

export interface IPlatformSettings extends Document {
  featuredTitle: string;
  newlyUploadedTitle: string;
  teacherTitle: string;
}

const platformSettingsSchema = new Schema<IPlatformSettings>({
  featuredTitle: { type: String, default: "Featured & reccomended" },
  newlyUploadedTitle: { type: String, default: "Newly uploaded" },
  teacherTitle: { type: String, default: "New from {Teacher}" }
});

const PlatformSettings = mongoose.model<IPlatformSettings>("PlatformSettings", platformSettingsSchema);
export default PlatformSettings;
