"use client";

import { useState } from "react";
import { Globe, Save, LayoutTemplate, AlertCircle, Shield } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import api from "@/lib/api";

export default function SettingsForm({ initialSettings }: { initialSettings: any }) {
  const { getToken } = useAuth();
  
  // Dashboard settings
  const [featuredTitle, setFeaturedTitle] = useState(initialSettings?.featuredTitle || "Featured & reccomended");
  const [newlyUploadedTitle, setNewlyUploadedTitle] = useState(initialSettings?.newlyUploadedTitle || "Newly uploaded");
  const [teacherTitle, setTeacherTitle] = useState(initialSettings?.teacherTitle || "New from {Teacher}");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const token = await getToken();
      const res = await api.put("/admin/settings", {
        featuredTitle,
        newlyUploadedTitle,
        teacherTitle
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setMessage("Settings saved successfully!");
      } else {
        setMessage("Failed to save settings.");
      }
    } catch (error) {
      console.error("Save settings error:", error);
      setMessage("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="md:col-span-2 space-y-6">
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-8">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
          <LayoutTemplate className="mr-2 h-5 w-5 text-slate-400" />
          Student Dashboard Settings
        </h3>
        
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Row 1 Title (Featured)</label>
              <input 
                type="text" 
                value={featuredTitle}
                onChange={e => setFeaturedTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-slate-400">Shows highly rated courses or courses marked as 'Featured'.</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Row 2 Title (New)</label>
              <input 
                type="text" 
                value={newlyUploadedTitle}
                onChange={e => setNewlyUploadedTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-slate-400">Shows the most recently published courses.</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Row 3 Title (Teacher)</label>
              <input 
                type="text" 
                value={teacherTitle}
                onChange={e => setTeacherTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-slate-400">You can use {"{Teacher}"} to dynamically insert the teacher's name.</p>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center text-sm text-slate-500">
              <Shield className="mr-2 h-4 w-4 text-green-500" />
              Changes will take effect immediately.
            </div>
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex items-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
          {message && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100 font-bold">
              {message}
            </div>
          )}
        </form>
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
  );
}
