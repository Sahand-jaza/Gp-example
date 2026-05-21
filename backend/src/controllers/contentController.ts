import type { Request, Response } from "express";
import { 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand 
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../config/r2Storage";
import Course from "../models/Course";
import Video from "../models/Video";
import { getSignedViewUrl } from "../utils/s3";


// Get Presigned URL for Upload (Teacher only)
export const getUploadUrl = async (req: Request, res: Response) => {
  try {
    const { fileName, contentType, folder = "videos" } = req.body;
    const userId = (req as any).auth.userId;

    if (!fileName || !contentType) {
      res.status(400).json({ message: "fileName and contentType required" });
      return;
    }

    const bucketName = process.env.R2_BUCKET_NAME || "gp-container";
    const blobName = `${folder}/${userId}/${Date.now()}-${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: blobName,
      ContentType: contentType,
    });

    // Presigned URL for upload (expires in 1 hour)
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({ url, key: blobName });
  } catch (error) {
    console.error("R2 Sign Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Teacher's Own Courses
export const getMyCourses = async (req: Request, res: Response) => {
  try {
    const teacherId = (req as any).auth.userId;
    const courses = await Course.find({ teacherId }).sort({ createdAt: -1 });

    const coursesWithThumbnails = await Promise.all(
      courses.map(async (course) => {
        let thumbnailUrl = null;
        if (course.thumbnail) {
          try {
            thumbnailUrl = await getSignedViewUrl(course.thumbnail);
          } catch (err) {
            console.error("Failed to generate thumbnail url for", course._id);
          }
        }
        return { ...course.toObject(), thumbnailUrl };
      })
    );

    res.json(coursesWithThumbnails);
  } catch (error) {
    console.error("Get My Courses Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Single Course
export const getCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const teacherId = (req as any).auth?.userId || (req as any).userId;
    const userRole = (req as any).userRole; // Set by middleware
    const isAdmin = userRole === "admin" || userRole === "org:admin";

    const course = await Course.findOne({ _id: courseId });

    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Bypass check if admin, otherwise enforce ownership
    if (!isAdmin && course.teacherId !== teacherId) {
      res.status(403).json({ message: "Unauthorized access to this course" });
      return;
    }
    
    const matchedCourse = course;
    
    let thumbnailUrl = null;
    if (matchedCourse.thumbnail) {
      try {
        thumbnailUrl = await getSignedViewUrl(matchedCourse.thumbnail);
      } catch (err) {
        console.error("Failed to generate thumbnail url for", matchedCourse._id);
      }
    }
    
    res.json({ ...matchedCourse.toObject(), thumbnailUrl });
  } catch (error) {
    console.error(`[getCourse] Error:`, error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create Course
export const createCourse = async (req: Request, res: Response) => {
  try {
    const { title, description, thumbnail } = req.body;
    const teacherId = (req as any).auth.userId;

    const course = await Course.create({
      teacherId,
      title,
      description,
      thumbnail,
    });

    res.status(201).json({ success: true, course });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update Course
export const updateCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { title, description, thumbnail, isPublished } = req.body;
    const teacherId = (req as any).auth.userId;

    // Only update fields that are explicitly provided
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const course = await Course.findOneAndUpdate(
      { _id: courseId, teacherId },
      { $set: updateData },
      { new: true }
    );

    if (!course) {
      res.status(404).json({ message: "Course not found or unauthorized" });
      return;
    }

    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Course
export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const userRole = (req as any).userRole;
    const isAdmin = userRole === "admin" || userRole === "org:admin";

    // Verify course exists
    const course = await Course.findOne({ _id: courseId });
    if (!course) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Bypass check if admin, otherwise enforce ownership
    const userId = (req as any).userId;
    if (!isAdmin && course.teacherId !== userId) {
      res.status(403).json({ message: "Unauthorized: You do not own this course" });
      return;
    }

    const bucketName = process.env.R2_BUCKET_NAME || "gp-container";

    // Get all videos and delete from R2
    const videos = await Video.find({ courseId });
    for (const v of videos) {
      if (v.s3Key) {
        try {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: bucketName,
            Key: v.s3Key
          }));
        } catch (err) {
          console.error("Failed to delete video from R2:", v.s3Key);
        }
      }
    }

    // Delete thumbnail from R2 if exists
    if (course.thumbnail) {
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: course.thumbnail
        }));
      } catch (err) {
        console.error("Failed to delete thumbnail from R2:", course.thumbnail);
      }
    }

    // Delete records from database
    await Video.deleteMany({ courseId });
    await Course.deleteOne({ _id: courseId });

    res.json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    console.error("Delete Course Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add Video to Course
export const addVideoToCourse = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { title, s3Key, duration } = req.body;
    const teacherId = (req as any).auth.userId;

    // Verify course exists and belongs to this teacher
    const course = await Course.findOne({ _id: courseId, teacherId });
    if (!course) {
      res
        .status(403)
        .json({
          message: "Forbidden: You do not own this course or it doesn't exist",
        });
      return;
    }

    // Find highest order to put new video at the end
    const lastVideo = await Video.findOne({ courseId }).sort({ order: -1 });
    const newOrder = lastVideo ? lastVideo.order + 1 : 0;

    const video = await Video.create({
      courseId,
      title,
      s3Key,
      duration,
      order: newOrder,
    });

    res.status(201).json({ success: true, video });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get Course Videos (with Presigned View URLs)
export const getCourseVideos = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    // Find videos (sorted by order by default)
    const videos = await Video.find({ courseId }).sort({ order: 1, createdAt: 1 });

    // Generate Signed URLs for each
    const videosWithUrls = await Promise.all(
      videos.map(async (v) => {
        const url = await getSignedViewUrl(v.s3Key);

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

// Update Video (Rename)
export const updateVideo = async (req: Request, res: Response) => {
  try {
    const { courseId, videoId } = req.params;
    const { title } = req.body;
    const teacherId = (req as any).auth.userId;

    // Fast check course ownership
    const course = await Course.findOne({ _id: courseId, teacherId });
    if (!course) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const video = await Video.findOneAndUpdate(
      { _id: videoId, courseId },
      { title },
      { new: true }
    );

    if (!video) {
      res.status(404).json({ message: "Video not found" });
      return;
    }

    res.json({ success: true, video });
  } catch (error) {
    console.error("Update Video Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Video
export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const { courseId, videoId } = req.params;
    const teacherId = (req as any).auth.userId;

    const course = await Course.findOne({ _id: courseId, teacherId });
    if (!course) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const video = await Video.findOne({ _id: videoId, courseId });
    if (!video) {
      res.status(404).json({ message: "Video not found" });
      return;
    }

    // Delete from R2
    if (video.s3Key) {
      try {
        const bucketName = process.env.R2_BUCKET_NAME || "gp-container";
        await s3Client.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: video.s3Key
        }));
      } catch (err) {
        console.error("Failed to delete video from R2:", video.s3Key);
      }
    }

    await Video.deleteOne({ _id: videoId });
    res.json({ success: true, message: "Video deleted successfully" });
  } catch (error) {
    console.error("Delete Video Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reorder Videos
export const reorderVideos = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { list } = req.body; // Array of { id, order }
    const teacherId = (req as any).auth.userId;

    const course = await Course.findOne({ _id: courseId, teacherId });
    if (!course) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    // Bulk update orders
    for (let item of list) {
      await Video.updateOne(
        { _id: item.id, courseId },
        { $set: { order: item.order } }
      );
    }

    res.json({ message: "Videos reordered" });
  } catch (error) {
    console.error("Reorder Videos Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
