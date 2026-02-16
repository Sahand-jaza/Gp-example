'use client';

import { useUser, useOrganization } from "@clerk/nextjs";

export default function TeacherDashboard() {
  const { user } = useUser();
  const { organization } = useOrganization();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Portal</h1>
            <p className="text-sm text-gray-500">
              Welcome, {user?.firstName}
            </p>
          </div>
           <div className="text-right">
             <p className="text-sm font-medium text-gray-900">{organization?.name}</p>
             <p className="text-xs text-gray-500">Organization</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Stats / Overview */}
          <div className="col-span-1 md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
               <p className="text-gray-500 text-sm font-medium">Total Classes</p>
               <p className="text-3xl font-bold text-blue-600">0</p>
             </div>
             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
               <p className="text-gray-500 text-sm font-medium">Total Students</p>
               <p className="text-3xl font-bold text-green-600">0</p>
             </div>
             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
               <p className="text-gray-500 text-sm font-medium">Pending Assignments</p>
               <p className="text-3xl font-bold text-amber-600">0</p>
             </div>
          </div>

          {/* Recent Activity */}
          <div className="col-span-1 md:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="text-gray-500 text-sm italic">
              No recent activity to display.
            </div>
          </div>

          {/* Quick Actions */}
          <div className="col-span-1 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              <button className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-md text-sm font-medium transition-colors text-left">
                + Create New Class
              </button>
              <button className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-md text-sm font-medium transition-colors text-left">
                + Add Assignment
              </button>
              <button className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-md text-sm font-medium transition-colors text-left">
                View Reports
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
