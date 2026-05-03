"use client";

import { useState, useRef } from "react";
import { useApi } from "@/lib/api";
import { X, UploadCloud, FileVideo, AlertCircle } from "lucide-react";

interface VideoUploadFormProps {
  courseId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VideoUploadForm({ courseId, onClose, onSuccess }: VideoUploadFormProps) {
  const api = useApi();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [statusText, setStatusText] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.type.startsWith("video/")) {
        setError("Please select a valid video file.");
        setFile(null);
        return;
      }
      setFile(selected);
      // Automatically set title from filename if empty
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ""));
      }
      setError("");
    }
  };

  const uploadToR2 = (url: string, file: File) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error("Upload failed. Status: " + xhr.status));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload."));

      xhr.open("PUT", url, true);
      xhr.setRequestHeader("Content-Type", file.type);
      // No extra headers needed for R2 standard PUT upload
      xhr.send(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file) {
      setError("Title and video file are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      
      // 1. Get Presigned URL
      setStatusText("Requesting secure upload link...");
      const signRes = await api.post("/api/courses/upload/sign", {
        fileName: file.name,
        contentType: file.type,
      });
      const { url, key } = signRes.data;

      // 2. Upload directly to Cloudflare R2
      setStatusText("Uploading to Cloudflare R2...");
      await uploadToR2(url, file);

      // 3. Register video with backend
      setStatusText("Finalizing video details...");
      await api.post(`/api/courses/${courseId}/videos`, {
        title,
        s3Key: key,
        duration: 0, // In reality, we could calculate this in frontend or let backend extract it via a job
      });

      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Upload failed");
      } else {
        setError("Upload failed");
      }
      setIsSubmitting(false);
      setStatusText("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Upload Video Lesson</h2>
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 flex items-start gap-2 text-red-600 text-sm rounded-lg border border-red-100">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Algebra"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-gray-900"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video File <span className="text-red-500">*</span>
            </label>
            
            <div 
              onClick={() => !isSubmitting && fileInputRef.current?.click()}
              className={`mt-1 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                file ? "border-blue-300 bg-blue-50" : "border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50/50"
              } ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="video/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
              
              {file ? (
                <div className="flex flex-col items-center text-center">
                  <div className="bg-blue-100 p-3 rounded-full mb-3">
                    <FileVideo className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="font-medium text-gray-900 text-sm line-clamp-1 max-w-[250px]">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  {!isSubmitting && (
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="mt-3 text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="bg-white p-3 rounded-full shadow-sm mb-3 border border-gray-100">
                    <UploadCloud className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-900 text-sm">Click to browse or drag & drop</p>
                  <p className="text-xs text-gray-500 mt-1">MP4, WebM, or OGG up to 2GB</p>
                </div>
              )}
            </div>
          </div>

          {isSubmitting && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
               <div className="flex justify-between text-sm mb-2">
                 <span className="text-gray-600 font-medium">{statusText}</span>
                 <span className="text-blue-600 font-bold">{uploadProgress}%</span>
               </div>
               <div className="w-full bg-gray-200 rounded-full h-2">
                 <div 
                   className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                   style={{ width: `${uploadProgress}%` }}
                 ></div>
               </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !file}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Uploading..." : "Upload Video"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
