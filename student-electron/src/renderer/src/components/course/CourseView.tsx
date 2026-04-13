import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/api';
import { ArrowLeft, PlayCircle, Lock, Sparkles, X, MessageSquare, Send } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import FocusMonitor from '../monitoring/FocusMonitor';

export default function CourseView() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const api = useApi();
  const { user } = useUser();

  const [course, setCourse] = useState<any>(null);
  const [activeVideo, setActiveVideo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Q&A / Feedback State
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Summarize Modal State
  const [isSummarizeModalOpen, setIsSummarizeModalOpen] = useState(false);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Optional: Reset summary state when changing videos
  useEffect(() => {
    setSummaryText(null);
    setIsSummarizeModalOpen(false);
  }, [activeVideo?._id]);

  const handleSummarize = async () => {
    if (!activeVideo?._id) return;
    setIsSummarizing(true);
    try {
      const res = await api.get(`/ai/summarize/video/${activeVideo._id}`);
      setSummaryText(res.data.summary);
      setIsSummarizeModalOpen(true);
    } catch (err: any) {
      console.error("Failed to summarize:", err);
      alert(err.response?.data?.message || "Failed to generate summary. Please try again.");
    } finally {
      setIsSummarizing(false);
    }
  };

  // Fetch comments when video changes
  useEffect(() => {
    if (activeVideo?._id) {
      api.get(`/comments/${activeVideo._id}`)
        .then(res => setComments(res.data))
        .catch(err => console.error("Error fetching comments:", err));
    }
  }, [activeVideo?._id, api]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !activeVideo?._id) return;
    
    setIsSubmittingComment(true);
    try {
      const res = await api.post('/comments', {
        videoId: activeVideo._id,
        text: newComment.trim()
      });
      // Optionally format the user locally since backend might not populate on create
      const optimisticComment = { ...res.data, userId: { name: user?.fullName || 'You' } };
      setComments([...comments, optimisticComment]);
      setNewComment("");
    } catch (error) {
       console.error("Failed to post comment:", error);
       alert("Failed to send feedback.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const response = await api.get(`/student/courses/${courseId}`);
        setCourse(response.data);
        if (response.data.videos && response.data.videos.length > 0) {
          setActiveVideo(response.data.videos[0]);
        }
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, api]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <h2 className="text-xl font-bold mb-4">Course not found</h2>
        <button 
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
            <p className="text-sm text-gray-500 line-clamp-1">{course.description}</p>
          </div>
        </div>
      </header>

      {/* Main Content split */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Video Player Area */}
        <div className="flex-1 bg-gray-900 overflow-y-auto flex flex-col">
          {activeVideo ? (
            <div className="w-full bg-black aspect-video flex-shrink-0">
              <video 
                src={activeVideo.url} 
                controls 
                controlsList="nodownload" 
                className="w-full h-full object-contain"
                autoPlay
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <div className="w-full aspect-video bg-gray-800 flex items-center justify-center flex-shrink-0 text-gray-400">
              <div className="text-center">
                <PlayCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No video selected</p>
              </div>
            </div>
          )}

          {/* Video Metadata */}
          <div className="p-6 bg-white flex-1 text-gray-900 border-t border-gray-200">
             <div className="flex justify-between items-start">
               <div>
                 <h2 className="text-2xl font-bold mb-2">
                   {activeVideo ? activeVideo.title : course.title}
                 </h2>
                 <p className="text-gray-600">
                   {activeVideo && activeVideo.duration ? `Duration: ${Math.round(activeVideo.duration / 60)} minutes` : course.description}
                 </p>
               </div>
               {activeVideo && (
                 <div className="flex gap-3">
                   <button 
                     onClick={handleSummarize}
                     disabled={isSummarizing}
                     className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-200 px-5 py-2 rounded-lg transition font-medium shadow-sm flex items-center gap-2 disabled:opacity-50"
                   >
                     {isSummarizing ? (
                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-700"></div>
                     ) : (
                       <Sparkles className="w-4 h-4" />
                     )}
                     Summarize It
                   </button>
                   <button 
                     onClick={() => navigate(`/course/${courseId}/quiz/${activeVideo._id}`)}
                     className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition font-medium shadow-sm flex items-center gap-2"
                   >
                     Take Quiz
                   </button>
                 </div>
               )}
             </div>
          </div>

           {/* Q&A / Feedback Section */}
           {activeVideo && (
             <div className="p-6 bg-gray-50 flex-1 border-t border-gray-200 min-h-max">
               <div className="max-w-4xl mx-auto">
                 <div className="flex items-center gap-2 mb-6">
                   <MessageSquare className="w-5 h-5 text-gray-700" />
                   <h3 className="text-xl font-bold text-gray-900">Q&A and Feedback</h3>
                 </div>

                 {/* Comment Submission Form */}
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
                   <form onSubmit={handleSubmitComment}>
                     <textarea
                       value={newComment}
                       onChange={(e) => setNewComment(e.target.value)}
                       placeholder="Ask a question or leave feedback for the instructor..."
                       className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                       rows={3}
                       required
                     />
                     <div className="flex justify-end mt-3">
                       <button
                         type="submit"
                         disabled={isSubmittingComment || !newComment.trim()}
                         className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                       >
                         {isSubmittingComment ? (
                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                         ) : (
                           <Send className="w-4 h-4" />
                         )}
                         Send to Teacher
                       </button>
                     </div>
                   </form>
                 </div>

                 {/* Comments List */}
                 <div className="space-y-4">
                   {comments.length === 0 ? (
                     <p className="text-gray-500 italic text-center py-6">No questions asked yet. Be the first!</p>
                   ) : (
                     comments.map((comment: any) => (
                       <div key={comment._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4">
                         <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 text-indigo-700 font-bold">
                           {comment.userId?.name ? comment.userId.name.charAt(0).toUpperCase() : 'U'}
                         </div>
                         <div className="flex-1">
                           <div className="flex items-center justify-between mb-1">
                             <h4 className="font-semibold text-gray-900 text-sm">
                               {comment.userId?.name || 'Unknown User'}
                             </h4>
                             <span className="text-xs text-gray-400">
                               {new Date(comment.createdAt).toLocaleDateString()}
                             </span>
                           </div>
                           <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.text}</p>
                           
                           {/* Render existing replies from Teacher */}
                           {comment.replies && comment.replies.length > 0 && (
                             <div className="mt-4 space-y-3 pl-4 border-l-2 border-indigo-100">
                               {comment.replies.map((reply: any, idx: number) => (
                                 <div key={idx} className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                                   <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-indigo-900 text-xs">Teacher Reply</span>
                                      <span className="text-xs text-gray-400">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                   </div>
                                   <p className="text-sm text-gray-700">{reply.text}</p>
                                 </div>
                               ))}
                             </div>
                           )}
                         </div>
                       </div>
                     ))
                   )}
                 </div>
               </div>
             </div>
           )}
        </div>

        {/* Sidebar Outline */}
        <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col hidden lg:flex">
          <div className="p-4 bg-white border-b border-gray-200 font-semibold text-gray-900">
            Course Content
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {course.videos && course.videos.length > 0 ? (
              course.videos.map((video: any, index: number) => {
                const isActive = activeVideo?._id === video._id;
                const isUnlocked = video.isUnlocked;

                return (
                  <button
                    key={video._id}
                    onClick={() => {
                      if (!isUnlocked) {
                        alert("You must complete the previous video's quiz to unlock this content.");
                        return;
                      }
                      setActiveVideo(video);
                    }}
                    className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors ${
                      isActive 
                        ? 'bg-blue-100 border-blue-200 text-blue-900 border' 
                        : isUnlocked 
                          ? 'hover:bg-gray-200 text-gray-700 border border-transparent'
                          : 'opacity-60 bg-gray-100 text-gray-500 cursor-not-allowed border-transparent'
                    }`}
                  >
                    <div className="mt-1">
                      {isActive ? (
                         <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                           <PlayCircle className="w-3 h-3 text-white" />
                         </div>
                      ) : !isUnlocked ? (
                         <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                           <Lock className="w-3 h-3 text-gray-500" />
                         </div>
                      ) : (
                         <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                           {index + 1}
                         </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-sm leading-tight ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>{video.title}</p>
                      {video.duration && (
                         <p className="text-xs text-gray-500 mt-1">{Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}</p>
                      )}
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="p-4 text-sm text-gray-500 bg-white rounded border border-gray-200 shadow-sm">
                No videos available for this course yet.
              </div>
            )}
          </div>
        </div>
        
      </div>

      {/* Summarize Modal Overaly */}
      {isSummarizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">AI Summary</h3>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{activeVideo?.title}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSummarizeModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto">
              {summaryText ? (
                <div className="prose prose-indigo max-w-none">
                   {/* Split heavily formatted string into somewhat structured representation (Gemini returns raw text with dashes) */}
                   <ul className="space-y-3 text-gray-700 leading-relaxed font-medium">
                     {summaryText.split('\n').filter(line => line.trim().length > 0).map((line, idx) => (
                       <li key={idx} className="flex gap-3">
                         <span className="text-indigo-500 mt-1.5 flex-shrink-0">•</span>
                         <span>{line.replace(/^-\s*/, '').replace(/^\*\s*/, '')}</span>
                       </li>
                     ))}
                   </ul>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500 italic">No summary available.</div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end flex-shrink-0">
               <button 
                 onClick={() => setIsSummarizeModalOpen(false)}
                 className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
               >
                 Close
               </button>
            </div>
          </div>
        </div>
      )}
      {/* Real-time Focus Monitor UI */}
      {user?.id && (
        <FocusMonitor
          studentId={user.id}
          activeVideoId={activeVideo?._id}
        />
      )}
    </div>
  );
}
