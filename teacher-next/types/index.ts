export interface Course {
  _id: string;
  teacherId: string;
  title: string;
  description: string;
  thumbnail?: string;
  thumbnailUrl?: string;
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

export interface QuizQuestion {
  _id?: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Quiz {
  _id: string;
  title: string;
  courseId: string;
  videoId: string;
  teacherId: string;
  questions: QuizQuestion[];
  createdAt: string;
}
