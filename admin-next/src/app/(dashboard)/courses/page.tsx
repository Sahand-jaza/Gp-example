import { auth } from "@clerk/nextjs/server";
import api from "@/lib/api";
import CourseList from "@/components/CourseList";

export default async function CoursesPage() {
  const { getToken } = await auth();
  const token = await getToken();

  let initialCourses = [];
  try {
    const res = await api.get("/admin/courses", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data.success) {
      initialCourses = res.data.courses;
    }
  } catch (error) {
    console.error("Failed to fetch courses:", error);
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Courses</h1>
      </div>
      <CourseList initialCourses={initialCourses} />
    </>
  );
}
