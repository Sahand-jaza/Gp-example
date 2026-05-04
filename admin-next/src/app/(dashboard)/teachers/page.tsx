import { 
  UserCheck, 
  Search, 
  Plus,
  Mail,
  Edit2, 
  Trash2, 
  BookOpen
} from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import api from "@/lib/api";

export default async function TeachersPage() {
  const { getToken } = await auth();
  const token = await getToken();

  let teachers = [];
  try {
    const res = await api.get("/admin/teachers", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data.success) {
      teachers = res.data.teachers;
    }
  } catch (error) {
    console.error("Failed to fetch teachers:", error);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Teachers Directory</h1>
        </div>
        <button className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
          <Plus className="mr-2 h-4 w-4" />
          Add Teacher
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {teachers.length > 0 ? teachers.map((teacher: any) => (
          <div key={teacher._id} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 hover:ring-blue-500 transition-all group">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 text-slate-400 hover:text-blue-600">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="p-1 text-slate-400 hover:text-red-600">
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
                  ID: {teacher.clerkId.substring(0, 8)}...
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-green-500 font-bold text-xs uppercase tracking-widest">Active</span>
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
    </div>
  );
}
