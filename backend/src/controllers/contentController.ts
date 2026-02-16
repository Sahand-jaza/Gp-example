import type { Request, Response } from "express";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../config/s3";
import Course from "../models/Course";
import Video from "../models/Video";

// Get Presigned URL for Upload (Teacher only)
export const getUploadUrl = async (req: Request, res: Response) => {
  try {
    const { fileName, contentType } = req.body;
    const userId = (req as any).auth.userId; // Ensure this is a teacher in middleware/logic

    if (!fileName || !contentType) {
      res.status(400).json({ message: "fileName and contentType required" });
      return;
    }

    const key = `videos/${userId}/${Date.now()}-${fileName}`;
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

    res.json({ url, key });
  } catch (error) {
    console.error("S3 Sign Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create Course
export const createCourse = async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    const teacherId = (req as any).auth.userId;

    const course = await Course.create({
      teacherId,
      title,
      description,
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Add Video to Course
export const addVideoToCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { title, s3Key, duration } = req.body;

    const video = await Video.create({
      courseId,
      title,
      s3Key,
      duration,
    });

    res.status(201).json(video);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get Course Videos (with Presigned View URLs)
export const getCourseVideos = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    // Find videos
    const videos = await Video.find({ courseId });

    // Generate Signed URLs for each
    const videosWithUrls = await Promise.all(
      videos.map(async (v) => {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: v.s3Key,
        });

        const url = await getSignedUrl(s3Client, command, {
          expiresIn: 3600 * 2,
        }); // 2 hours

        return {
          ...v.toObject(),
          url, // Attach the signed URL
        };
      }),
    );

    res.json(videosWithUrls);
  } catch (error) {
    console.error("Get Videos Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
