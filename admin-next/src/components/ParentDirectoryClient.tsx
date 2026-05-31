"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  UserPlus,
  Mail,
  Edit2, 
  Trash2, 
  Users,
  X,
  Lock
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";

export default function ParentDirectoryClient({ initialParents }: { initialParents: any[] }) {
  const [parents, setParents] = useState(initialParents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<any>(null);
  
  const [formData, setFormData] = useState({ name: "", email: "", role: "parent", password: "" });
  const [editFormData, setEditFormData] = useState({ name: "", email: "", role: "parent" });
  
  const { getToken } = useAuth();

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const res = await api.post("/admin/users", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setParents([res.data.user, ...parents]);
        setIsModalOpen(false);
        setFormData({ name: "", email: "", role: "parent", password: "" });
        alert("Success: Parent account has been created.");
      }
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleEditParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParent) return;
    try {
      const token = await getToken();
      const res = await api.put(`/admin/users/${editingParent.clerkId}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setParents(parents.map(p => p.clerkId === editingParent.clerkId ? res.data.user : p));
        setIsEditModalOpen(false);
        alert("Parent profile updated successfully.");
      }
    } catch (error: any) {
      alert(`Update failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (clerkId: string) => {
    if (!confirm("Are you sure you want to delete this parent?")) return;
    try {
      const token = await getToken();
      const res = await api.delete(`/admin/users/${clerkId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setParents(parents.filter(p => p.clerkId !== clerkId));
        alert("Parent deleted.");
      }
    } catch (error) {
      alert("Delete failed.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Parent Database</h1>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-all"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Parent
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="divide-y divide-slate-200">
          {parents.length > 0 ? parents.map((parent: any) => (
            <div key={parent._id || parent.clerkId} className="p-6 hover:bg-slate-50 transition-colors group">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{parent.name || "Unknown"}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${parent.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {parent.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="flex items-center">
                        <Mail className="mr-1.5 h-4 w-4" />
                        {parent.email}
                      </span>
                      <span className="flex items-center text-slate-400">
                        ID: {parent.clerkId ? parent.clerkId.substring(0, 8) + '...' : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity mr-4">
                    <button 
                      onClick={() => {
                        setEditingParent(parent);
                        setEditFormData({ name: parent.name || "", email: parent.email, role: "parent" });
                        setIsEditModalOpen(true);
                      }}
                      className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Edit Parent"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(parent.clerkId)}
                      className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete Parent"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="bg-slate-100 rounded-lg px-4 py-2 hidden sm:block">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-400" />
                      <p className="text-sm font-medium text-slate-700 uppercase">
                        Account Active
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="py-20 text-center italic text-slate-500">
              No parent accounts found.
            </div>
          )}
        </div>
      </div>

      {/* Add Parent Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Create Parent Account</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="h-7 w-7" />
              </button>
            </div>
            <form onSubmit={handleAddParent} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
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
                  placeholder="john@example.com"
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

      {/* Edit Parent Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Edit Parent Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="h-7 w-7" />
              </button>
            </div>
            <form onSubmit={handleEditParent} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
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
                  placeholder="john@example.com"
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
