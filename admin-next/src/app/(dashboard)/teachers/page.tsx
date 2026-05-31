import { auth } from "@clerk/nextjs/server";
import api from "@/lib/api";
import TeacherDirectoryClient from "@/components/TeacherDirectoryClient";

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

  return <TeacherDirectoryClient initialTeachers={teachers} />;
}
