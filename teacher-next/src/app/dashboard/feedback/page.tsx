"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/lib/api";
import { 
  Star, 
  User, 
  Video, 
  Clock, 
  ChevronRight,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";

export default function FeedbackPage() {
  const api = useApi();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeedbacks = async () => {
    try {
      const res = await api.get("/api/feedback/all");
      setFeedbacks(res.data);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  // Calculate overall average rating
  const totalRating = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
  const averageRating = feedbacks.length > 0 ? (totalRating / feedbacks.length).toFixed(1) : "0.0";

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 border-b-4 border-yellow-500 inline-block pb-1">
            Course Feedback
          </h1>
          <p className="text-gray-500 mt-2">
            Monitor student ratings and reviews across your courses.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-yellow-50 p-4 rounded-xl flex items-center gap-4 border border-yellow-100 shadow-sm">
            <div className="bg-yellow-500 p-2 rounded-lg text-white">
              <Star size={24} className="fill-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-900">{averageRating}</div>
              <div className="text-xs text-yellow-700 font-semibold uppercase tracking-wider">Avg Rating</div>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-4 border border-blue-100 shadow-sm">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <MessageSquare size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-900">{feedbacks.length}</div>
              <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Total Reviews</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {feedbacks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="text-gray-300" size={40} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No feedback yet</h3>
            <p className="text-gray-500">When students rate your courses, their reviews will appear here.</p>
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <div 
              key={feedback._id} 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              <div className="p-6">
                {/* Header: Student & Course Context */}
                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
                  <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-semibold border border-indigo-100">
                    <User size={14} />
                    {feedback.student?.name || "Unknown Student"}
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                  <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full font-semibold border border-purple-100">
                    <Video size={14} />
                    {feedback.courseId?.title || "Unknown Course"}
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-gray-400 font-medium">
                    <Clock size={14} />
                    {format(new Date(feedback.createdAt), "MMM d, yyyy")}
                  </div>
                </div>

                {/* Rating & Comment Content */}
                <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-100">
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={20} 
                        className={feedback.rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-gray-300"} 
                      />
                    ))}
                    <span className="ml-3 text-sm font-bold text-gray-700">{feedback.rating}/5</span>
                  </div>
                  
                  {feedback.comment ? (
                    <p className="text-gray-800 text-base font-inter leading-relaxed whitespace-pre-wrap">
                      "{feedback.comment}"
                    </p>
                  ) : (
                    <p className="text-gray-400 text-sm italic">
                      No comment provided.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
