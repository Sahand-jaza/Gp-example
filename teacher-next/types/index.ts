export interface Course {
  _id: string;
  teacherId: string;
  title: string;
  description: string;
  thumbnail: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  _id: string;
  courseId: string;
  title: string;
  s3Key: string;
  duration: number;
  order: number;
  url?: string; // Presigned URL from backend
  createdAt: string;
  updatedAt: string;
}
