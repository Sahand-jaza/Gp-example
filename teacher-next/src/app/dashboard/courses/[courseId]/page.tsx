"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/lib/api";
import { Video as VideoType } from "@/types";
import { ArrowLeft, Plus, Video, PlayCircle, Loader2 } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import VideoUploadForm from "@/components/dashboard/VideoUploadForm"; // Will create this next

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const api = useApi();
  const courseId = params.courseId as string;

  const [videos, setVideos] = useState<VideoType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // We actually don't have a GET /api/courses/:courseId in the backend either, 
  // but we do have GET /api/courses/:courseId/videos.
  // We'll fetch videos, but for actual course title display, we might need a new endpoint or pass state.
  // For now, let's fetch videos.
  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/api/courses/${courseId}/videos`);
      setVideos(res.data);
      // Wait, let's also fetch course details if possible, otherwise mock it.
      // We will need a backend `GET /api/courses/:id` later.
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      fetchVideos();
    }
  }, [courseId, api]);

  return (
    <div className="flex flex-col flex-1 h-full w-full bg-gray-50">
      {/* Header Inside Page */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => router.push("/dashboard/courses")}
            className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Courses
          </button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Course details
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Upload Video
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto max-w-5xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100 border-dashed">
            <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No videos uploaded</h3>
            <p className="text-gray-500 mt-1 mb-6">Upload your first lesson to this course.</p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Upload Video
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Course Content ({videos.length})</h2>
            </div>
            <ul className="divide-y divide-gray-100">
              {videos.map((video) => (
                <li key={video._id} className="p-4 hover:bg-gray-50 transition-colors flex items-start sm:items-center gap-4 flex-col sm:flex-row">
                  <div className="bg-blue-100 w-24 h-16 rounded-lg flex items-center justify-center shrink-0">
                     <PlayCircle className="text-blue-600 w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 font-medium truncate">{video.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">Uploaded Date Placeholder</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                    {video.url ? (
                      <a 
                        href={video.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors text-center w-full sm:w-auto"
                      >
                        Preview
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">Processing...</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {/* Upload Video Modal */}
      {isUploadModalOpen && (
        <VideoUploadForm
          courseId={courseId}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={() => {
            setIsUploadModalOpen(false);
            fetchVideos();
          }}
        />
      )}
    </div>
  );
}
