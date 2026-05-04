"use client";

import { useState } from "react";
import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  Cloud, 
  Globe,
  Save,
  Lock,
  Mail,
  Zap,
  HardDrive,
  Activity,
  Trash2,
  RefreshCcw,
  CheckCircle2
} from "lucide-react";

type Tab = "General" | "Security" | "Notifications" | "Data & Storage" | "API & Integration";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("General");
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1000);
  };

  const tabs = [
    { name: "General", icon: Settings },
    { name: "Security", icon: Shield },
    { name: "Notifications", icon: Bell },
    { name: "Data & Storage", icon: Database },
    { name: "API & Integration", icon: Cloud },
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">System Settings</h2>
          <p className="text-slate-500 font-bold">Configure global application parameters and infrastructure.</p>
        </div>
        {showToast && (
          <div className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-black text-white shadow-xl animate-in fade-in slide-in-from-right-4 duration-300">
            <CheckCircle2 className="h-4 w-4" />
            Settings Synchronized
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name as Tab)}
              className={`flex w-full items-center px-6 py-4 text-sm font-black rounded-xl transition-all ${
                activeTab === item.name 
                  ? "bg-white shadow-xl ring-1 ring-slate-200 text-blue-600 scale-[1.02]" 
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <item.icon className={`mr-4 h-5 w-5 ${activeTab === item.name ? "text-blue-600" : "text-slate-400"}`} />
              {item.name}
            </button>
          ))}
        </div>

        {/* Dynamic Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 ring-1 ring-slate-200 overflow-hidden">
            <div className="p-10">
              {activeTab === "General" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-blue-50 rounded-2xl">
                      <Globe className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Platform Configuration</h3>
                      <p className="text-sm font-bold text-slate-400">Public-facing brand settings.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Platform Name</label>
                      <input 
                        type="text" 
                        defaultValue="Admin portal test"
                        className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Support Email</label>
                      <input 
                        type="email" 
                        defaultValue="admin@test.com"
                        className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-3 sm:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Timezone</label>
                      <select className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none transition-all appearance-none cursor-pointer">
                        <option>UTC (Coordinated Universal Time)</option>
                        <option>EST (Eastern Standard Time)</option>
                        <option>CET (Central European Time)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "Security" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-red-50 rounded-2xl">
                      <Lock className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Security & Authentication</h3>
                      <p className="text-sm font-bold text-slate-400">Manage user access and protocol policies.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border-2 border-slate-100">
                      <div>
                        <p className="font-black text-slate-900">Two-Factor Authentication</p>
                        <p className="text-sm font-bold text-slate-500">Enforce MFA for all administrative accounts.</p>
                      </div>
                      <div className="h-6 w-11 bg-blue-600 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border-2 border-slate-100">
                      <div>
                        <p className="font-black text-slate-900">Auto-Session Timeout</p>
                        <p className="text-sm font-bold text-slate-500">Log out inactive users after 30 minutes.</p>
                      </div>
                      <div className="h-6 w-11 bg-slate-300 rounded-full relative cursor-pointer">
                        <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "Notifications" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-amber-50 rounded-2xl">
                      <Zap className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">System Alerts</h3>
                      <p className="text-sm font-bold text-slate-400">Configure how you receive critical updates.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {["Email Alerts", "Browser Push Notifications", "Slack Integration", "System Log Digests"].map((pref) => (
                      <div key={pref} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors">
                        <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                        <span className="font-bold text-slate-700">{pref}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "Data & Storage" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-emerald-50 rounded-2xl">
                      <HardDrive className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Storage Overview</h3>
                      <p className="text-sm font-bold text-slate-400">Monitor system load and database capacity.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-black text-slate-700 uppercase tracking-widest">Database Usage</span>
                        <span className="text-sm font-black text-slate-900">42.5 GB / 100 GB</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[42%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-black text-slate-700 uppercase tracking-widest">Media Storage (R2/S3)</span>
                        <span className="text-sm font-black text-slate-900">128.9 GB / 500 GB</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[26%]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "API & Integration" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-indigo-50 rounded-2xl">
                      <Cloud className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">External Integrations</h3>
                      <p className="text-sm font-bold text-slate-400">Connect third-party services and APIs.</p>
                    </div>
                  </div>

                  <div className="p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                    <Activity className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                    <p className="font-bold text-slate-400">No active API keys found. Generate one to start integrating.</p>
                    <button className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-800 transition-all">
                      Generate New API Key
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Global Actions Bar */}
            <div className="bg-slate-50 border-t border-slate-100 p-8 flex items-center justify-between">
              <div className="flex items-center text-sm font-bold text-slate-500">
                <Shield className="mr-2 h-4 w-4 text-emerald-500" />
                Configuration is versioned and secured.
              </div>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center rounded-2xl bg-blue-600 px-10 py-4 text-sm font-black text-white shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <RefreshCcw className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}
                {isSaving ? "Synchronizing..." : "Save Configuration"}
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 rounded-3xl p-10 border-2 border-red-100">
            <div className="flex items-center gap-3 mb-6">
              <Trash2 className="h-6 w-6 text-red-600" />
              <h3 className="text-xl font-black text-red-900">System Danger Zone</h3>
            </div>
            <p className="text-sm font-bold text-red-700 mb-8 max-w-xl">
              These actions are irreversible. Performing these will affect all connected clients (Student, Teacher, Parent) and may cause temporary downtime.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 rounded-xl bg-white border-2 border-red-200 text-red-700 text-sm font-black hover:bg-red-100 transition-all">
                Enable Maintenance Mode
              </button>
              <button className="px-6 py-3 rounded-xl bg-white border-2 border-red-200 text-red-700 text-sm font-black hover:bg-red-100 transition-all">
                Flush System Cache
              </button>
              <button className="px-6 py-3 rounded-xl bg-red-600 text-white text-sm font-black hover:bg-red-700 transition-all shadow-xl shadow-red-200">
                Hard System Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
