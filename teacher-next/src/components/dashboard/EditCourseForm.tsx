"use client";

import { useState } from "react";
import { useApi } from "@/lib/api";
import { X } from "lucide-react";
import { Course } from "@/types";
import ImageUpload from "./ImageUpload";

interface EditCourseFormProps {
  course: Course;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditCourseForm({ course, onClose, onSuccess }: EditCourseFormProps) {
  const api = useApi();
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description || "");
  const [thumbnail, setThumbnail] = useState(course.thumbnail || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await api.patch(`/api/courses/${course._id}`, {
        title,
        description,
        thumbnail,
      });
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to update course");
      } else {
        setError("Failed to update course");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Edit Course</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Thumbnail
            </label>
            <ImageUpload 
              value={thumbnail}
              onChange={setThumbnail}
              existingImageUrl={course.thumbnailUrl}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Advanced Mathematics 101"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-gray-900"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the course..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-gray-900 resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
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
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg flex items-center justify-center min-w-[100px] hover:bg-blue-700 transition-colors disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
