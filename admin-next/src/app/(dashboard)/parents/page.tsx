import { 
  ShieldCheck, 
  UserPlus,
  Users,
  Mail,
  ArrowRight
} from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import api from "@/lib/api";

export default async function ParentsPage() {
  const { getToken } = await auth();
  const token = await getToken();

  let parents = [];
  try {
    const res = await api.get("/admin/parents", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data.success) {
      parents = res.data.parents;
    }
  } catch (error) {
    console.error("Failed to fetch parents:", error);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Parent Database</h1>
      </div>
        <button className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
          <UserPlus className="mr-2 h-4 w-4" />
          Connect Parent
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="divide-y divide-slate-200">
          {parents.length > 0 ? parents.map((parent: any) => (
            <div key={parent._id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{parent.name || "Unknown"}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                        verified
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="flex items-center">
                        <Mail className="mr-1.5 h-4 w-4" />
                        {parent.email}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="bg-slate-100 rounded-lg px-4 py-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-400" />
                      <p className="text-sm font-medium text-slate-700 uppercase">
                        Account Active
                      </p>
                    </div>
                  </div>
                  <button className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-500">
                    Manage Access
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </button>
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
    </div>
  );
}
