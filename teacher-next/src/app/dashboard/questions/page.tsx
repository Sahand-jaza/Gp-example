"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/lib/api";
import { 
  MessageSquare, 
  User, 
  Video, 
  Send, 
  CheckCircle, 
  Clock, 
  ChevronRight,
  Filter
} from "lucide-react";
import { format } from "date-fns";

export default function QuestionsPage() {
  const api = useApi();
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<{ [key: string]: boolean }>({});

  const fetchComments = async () => {
    try {
      const res = await api.get("/api/comments/teacher/all");
      setComments(res.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleReply = async (commentId: string) => {
    const text = replyText[commentId];
    if (!text?.trim()) return;

    setIsSubmitting({ ...isSubmitting, [commentId]: true });
    try {
      await api.post(`/api/comments/${commentId}/reply`, { text });
      setReplyText({ ...replyText, [commentId]: "" });
      await fetchComments(); // Refresh list
    } catch (error) {
      console.error("Error replying to comment:", error);
      alert("Failed to send reply");
    } finally {
      setIsSubmitting({ ...isSubmitting, [commentId]: false });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 border-b-4 border-blue-600 inline-block pb-1">
            Student Questions
          </h1>
          <p className="text-gray-500 mt-2">
            Manage feedback and questions from your students across all courses.
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-4 border border-blue-100 shadow-sm">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <MessageSquare size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-900">{comments.length}</div>
            <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Total Questions</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="text-gray-300" size={40} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No questions yet</h3>
            <p className="text-gray-500">When students ask questions on your videos, they will appear here.</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div 
              key={comment._id} 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              <div className="p-6">
                {/* Header: Student & Course Context */}
                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
                  <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-semibold border border-indigo-100">
                    <User size={14} />
                    {comment.userId?.name || "Unknown Student"}
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                  <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-semibold border border-blue-100">
                    <Video size={14} />
                    {comment.videoId?.courseId?.title}: {comment.videoId?.title}
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-gray-400 font-medium">
                    <Clock size={14} />
                    {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                  </div>
                </div>

                {/* Question Content */}
                <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100 mb-6">
                  <p className="text-gray-800 text-lg font-inter leading-relaxed whitespace-pre-wrap">
                    {comment.text}
                  </p>
                </div>

                {/* Replies Area */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="space-y-4 mb-6 pl-6 border-l-4 border-emerald-100">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <CheckCircle size={12} className="text-emerald-500" /> Previous Replies
                    </h4>
                    {comment.replies.map((reply: any, idx: number) => (
                      <div key={idx} className="bg-emerald-50/30 rounded-xl p-4 border border-emerald-50">
                        <div className="flex items-center gap-2 mb-2">
                           <span className="text-xs font-bold text-emerald-700">Teacher</span>
                           <span className="text-[10px] text-gray-400">{format(new Date(reply.createdAt), "MMM d")}</span>
                        </div>
                        <p className="text-gray-700 text-sm italic">"{reply.text}"</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                <div className="mt-4 flex gap-3">
                  <div className="flex-1 relative">
                    <textarea
                      rows={1}
                      value={replyText[comment._id] || ""}
                      onChange={(e) => setReplyText({ ...replyText, [comment._id]: e.target.value })}
                      placeholder="Write your response to the student..."
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none min-h-[50px] resize-none"
                    />
                  </div>
                  <button
                    onClick={() => handleReply(comment._id)}
                    disabled={isSubmitting[comment._id] || !replyText[comment._id]?.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 flex-shrink-0"
                  >
                    {isSubmitting[comment._id] ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Send size={18} />
                        Reply
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
