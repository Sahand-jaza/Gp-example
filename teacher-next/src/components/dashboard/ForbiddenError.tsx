"use client";
import { UserButton } from "@clerk/nextjs";
import { useState } from "react";

export default function ForbiddenError() {
  const [upgrading, setUpgrading] = useState(false);

  const forceUpgrade = async () => {
    setUpgrading(true);
    try {
      await fetch('/api/auth/teacher-setup');
      window.location.reload();
    } catch (err) {
      console.error(err);
      setUpgrading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center">
      <div className="bg-red-50 p-6 rounded-2xl max-w-md w-full border border-red-100 shadow-sm mt-20">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🛑</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">
          You are not allowed to access this section of the teacher platform. Your account may not have the required permissions.
        </p>
        <div className="flex justify-center border-t border-red-200 pt-6">
          <UserButton afterSignOutUrl="/" showName />
        </div>
        <p className="text-sm text-red-500 mt-4 mb-4">
          Please sign out and sign in with a Teacher account.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <button 
            onClick={forceUpgrade}
            disabled={upgrading}
            className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            {upgrading ? "Upgrading..." : "🛠️ Dev Mode: Force Upgrade to Teacher"}
          </button>
        )}
      </div>
    </div>
  );
}
