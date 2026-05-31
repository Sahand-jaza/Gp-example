import Sidebar from "@/components/dashboard/Sidebar";
import { auth, clerkClient } from "@clerk/nextjs/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex bg-gray-50 h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden overflow-y-auto w-full">
        {children}
      </div>
    </div>
  );
}
