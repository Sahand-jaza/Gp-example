import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { getAllUsers, getAllParents } from "./src/controllers/adminController.ts";
import StudentProfile from "./src/models/StudentProfile.ts";
import ParentProfile from "./src/models/ParentProfile.ts";

console.log("StudentProfile exists?", !!StudentProfile);
console.log("ParentProfile exists?", !!ParentProfile);

async function run() {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log("Connected to DB");
  
  const req = {} as any;
  const res = {
    json: (data: any) => { console.log("JSON:", JSON.stringify(data).substring(0, 200)); },
    status: (code: any) => ({ json: (data: any) => console.log("STATUS", code, data) })
  } as any;
  
  await getAllUsers(req, res);
  await getAllParents(req, res);
  process.exit(0);
}
run();
