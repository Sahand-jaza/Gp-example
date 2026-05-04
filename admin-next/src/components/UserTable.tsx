"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2,
  X,
  Plus,
  Power,
  PowerOff,
  ArrowUpDown,
  Lock,
  Loader2
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@clerk/nextjs";

type SortOption = "newest" | "oldest" | "az" | "za";

export default function UserTable({ endpoint = "/admin/users", dataKey = "users" }: { endpoint?: string; dataKey?: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", email: "", role: "student", password: "" });
  const [editFormData, setEditFormData] = useState({ name: "", email: "", role: "student" });
  const { getToken } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users client-side on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const token = await getToken();
        const res = await api.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setUsers(res.data[dataKey] || res.data.users || []);
        }
      } catch (error: any) {
        console.error("Failed to fetch users:", error);
        setFetchError(
          error.response?.data?.message || 
          error.message || 
          "Failed to load users. Make sure the backend server is running."
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [getToken, endpoint, dataKey]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.password) {
      alert("Error: All fields are required.");
      return;
    }

    if (formData.password.length < 8) {
      alert("Error: Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        alert("Error: Your session has expired. Please refresh the page.");
        return;
      }

      const res = await api.post("/admin/users", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        setUsers([res.data.user, ...users]);
        setIsModalOpen(false);
        setFormData({ name: "", email: "", role: "student", password: "" });
        alert("Success: User account has been created.");
      }
    } catch (error: any) {
      console.error("User creation failed:", error);
      alert(`Error: ${error.response?.data?.message || error.message || "Something went wrong"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const token = await getToken();
      const res = await api.put(`/admin/users/${editingUser.clerkId}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setUsers(users.map(u => u.clerkId === editingUser.clerkId ? res.data.user : u));
        setIsEditModalOpen(false);
        alert("User profile updated successfully.");
      }
    } catch (error: any) {
      alert(`Update failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleToggleStatus = async (clerkId: string, currentStatus: boolean) => {
    try {
      const token = await getToken();
      const res = await api.patch(`/admin/users/${clerkId}/status`, { isActive: !currentStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUsers(users.map(u => u.clerkId === clerkId ? { ...u, isActive: !currentStatus } : u));
      }
    } catch (error) {
      alert("Failed to update user status.");
    }
  };

  const handleDelete = async (clerkId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const token = await getToken();
      const res = await api.delete(`/admin/users/${clerkId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUsers(users.filter(u => u.clerkId !== clerkId));
        alert("User deleted.");
      }
    } catch (error) {
      alert("Delete failed.");
    }
  };

  const filteredUsers = users
    .filter(user => {
      const matchesSearch = (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      if (sortBy === "az") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "za") return (b.name || "").localeCompare(a.name || "");
      return 0;
    });

  return (
    <div className="space-y-4">
      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="mt-3 text-sm font-bold text-slate-500">Loading users...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && fetchError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-sm font-bold text-red-700">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content — only show when loaded without error */}
      {!isLoading && !fetchError && (<>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border-2 border-slate-200 bg-white pl-10 pr-4 py-2 text-sm font-black text-slate-900 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="appearance-none rounded-lg border-2 border-slate-200 bg-white pl-10 pr-8 py-2 text-sm font-black text-slate-900 focus:border-blue-600 focus:outline-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="parent">Parents</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none rounded-lg border-2 border-slate-200 bg-white pl-10 pr-8 py-2 text-sm font-black text-slate-900 focus:border-blue-600 focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="az">A-Z Name</option>
              <option value="za">Z-A Name</option>
            </select>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700 transition-all shadow-md active:scale-95"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Account
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b">
              <tr>
                <th className="px-6 py-5">User Account</th>
                <th className="px-6 py-5">Platform Role</th>
                <th className="px-6 py-5">Connection Key</th>
                <th className="px-6 py-5">Current Status</th>
                <th className="px-6 py-5">Joined Date</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? filteredUsers.map((user: any) => (
                <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-11 w-11 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center font-black text-slate-700 uppercase">
                        {user.name?.[0] || user.email[0]}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-black text-slate-900 leading-tight">{user.name || "Unnamed User"}</div>
                        <div className="text-xs font-bold text-slate-500 mt-0.5">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                      user.role === 'parent' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.connectionCode ? (
                      <span className="inline-flex rounded-lg px-2 py-1 bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-700 font-mono border border-slate-200">
                        {user.connectionCode}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs font-bold italic">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleToggleStatus(user.clerkId, user.isActive !== false)}
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all ${
                        user.isActive !== false 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {user.isActive !== false ? (
                        <>
                          <Power className="mr-1.5 h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <PowerOff className="mr-1.5 h-3 w-3" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button 
                        onClick={() => { 
                          setEditingUser(user); 
                          setEditFormData({ name: user.name || "", email: user.email, role: user.role });
                          setIsEditModalOpen(true); 
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit Profile"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.clerkId)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Search className="h-8 w-8 text-slate-200" />
                      <p className="text-sm font-bold text-slate-500 italic">No users found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Create User Account</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="h-7 w-7" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-6">
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
                  autoCapitalize="none"
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Account Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all cursor-pointer"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full mt-4 rounded-xl py-4 text-sm font-black text-white shadow-xl transition-all ${
                  isSubmitting 
                    ? 'bg-slate-400 cursor-not-allowed shadow-none' 
                    : 'bg-blue-700 shadow-blue-200 hover:bg-blue-800'
                }`}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Edit Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="h-7 w-7" />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="space-y-6">
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
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Account Role</label>
                <select 
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                  className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all cursor-pointer"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                  <option value="admin">Admin</option>
                </select>
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
      </>)}
    </div>
  );
}
