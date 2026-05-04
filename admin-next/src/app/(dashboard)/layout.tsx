import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="flex-shrink-0 w-64 border-r bg-slate-900 shadow-xl overflow-y-auto">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="mx-auto max-w-7xl pb-20">
          {children}
        </div>
      </main>
    </div>
  );
}
