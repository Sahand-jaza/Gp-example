import { auth } from "@clerk/nextjs/server";
import api from "@/lib/api";
import UserTable from "@/components/UserTable";

export default async function TeachersPage() {
  const { getToken } = await auth();
  const token = await getToken();

  let initialUsers = [];
  try {
    const res = await api.get("/admin/teachers", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data.success) {
      initialUsers = res.data.teachers;
    }
  } catch (error) {
    console.error("Failed to fetch teachers:", error);
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Teachers Directory</h1>
      </div>

      <UserTable initialUsers={initialUsers} />
    </div>
  );
}
