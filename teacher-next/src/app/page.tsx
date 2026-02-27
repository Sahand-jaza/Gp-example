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

  // Assuming we still want to keep the dashboard for now; we'll remove orgRole check next.
  if (user) {
    return <TeacherDashboard />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="absolute top-4 right-4">
        <UserButton />
      </div>
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Teacher portal</h1>
        <p className="text-gray-600 mb-6">
          Please sign in to access this dashboard.
        </p>
      </div>
    </div>
  );
}
