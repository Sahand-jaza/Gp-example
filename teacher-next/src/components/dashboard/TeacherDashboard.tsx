'use client';

import { useUser, UserButton } from "@clerk/nextjs";
import { useApi } from "../../../lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Course } from "@/types";
import { BookOpen, Video as VideoIcon, Plus } from "lucide-react";
import ForbiddenError from "./ForbiddenError";

export default function TeacherDashboard() {
  const { user } = useUser();
  const api = useApi();
  const router = useRouter();
  const [testResult, setTestResult] = useState<string>("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get("/api/courses/my-courses");
        setCourses(res.data);
      } catch (error: any) {
        if (error.response?.status === 403 || error.response?.status === 401) {
          setIsForbidden(true);
        }
        console.error("Failed to fetch courses overview", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, [api]);

  const handleTestApi = async () => {
    try {
      setTestResult("Loading...");
      // Hitting the test teacher endpoint we discovered in index.ts earlier
      const res = await api.get("/api/test/teacher");
      setTestResult(`Success: ${JSON.stringify(res.data)}`);
    } catch (error: any) {
      if (error.response?.status === 403) {
        setTestResult(`Error: 403 Forbidden - Access Denied`);
        return;
      }
      if (error instanceof Error) {
        setTestResult(`Error: ${error.message}`);
      } else {
        setTestResult(`Error: An unknown error occurred`);
      }
    }
  };

  if (isForbidden) {
    return <ForbiddenError />;
  }

  return (
    <div className="flex flex-col flex-1 h-full w-full">
      {/* Header Inside Page */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
          <p className="text-sm text-gray-500">
            Welcome, {user?.firstName}
          </p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Stats / Overview */}
          <div className="col-span-1 md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-lg">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Courses</p>
                <p className="text-3xl font-bold text-gray-900">{isLoading ? "-" : courses.length}</p>
              </div>
            </div>
            {/* Currently, we only have courses implemented. More stats can go here as features are added to API. */}
          </div>

          {/* Recent Activity */}
          <div className="col-span-1 md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Recent Courses</h2>
            {isLoading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : courses.length === 0 ? (
              <div className="text-gray-500 text-sm italic py-4">
                No courses created yet.
              </div>
            ) : (
              <ul className="space-y-3">
                {courses.slice(0, 5).map((course) => (
                  <li key={course._id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{course.title}</p>
                      <p className="text-xs text-gray-400 mt-1 truncate max-w-xs">{course.description || "No description"}</p>
                    </div>
                    <button 
                      onClick={() => router.push(`/dashboard/courses/${course._id}`)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    >
                      Manage
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick Actions */}
          <div className="col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => router.push('/dashboard/courses')}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-transparent shadow-sm"
              >
                <Plus className="w-4 h-4" /> Go to Courses
              </button>
              
              <button
                onClick={handleTestApi}
                className="w-full bg-green-50 text-green-700 hover:bg-green-100 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-center mt-4 border border-green-200 shadow-sm">
                🚀 Test API Connection
              </button>
              {testResult && (
                <div className="mt-2 p-3 bg-gray-50 text-xs text-gray-800 rounded-lg border border-gray-200 break-all whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {testResult}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
