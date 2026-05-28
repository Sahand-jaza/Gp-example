"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Plus, 
  MoreVertical,
  Layers,
  GraduationCap,
  X,
  Trash2,
  Star
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@clerk/nextjs";

export default function CourseList({ initialCourses }: { initialCourses: any[] }) {
  const [courses, setCourses] = useState(initialCourses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", category: "General" });
  const { getToken } = useAuth();

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const res = await api.post("/admin/courses", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCourses([res.data.course, ...courses]);
        setIsModalOpen(false);
        setFormData({ title: "", category: "General" });
        alert("Course created successfully.");
      }
    } catch (error) {
      console.error("Create failed:", error);
      alert("Failed to create course.");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This will remove all videos and cannot be undone.")) return;
    
    try {
      const token = await getToken();
      const res = await api.delete(`/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCourses(courses.filter((c: any) => c._id !== courseId));
        alert("Course deleted successfully.");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete course.");
    }
  };

  const handleToggleFeatured = async (courseId: string, currentFeatured: boolean) => {
    try {
      const token = await getToken();
      const res = await api.patch(`/admin/courses/${courseId}`, {
        isFeatured: !currentFeatured
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCourses(courses.map((c: any) => 
          c._id === courseId ? { ...c, isFeatured: !currentFeatured } : c
        ));
      }
    } catch (error) {
      console.error("Toggle featured failed:", error);
      alert("Failed to toggle featured status.");
    }
  };

  const handleTogglePublished = async (courseId: string, currentPublished: boolean) => {
    try {
      const token = await getToken();
      const res = await api.patch(`/admin/courses/${courseId}`, {
        isPublished: !currentPublished
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCourses(courses.map((c: any) => 
          c._id === courseId ? { ...c, isPublished: !currentPublished } : c
        ));
      }
    } catch (error) {
      console.error("Toggle published failed:", error);
      alert("Failed to toggle publication status.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Course Catalog</h2>
          <p className="text-slate-500">Monitor all active courses, enrollments, and teaching progress.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Course
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {courses.length > 0 ? courses.map((course: any) => (
          <div key={course._id} className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col sm:flex-row">
            <div className="w-full sm:w-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
              {course.thumbnailUrl ? (
                <img 
                  src={course.thumbnailUrl} 
                  alt={course.title} 
                  className="absolute inset-0 h-full w-full object-cover transition-transform hover:scale-110 duration-500"
                />
              ) : (
                <BookOpen className="h-16 w-16 text-slate-400" />
              )}
            </div>
            <div className="flex-1 p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{course.category || "General"}</span>
                    {course.isFeatured && (
                      <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-yellow-700 tracking-wider flex items-center gap-0.5 ring-1 ring-yellow-600/20">
                        <Star className="h-2.5 w-2.5 fill-yellow-600 text-yellow-600" />
                        Featured
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{course.title}</h3>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  {/* Star Toggle */}
                  <button 
                    onClick={() => handleToggleFeatured(course._id, !!course.isFeatured)}
                    title={course.isFeatured ? "Remove from Featured" : "Mark as Featured"}
                    className={`rounded-lg p-2 transition-all border ${
                      course.isFeatured 
                        ? "bg-yellow-50 border-yellow-200 text-yellow-500 hover:bg-yellow-100" 
                        : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-yellow-500"
                    }`}
                  >
                    <Star className={`h-4 w-4 ${course.isFeatured ? "fill-yellow-500" : ""}`} />
                  </button>

                  {/* Delete Button */}
                  <button 
                    onClick={() => handleDeleteCourse(course._id)}
                    title="Delete Course"
                    className="rounded-lg border border-slate-200 bg-white p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 mt-4 mb-5 border-t border-b border-slate-50 py-3">
                <div className="flex items-center text-xs font-extrabold text-slate-800">
                  <GraduationCap className="mr-1.5 h-4 w-4 text-blue-600 shrink-0" />
                  <span>Instructor: {course.teacherName || "Unknown Teacher"}</span>
                </div>
                {course.teacherEmail && (
                  <div className="text-[11px] font-medium text-slate-500 pl-5.5 select-all leading-none truncate max-w-[280px]">
                    {course.teacherEmail}
                  </div>
                )}
                <div className="flex items-center text-xs font-bold text-slate-500 pl-5.5 mt-1">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono">Course Ref: {course._id.substring(0, 6).toUpperCase()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm items-center">
                  <span className="font-semibold text-slate-500 text-xs uppercase tracking-wider">Course Status</span>
                  <button
                    onClick={() => handleTogglePublished(course._id, !!course.isPublished)}
                    title={course.isPublished ? "Set to Draft (Unpublish)" : "Publish Course"}
                    className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.05] active:scale-[0.95] cursor-pointer ${
                      course.isPublished 
                        ? "bg-green-50 text-green-700 ring-1 ring-green-600/20 hover:bg-green-100" 
                        : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 hover:bg-amber-100"
                    }`}
                  >
                    {course.isPublished ? "Published" : "Draft"}
                  </button>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-1.5 rounded-full transition-all duration-500 ${
                    course.isPublished ? "bg-green-500" : "bg-amber-500"
                  }`} style={{ width: "100%" }}></div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="text-sm">
                  <span className="text-slate-500">Created: </span>
                  <span className="font-bold text-slate-900">{new Date(course.createdAt).toLocaleDateString()}</span>
                </div>
                <Link 
                  href={`/courses/${course._id}`}
                  className="text-sm font-bold text-blue-600 hover:text-blue-500"
                >
                  View Full Details
                </Link>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center bg-white rounded-xl ring-1 ring-slate-200 italic text-slate-500">
            No courses found in the system.
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-2xl animate-in fade-in zoom-in duration-200 ring-1 ring-slate-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-extrabold text-slate-900">Create New Course</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X className="h-7 w-7" />
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-700">Course Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Advanced Mathematics"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-700">Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="Arts">Arts</option>
                  <option value="History">History</option>
                  <option value="General">General</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="w-full mt-6 rounded-xl bg-blue-700 py-4 text-sm font-black text-white shadow-xl shadow-blue-200 hover:bg-blue-800 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Launch Course
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
