import { auth } from "@clerk/nextjs/server";
import api from "@/lib/api";
import ParentDirectoryClient from "@/components/ParentDirectoryClient";

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

  return <ParentDirectoryClient initialParents={parents} />;
}
