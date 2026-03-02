"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/lib/api";
import { Video as VideoType, Course } from "@/types";
import { ArrowLeft, Plus, Video, PlayCircle, Loader2, Edit, Globe, EyeOff, Trash2, ChevronUp, ChevronDown, Check, X } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import VideoUploadForm from "@/components/dashboard/VideoUploadForm";
import EditCourseForm from "@/components/dashboard/EditCourseForm";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const api = useApi();
  const courseId = params.courseId as string;

  const [videos, setVideos] = useState<VideoType[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editVideoTitle, setEditVideoTitle] = useState("");
  const [isUpdatingVideo, setIsUpdatingVideo] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [videosRes, courseRes] = await Promise.all([
        api.get(`/api/courses/${courseId}/videos`),
        api.get(`/api/courses/${courseId}`)
      ]);
      setVideos(videosRes.data);
      setCourse(courseRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!course) return;
    try {
      setIsLoading(true); // Can also use a separate loading state to avoid full page reload look, but this resyncs data nicely
      await api.patch(`/api/courses/${courseId}`, {
        isPublished: !course.isPublished
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to toggle publish status", err);
      setIsLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!course) return;
    
    if (!window.confirm("Are you sure you want to completely delete this course and all its videos? This action cannot be undone.")) {
      return;
    }
    
    try {
      setIsDeleting(true);
      await api.delete(`/api/courses/${courseId}`);
      router.push("/dashboard/courses");
    } catch (err) {
      console.error("Failed to delete course", err);
      alert("Failed to delete the course. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleMoveVideo = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === videos.length - 1) return;

    const newVideos = [...videos];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    [newVideos[index], newVideos[swapIndex]] = [newVideos[swapIndex], newVideos[index]];
    
    // Optimistic UI update
    setVideos(newVideos);

    // Backend update list of mapping
    const list = newVideos.map((v, i) => ({ id: v._id, order: i }));
    try {
      await api.patch(`/api/courses/${courseId}/videos/reorder`, { list });
    } catch (err) {
      console.error("Reorder failed", err);
      fetchData(); // Revert on failure
    }
  };

  const handleSaveVideoTitle = async (videoId: string) => {
    if (!editVideoTitle.trim()) return;
    try {
      setIsUpdatingVideo(true);
      await api.patch(`/api/courses/${courseId}/videos/${videoId}`, { title: editVideoTitle });
      setEditingVideoId(null);
      await fetchData();
    } catch (err) {
      console.error("Failed to update video title", err);
    } finally {
      setIsUpdatingVideo(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!window.confirm("Are you sure you want to delete this video? It will be removed permanently from the course.")) return;
    try {
      setIsUpdatingVideo(true);
      await api.delete(`/api/courses/${courseId}/videos/${videoId}`);
      await fetchData();
    } catch (err) {
      console.error("Failed to delete video", err);
    } finally {
      setIsUpdatingVideo(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      fetchData();
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
          <div className="flex items-center gap-4 mt-1">
            {course?.thumbnailUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img 
                src={course.thumbnailUrl} 
                alt={course.title} 
                className="w-16 h-16 rounded-lg object-cover border border-gray-200 shadow-sm shrink-0"
              />
            )}
            <h1 className="text-2xl font-bold text-gray-900 flex flex-col gap-1">
              {course ? course.title : "Course details"}
              {course?.description && (
                <span className="text-sm font-normal text-gray-500">{course.description}</span>
              )}
            </h1>
            {course && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                course.isPublished ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
              }`}>
                {course.isPublished ? "Published" : "Draft"}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <button
            onClick={handleTogglePublish}
            disabled={isLoading || !course}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              course?.isPublished 
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200" 
                : "bg-green-100 text-green-700 hover:bg-green-200"
            } disabled:opacity-50`}
          >
            {course?.isPublished ? (
              <><EyeOff className="w-4 h-4" /> Unpublish</>
            ) : (
              <><Globe className="w-4 h-4" /> Publish</>
            )}
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            disabled={isDeleting}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50"
          >
            <Edit className="w-4 h-4" />
            Edit Details
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            disabled={isDeleting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Upload Video
          </button>
          <div className="h-8 w-px bg-gray-200 mx-1 hidden md:block"></div>
          <button
            onClick={handleDeleteCourse}
            disabled={isDeleting || !course}
            className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 group"
            title="Delete Course"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span className="hidden md:block">Delete</span>
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
              {videos.map((video, index) => (
                <li key={video._id} className="p-4 hover:bg-gray-50 transition-colors flex items-start sm:items-center gap-4 flex-col sm:flex-row group">
                  
                  {/* Reorder Controls */}
                  <div className="flex-col gap-1 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleMoveVideo(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 rounded text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      title="Move Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleMoveVideo(index, 'down')}
                      disabled={index === videos.length - 1}
                      className="p-1 hover:bg-gray-200 rounded text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      title="Move Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-blue-100 w-24 h-16 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                     <PlayCircle className="text-blue-600 w-8 h-8" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {editingVideoId === video._id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          value={editVideoTitle} 
                          onChange={e => setEditVideoTitle(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm w-full max-w-sm focus:outline-blue-500" 
                          autoFocus 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveVideoTitle(video._id);
                            if (e.key === 'Escape') setEditingVideoId(null);
                          }}
                        />
                        <button onClick={() => handleSaveVideoTitle(video._id)} disabled={isUpdatingVideo} className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200" title="Save changes">
                          {isUpdatingVideo ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>}
                        </button>
                        <button onClick={() => setEditingVideoId(null)} className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200" title="Cancel edit">
                          <X className="w-4 h-4"/>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-gray-900 font-medium truncate">{video.title}</h3>
                        <button 
                          onClick={() => { setEditingVideoId(video._id); setEditVideoTitle(video.title); }} 
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-all rounded"
                          title="Rename Video"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Uploaded {new Date(video.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
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

                    <button 
                      onClick={() => handleDeleteVideo(video._id)}
                      disabled={isUpdatingVideo}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100 hidden sm:block"
                      title="Delete Video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
            fetchData();
          }}
        />
      )}

      {/* Edit Course Modal */}
      {isEditModalOpen && course && (
        <EditCourseForm
          course={course}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
