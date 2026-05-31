import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  Cloud
} from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import api from "@/lib/api";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const { getToken } = await auth();
  const token = await getToken();

  let initialSettings = null;
  try {
    const res = await api.get("/admin/settings", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data.success) {
      initialSettings = res.data.settings;
    }
  } catch (error) {
    console.error("Failed to fetch settings:", error);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">System Settings</h2>
        <p className="text-slate-500">Configure global application parameters and security policies.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Navigation */}
        <div className="md:col-span-1 space-y-2">
          {[
            { name: "General", icon: Settings, active: true },
            { name: "Security", icon: Shield, active: false },
            { name: "Notifications", icon: Bell, active: false },
            { name: "Data & Storage", icon: Database, active: false },
            { name: "API & Integration", icon: Cloud, active: false },
          ].map((item) => (
            <button
              key={item.name}
              className={`flex w-full items-center px-4 py-3 text-sm font-bold rounded-lg transition-colors ${
                item.active 
                  ? "bg-white shadow-sm ring-1 ring-slate-200 text-blue-600" 
                  : "text-slate-500 hover:bg-slate-200"
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </button>
          ))}
        </div>

        {/* Form */}
        <SettingsForm initialSettings={initialSettings} />
      </div>
    </div>
  );
}
