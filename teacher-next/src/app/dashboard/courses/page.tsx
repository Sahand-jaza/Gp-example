"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/lib/api";
import { UserButton } from "@clerk/nextjs";
import { Course } from "@/types";
import { Plus, Video, PlayCircle } from "lucide-react";
import CourseForm from "@/components/dashboard/CourseForm";
import Link from "next/link";
import ForbiddenError from "@/components/dashboard/ForbiddenError";

export default function CoursesPage() {
  const api = useApi();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      // Wait, there isn't actually a GET /api/courses in the backend contentRoutes.ts 
      // We need to implement fetching teacher's courses via a new endpoint soon or mock it for now.
      // Let's assume we add an endpoint GET /api/courses/my-courses in the backend. 
      const res = await api.get("/api/courses/my-courses");
      setCourses(res.data);
    } catch (error: any) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        setIsForbidden(true);
      }
      console.error("Failed to fetch courses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchCourses();
  }, [api]);

  if (isForbidden) {
    return <ForbiddenError />;
  }

  return (
    <div className="flex flex-col flex-1 h-full w-full">
      {/* Header Inside Page */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-sm text-gray-500">
            Manage your classes and video content
          </p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Course
          </button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
            <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No courses yet</h3>
            <p className="text-gray-500 mt-1 mb-6">Create your first course to start uploading videos.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-40 bg-gray-100 relative group overflow-hidden">
                  {course.thumbnailUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={course.thumbnailUrl} 
                      alt={course.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <PlayCircle className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm backdrop-blur-md ${
                      course.isPublished 
                        ? "bg-green-500/90 text-white" 
                        : "bg-gray-800/80 text-white"
                    }`}>
                      {course.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 text-lg truncate mb-1">
                    {course.title}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                    {course.description || "No description provided."}
                  </p>
                  <Link 
                    href={`/dashboard/courses/${course._id}`}
                    className="block w-full text-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-sm py-2 rounded border border-gray-200 transition-colors"
                  >
                    Manage Course
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Course Modal */}
      {isModalOpen && (
        <CourseForm
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchCourses();
          }}
        />
      )}
    </div>
  );
}
