'use client';
import { useAuth, useUser, UserButton } from "@clerk/nextjs";
import TeacherDashboard from "../components/dashboard/TeacherDashboard";

export default function Home() {
  const { isLoaded, orgRole } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Ensure only users explicitly marked as "teacher" in their Clerk publicMetadata can access this app
  const isTeacher = user?.publicMetadata?.role === 'teacher';

  if (user && isTeacher) {
    return <TeacherDashboard />;
  }

  // Fallback for non-logged-in users, OR logged-in users who are NOT teachers
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 relative">
      <div className="absolute top-4 right-4">
        <UserButton afterSignOutUrl="/" />
      </div>
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          {user
            ? "Your account does not have Teacher privileges. Please sign out and log in with a valid Teacher account."
            : "Please sign in to access the Teacher portal."}
        </p>
      </div>
    </div>
  );
}
