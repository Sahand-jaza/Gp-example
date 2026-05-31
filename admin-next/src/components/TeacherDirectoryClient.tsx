"use client";

import { useState } from "react";
import { 
  UserCheck, 
  Plus,
  Mail,
  Edit2, 
  Trash2, 
  BookOpen,
  X,
  Lock
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";

export default function TeacherDirectoryClient({ initialTeachers }: { initialTeachers: any[] }) {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  
  const [formData, setFormData] = useState({ name: "", email: "", role: "teacher", password: "" });
  const [editFormData, setEditFormData] = useState({ name: "", email: "", role: "teacher" });
  
  const { getToken } = useAuth();

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const res = await api.post("/admin/users", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setTeachers([res.data.user, ...teachers]);
        setIsModalOpen(false);
        setFormData({ name: "", email: "", role: "teacher", password: "" });
        alert("Success: Teacher account has been created.");
      }
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    try {
      const token = await getToken();
      const res = await api.put(`/admin/users/${editingTeacher.clerkId}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setTeachers(teachers.map(t => t.clerkId === editingTeacher.clerkId ? res.data.user : t));
        setIsEditModalOpen(false);
        alert("Teacher profile updated successfully.");
      }
    } catch (error: any) {
      alert(`Update failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (clerkId: string) => {
    if (!confirm("Are you sure you want to delete this teacher?")) return;
    try {
      const token = await getToken();
      const res = await api.delete(`/admin/users/${clerkId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setTeachers(teachers.filter(t => t.clerkId !== clerkId));
        alert("Teacher deleted.");
      }
    } catch (error) {
      alert("Delete failed.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Teachers Directory</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Teacher
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {teachers.length > 0 ? teachers.map((teacher: any) => (
          <div key={teacher._id || teacher.clerkId} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 hover:ring-blue-500 transition-all group">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setEditingTeacher(teacher);
                      setEditFormData({ name: teacher.name || "", email: teacher.email, role: "teacher" });
                      setIsEditModalOpen(true);
                    }}
                    className="p-1 text-slate-400 hover:text-blue-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(teacher.clerkId)}
                    className="p-1 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 truncate">{teacher.name || "Unknown"}</h3>
              <p className="text-sm font-medium text-blue-600 mb-4">Instructor</p>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-slate-500 truncate">
                  <Mail className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{teacher.email}</span>
                </div>
                <div className="flex items-center text-sm text-slate-500">
                  <BookOpen className="mr-2 h-4 w-4" />
                  ID: {teacher.clerkId ? teacher.clerkId.substring(0, 8) + '...' : 'N/A'}
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className={`font-bold text-xs uppercase tracking-widest ${teacher.isActive !== false ? 'text-green-500' : 'text-red-500'}`}>
                  {teacher.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
              <button className="text-sm font-semibold text-blue-600 hover:text-blue-500">
                View Profile
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center bg-white rounded-xl ring-1 ring-slate-200 italic text-slate-500">
            No teachers found in the system.
          </div>
        )}
      </div>

      {/* Add Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Create Teacher Account</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="h-7 w-7" />
              </button>
            </div>
            <form onSubmit={handleAddTeacher} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="Jane Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="jane@school.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Initial Password</label>
                  <Lock className="h-3 w-3 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  required
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>
              <button 
                type="submit" 
                className="w-full mt-4 rounded-xl bg-blue-700 py-4 text-sm font-black text-white shadow-xl shadow-blue-200 hover:bg-blue-800 transition-all"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Edit Teacher Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="h-7 w-7" />
              </button>
            </div>
            <form onSubmit={handleEditTeacher} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="Jane Doe"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="jane@school.edu"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>
              <button 
                type="submit" 
                className="w-full mt-4 rounded-xl bg-slate-900 py-4 text-sm font-black text-white hover:bg-slate-800 transition-all shadow-xl"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
