"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface VideoModalProps {
  url: string;
  title?: string;
  onClose: () => void;
}

export default function VideoModal({ url, title, onClose }: VideoModalProps) {
  // Prevent scrolling on body when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate pr-4">{title || "Video Preview"}</h2>
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          <video 
            src={url} 
            controls 
            autoPlay 
            className="w-full h-full max-h-[80vh] outline-none"
            controlsList="nodownload"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
}
