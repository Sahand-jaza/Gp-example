import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

const accountId = process.env.R2_ACCOUNT_ID || "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
const bucketName = process.env.R2_BUCKET_NAME || "";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function checkR2() {
  console.log("Checking R2 Connection...");
  console.log("Endpoint:", `https://${accountId}.r2.cloudflarestorage.com`);
  console.log("Bucket:", bucketName);

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1
    });
    await s3Client.send(command);
    console.log("✅ R2 Connection Successful!");
  } catch (err: any) {
    console.error("❌ R2 Connection Failed:", err.message);
  }
}

checkR2();
