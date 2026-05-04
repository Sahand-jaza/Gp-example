"use client";

import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  Cloud, 
  User,
  Globe,
  Save
} from "lucide-react";

export default function SettingsPage() {
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
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
              <Globe className="mr-2 h-5 w-5 text-slate-400" />
              Platform Configuration
            </h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Platform Name</label>
                <input 
                  type="text" 
                  defaultValue="EduPlatform Academy"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Support Email</label>
                <input 
                  type="email" 
                  defaultValue="support@eduplatform.com"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">System Timezone</label>
                <select className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                  <option>UTC (Coordinated Universal Time)</option>
                  <option>EST (Eastern Standard Time)</option>
                  <option>CET (Central European Time)</option>
                </select>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center text-sm text-slate-500">
                <Shield className="mr-2 h-4 w-4 text-green-500" />
                Changes will take effect immediately.
              </div>
              <button className="flex items-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-500">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>

          <div className="bg-red-50 rounded-xl shadow-sm ring-1 ring-red-200 p-8">
            <h3 className="text-lg font-bold text-red-900 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-700 mb-6">These actions are irreversible and will affect the entire platform.</p>
            <div className="flex gap-4">
              <button className="px-4 py-2 rounded-lg bg-white border border-red-200 text-red-700 text-sm font-bold hover:bg-red-100">
                Maintenance Mode
              </button>
              <button className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700">
                Purge Cache
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
