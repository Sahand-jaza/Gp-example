"use client";

import { useState, useRef } from "react";
import { useApi } from "@/lib/api";
import { UploadCloud, Image as ImageIcon, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
  value: string; // The S3 Key
  onChange: (s3Key: string) => void;
  existingImageUrl?: string; // The presigned URL if it exists
}

export default function ImageUpload({ value, onChange, existingImageUrl }: ImageUploadProps) {
  const api = useApi();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl || null);
  const [error, setError] = useState("");

  const uploadToS3 = (url: string, file: File) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error("Upload to S3 failed."));
        }
      };
      xhr.onerror = () => reject(new Error("Network error during upload."));
      xhr.open("PUT", url, true);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file.");
        return;
      }

      try {
        setIsUploading(true);
        setError("");
        
        // 1. Get Presigned URL
        const signRes = await api.post("/api/courses/upload/sign", {
          fileName: file.name,
          contentType: file.type,
          folder: "thumbnails"
        });
        const { url, key } = signRes.data;

        // 2. Upload directly to S3
        await uploadToS3(url, file);

        // 3. Set preview and notify parent
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        onChange(key);

      } catch (err) {
        console.error("Image upload error", err);
        setError("Failed to upload image.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onChange("");
  };

  return (
    <div className="w-full">
      {error && (
        <p className="text-red-500 text-sm mb-2">{error}</p>
      )}

      {previewUrl || value ? (
        <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50 aspect-video flex items-center justify-center">
          {previewUrl || existingImageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={previewUrl || existingImageUrl} 
              alt="Course Thumbnail" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400 flex flex-col items-center">
              <ImageIcon className="w-10 h-10 mb-2" />
              <span className="text-sm">Image uploaded securely</span>
            </div>
          )}
          
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-white/90 text-red-600 p-1.5 rounded-lg shadow-sm hover:bg-red-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors aspect-video ${
            isUploading ? "border-gray-300 bg-gray-50 opacity-70" : "border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50/50"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center text-blue-600">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-sm font-medium">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="bg-white p-3 rounded-full shadow-sm mb-3 border border-gray-100">
                <UploadCloud className="w-6 h-6 text-gray-400" />
              </div>
              <p className="font-medium text-gray-900 text-sm">Upload Thumbnail</p>
              <p className="text-xs text-gray-500 mt-1">16:9 recommending, up to 5MB</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
