import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-gray-50 h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden overflow-y-auto w-full">
        {children}
      </div>
    </div>
  );
}
