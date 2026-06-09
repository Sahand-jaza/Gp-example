'use client';
import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Home() {
  const { isLoaded } = useAuth();
  const { user } = useUser();

  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) {
      router.push("/dashboard");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is loaded and logged in, we are redirecting, so show a loading state
  if (user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Fallback for non-logged-in users
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 relative">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Teacher portal</h1>
        <p className="text-gray-600 mb-6">
          Please sign in to access the Teacher portal.
        </p>
      </div>
    </div>
  );
}
