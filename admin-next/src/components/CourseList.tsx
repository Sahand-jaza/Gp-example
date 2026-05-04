"use client";

import { useState, useMemo, useRef } from "react";
import { 
  BookOpen, 
  Plus, 
  Trash2,
  Layers,
  GraduationCap,
  X,
  Calendar,
  Search,
  Filter,
  Info,
  Users,
  SortAsc,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  Loader2,
  Edit3,
  AlertTriangle
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@clerk/nextjs";

export default function CourseList({ initialCourses }: { initialCourses: any[] }) {
  const [courses, setCourses] = useState(initialCourses);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({ 
    title: "", 
    category: "General", 
    description: "", 
    thumbnailUrl: "" 
  });
  
  const { getToken } = useAuth();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const token = await getToken();
      const uploadData = new FormData();
      uploadData.append("image", file);

      const res = await api.post("/admin/upload", uploadData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      if (res.data.success) {
        setFormData({ ...formData, thumbnailUrl: res.data.imageUrl });
      }
    } catch (error) {
      alert("Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingCourseId(null);
    setFormData({ title: "", category: "General", description: "", thumbnailUrl: "" });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course: any) => {
    setEditingCourseId(course._id);
    setFormData({ 
      title: course.title, 
      category: course.category || "General", 
      description: course.description || "", 
      thumbnailUrl: course.thumbnailUrl || course.thumbnail || "" 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      if (editingCourseId) {
        // Update
        const res = await api.put(`/admin/courses/${editingCourseId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setCourses(courses.map(c => c._id === editingCourseId ? res.data.course : c));
          setIsModalOpen(false);
          alert("Course updated successfully.");
        }
      } else {
        // Create
        const res = await api.post("/admin/courses", formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setCourses([res.data.course, ...courses]);
          setIsModalOpen(false);
          alert("Course launched successfully.");
        }
      }
    } catch (error) {
      alert(editingCourseId ? "Failed to update course." : "Failed to create course.");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const token = await getToken();
      const res = await api.delete(`/admin/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setCourses(prev => prev.filter(c => c._id !== courseId));
        setSelectedCourse(null);
      }
    } catch (err: any) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
    return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const filteredAndSortedCourses = useMemo(() => {
    let result = courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (course.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const courseCategory = (course.category || "General").trim().toLowerCase();
      const filterValue = categoryFilter.trim().toLowerCase();
      
      const matchesCategory = filterValue === "all" || courseCategory === filterValue;
      return matchesSearch && matchesCategory;
    });

    result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "a-z") return a.title.localeCompare(b.title);
      if (sortBy === "z-a") return b.title.localeCompare(a.title);
      return 0;
    });

    return result;
  }, [courses, searchTerm, categoryFilter, sortBy]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Course Management</h1>
        </div>
        <button 
          onClick={handleOpenCreateModal}
          className="flex items-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 w-fit"
        >
          <Plus className="mr-2 h-5 w-5" />
          Create New Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative col-span-1 md:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search catalog..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border-2 border-slate-200 bg-white pl-10 pr-4 py-2 text-sm font-black text-slate-900 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none transition-all"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full appearance-none rounded-xl border-2 border-slate-200 bg-white pl-10 pr-8 py-2 text-sm font-black text-slate-900 focus:border-blue-600 focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="Arts">Arts</option>
            <option value="History">History</option>
            <option value="Engineering">Engineering</option>
            <option value="General">General</option>
          </select>
        </div>

        <div className="relative">
          <SortAsc className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full appearance-none rounded-xl border-2 border-slate-200 bg-white pl-10 pr-8 py-2 text-sm font-black text-slate-900 focus:border-blue-600 focus:outline-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="a-z">Alphabetical (A-Z)</option>
            <option value="z-a">Alphabetical (Z-A)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {filteredAndSortedCourses.length > 0 ? filteredAndSortedCourses.map((course: any) => (
          <div key={course._id} className="group bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col md:flex-row hover:ring-blue-600 transition-all">
            <div className="w-full md:w-64 bg-slate-50 relative overflow-hidden flex-shrink-0">
              {(course.thumbnailUrl || course.thumbnail) ? (
                <img 
                  src={getImageUrl(course.thumbnailUrl || course.thumbnail) || ""} 
                  alt={course.title} 
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center p-8 bg-slate-100">
                  <ImageIcon className="h-16 w-16 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
              )}
              <div className="absolute top-4 left-4">
                <span className="inline-block rounded-lg bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] font-black text-blue-700 shadow-sm uppercase tracking-widest">
                  {course.category || "General"}
                </span>
              </div>
            </div>
            <div className="flex-1 p-8 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-700 transition-colors">
                  {course.title}
                </h3>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={(e) => handleOpenEditModal(course)}
                    className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all flex-shrink-0"
                    title="Edit Course"
                  >
                    <Edit3 className="h-5 w-5" />
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setConfirmDeleteId(course._id);
                    }}
                    className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                    title="Delete Course"
                  >
                    <Trash2 className="h-5 w-5 pointer-events-none" />
                  </button>
                </div>
              </div>
              
              <p className="text-sm font-bold text-slate-500 line-clamp-2 mb-6">
                {course.description || "No description provided for this course."}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-auto">
                <div className="flex items-center text-xs font-black text-slate-400 uppercase tracking-widest">
                  <GraduationCap className="mr-2 h-4 w-4 text-slate-300" />
                  ID: {course.teacherId?.substring(0, 8)}...
                </div>
                <div className="flex items-center text-xs font-black text-slate-400 uppercase tracking-widest">
                  <Users className="mr-2 h-4 w-4 text-slate-300" />
                  {course.studentCount || 0} Students
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-6">
                <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Calendar className="mr-2 h-4 w-4 text-slate-300" />
                  {new Date(course.createdAt).toLocaleDateString()}
                </div>
                <button 
                  onClick={() => setSelectedCourse(course)}
                  className="flex items-center text-sm font-black text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Info className="mr-1.5 h-4 w-4" />
                  Details
                  <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-32 text-center bg-white rounded-2xl ring-1 ring-slate-200">
            <BookOpen className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-lg font-bold text-slate-400 italic">No courses found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="relative h-64 bg-slate-900">
              {(selectedCourse.thumbnailUrl || selectedCourse.thumbnail) ? (
                <img 
                  src={getImageUrl(selectedCourse.thumbnailUrl || selectedCourse.thumbnail) || ""} 
                  alt={selectedCourse.title} 
                  className="h-full w-full object-cover opacity-60"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <BookOpen className="h-20 w-20 text-slate-700" />
                </div>
              )}
              <button 
                onClick={() => setSelectedCourse(null)}
                className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="absolute bottom-8 left-8">
                <span className="inline-block rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black text-white uppercase tracking-widest mb-3">
                  {selectedCourse.category || "General"}
                </span>
                <h2 className="text-4xl font-black text-white tracking-tight leading-none">{selectedCourse.title}</h2>
              </div>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center border-b border-slate-100 pb-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrolled Students</p>
                  <p className="text-sm font-black text-slate-900">{selectedCourse.studentCount || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instructor ID</p>
                  <p className="text-sm font-black text-slate-900">{selectedCourse.teacherId?.substring(0, 8)}...</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Creation Date</p>
                  <p className="text-sm font-black text-slate-900">{new Date(selectedCourse.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Course ID</p>
                  <p className="text-sm font-black text-slate-900">#{selectedCourse._id.substring(18)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center">
                  <Info className="mr-2 h-4 w-4 text-blue-600" />
                  Course Description
                </h4>
                <p className="text-slate-600 font-bold leading-relaxed">
                  {selectedCourse.description || "This course currently has no detailed description provided."}
                </p>
              </div>

              <div className="pt-6 flex gap-4">
                <button 
                  onClick={() => {
                    setSelectedCourse(null);
                    handleOpenEditModal(selectedCourse);
                  }}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-800 transition-all flex items-center justify-center"
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit Course
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setConfirmDeleteId(selectedCourse._id);
                  }}
                  className="px-6 py-4 bg-red-50 text-red-600 rounded-xl font-black text-sm hover:bg-red-100 transition-all flex items-center justify-center group"
                >
                  <Trash2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span className="ml-2">Delete Course</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-12 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                {editingCourseId ? "Edit Course" : "Launch New Course"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="h-8 w-8" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Course Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Advanced Quantum Mechanics"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Course Thumbnail</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group cursor-pointer"
                >
                  <div className="w-full h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center group-hover:border-blue-500 group-hover:bg-blue-50 transition-all overflow-hidden">
                    {formData.thumbnailUrl ? (
                      <img 
                        src={getImageUrl(formData.thumbnailUrl) || ""} 
                        className="w-full h-full object-cover"
                        alt="Preview"
                      />
                    ) : (
                      <>
                        {isUploading ? (
                          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-slate-300 mb-2 group-hover:text-blue-500" />
                            <p className="text-xs font-black text-slate-400 group-hover:text-blue-600 uppercase tracking-widest">Upload Image</p>
                          </>
                        )}
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden" 
                    accept="image/*"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subject Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="Arts">Arts</option>
                  <option value="History">History</option>
                  <option value="Engineering">Engineering</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</label>
                <textarea 
                  rows={2}
                  placeholder="Brief summary..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>
              <button 
                type="submit" 
                disabled={isUploading}
                className="w-full mt-6 rounded-2xl bg-blue-700 py-5 text-sm font-black text-white shadow-2xl shadow-blue-200 hover:bg-blue-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingCourseId ? "Save Changes" : "Launch Course"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirm Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-full">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Delete Course</h3>
            </div>
            <p className="text-sm text-slate-500 font-medium mb-8">
              Are you sure you want to delete this course? All content, enrollments, and progress will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => handleDeleteCourse(confirmDeleteId)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-md shadow-red-200"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
