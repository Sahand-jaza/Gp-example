import mongoose from "mongoose";
import dotenv from "dotenv";
import ParentProfile from "../models/ParentProfile";

dotenv.config();

const seedParentCode = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const connectionCode = "TEST-1234";

    // Check if it already exists
    const existing = await ParentProfile.findOne({ connectionCode });
    if (existing) {
      console.log(`Connection code '${connectionCode}' already exists!`);
    } else {
      const newParent = new ParentProfile({
        // Since we don't have a real parent user, we'll just insert a dummy ID
        parentId: "test_parent_" + Date.now(),
        connectionCode: connectionCode,
      });

      await newParent.save();
      console.log(`Successfully created test ParentProfile!`);
      console.log(`Your test connection code is: ${connectionCode}`);
    }

  } catch (error) {
    console.error("Error seeding parent code:", error);
  } finally {
    mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

seedParentCode();
