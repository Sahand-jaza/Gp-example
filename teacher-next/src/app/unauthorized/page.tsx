import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You do not have permission to access the Teacher Portal. This portal is restricted to teachers only.
        </p>
        <div className="flex justify-center mb-6">
          <UserButton afterSignOutUrl="/" />
        </div>
        <p className="text-sm text-gray-500">
          Sign out to switch accounts.
        </p>
      </div>
    </div>
  );
}
