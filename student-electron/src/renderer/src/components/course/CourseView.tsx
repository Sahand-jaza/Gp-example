import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/api';
import { ArrowLeft, PlayCircle, Lock, Sparkles, X, MessageSquare, Send, Play, Pause, Volume2, VolumeX, Maximize, Minimize, CheckCircle2 } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useRef } from 'react';
import Navbar from '../Navbar';

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
  const [isQuizAvailable, setIsQuizAvailable] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Anti-skip State
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const maxTimeReached = useRef(0);
  const hasMarkedComplete = useRef(false); // Prevent duplicate /complete calls

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Optional: Reset summary state when changing videos
  useEffect(() => {
    setSummaryText(null);
    setIsSummarizeModalOpen(false);
    setIsQuizAvailable(activeVideo?.isCompleted || false);
    hasMarkedComplete.current = false; // Reset on video change
    
    if (activeVideo?.isCompleted) {
      // If already completed, allow free seeking by setting max reached to a high value
      maxTimeReached.current = 9999999; 
    } else {
      maxTimeReached.current = 0; // Reset progress for new video
    }
    setIsQuizAvailable(activeVideo?.isCompleted || false);
  }, [activeVideo?._id, activeVideo?.isCompleted]);

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
  }, [activeVideo?._id]); // Intentionally excludes `api` — it's a stable memoized instance

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
      {/* Premium Navbar */}
      <Navbar />

      {/* Course Context Bar */}
      <div className="bg-gray-50 border-b border-gray-150 px-6 py-3 flex items-center gap-4 select-none">
        <button 
          onClick={() => navigate('/')}
          className="p-1.5 hover:bg-gray-200 rounded-full transition-all duration-200 text-gray-600 flex items-center justify-center active:scale-90"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
        </button>
        <div className="min-w-0">
          <span className="text-[9px] font-bold text-[#5B86F5] uppercase tracking-widest block leading-none">Course</span>
          <h1 className="text-sm font-black text-gray-800 truncate mt-1 leading-none">{course.title}</h1>
        </div>
      </div>

      {/* Main Content split */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Video Player & Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col items-center">
          <div className="w-full max-w-5xl flex flex-col pb-20">
            
            {/* Video Section */}
            <div className="w-full bg-gray-950 px-6 pt-6 pb-12 rounded-b-[2rem] shadow-2xl">
              {activeVideo ? (
                <div 
                  ref={containerRef}
                  className="relative group w-full bg-black rounded-3xl overflow-hidden shadow-2xl aspect-video border border-white/5 flex items-center justify-center"
                  onMouseMove={() => {
                    setShowControls(true);
                    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
                    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
                  }}
                >
                  <video 
                    ref={videoRef}
                    src={activeVideo.url} 
                    className="w-full h-full object-contain"
                    autoPlay
                    onContextMenu={(e) => e.preventDefault()}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                    onTimeUpdate={() => {
                      if (videoRef.current) {
                        const time = videoRef.current.currentTime;
                        setCurrentTime(time);
                        if (time > maxTimeReached.current) {
                          maxTimeReached.current = time;
                        }
                        // Unlock quiz at 95% watched
                        if (videoRef.current.duration && (maxTimeReached.current / videoRef.current.duration) > 0.95) {
                          setIsQuizAvailable(true);
                          // For quiz-free videos, also persist completion to backend once
                          if (!hasMarkedComplete.current && !activeVideo?.isCompleted) {
                            hasMarkedComplete.current = true;
                            api.post(`/student/videos/${activeVideo?._id}/complete`)
                              .catch(err => {
                                // Silently ignore if video has a quiz (backend returns 400)
                                if (err.response?.status !== 400) {
                                  console.error('Failed to mark video complete:', err);
                                }
                              });
                          }
                        }
                      }
                    }}
                    onSeeking={() => {
                      // Only restrict seeking if it's the first time watching (not completed)
                      if (!activeVideo?.isCompleted && videoRef.current && videoRef.current.currentTime > maxTimeReached.current) {
                        videoRef.current.currentTime = maxTimeReached.current;
                      }
                    }}
                    onClick={() => {
                      if (videoRef.current) {
                        if (isPlaying) videoRef.current.pause();
                        else videoRef.current.play();
                      }
                    }}
                  />

                  {/* Custom Controls Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent transition-opacity duration-300 flex flex-col justify-end p-8 ${showControls ? 'opacity-100' : 'opacity-0 cursor-none'}`}>
                    
                    {/* Progress Bar */}
                    <div className="relative w-full h-1.5 bg-white/20 rounded-full mb-6 group/bar cursor-pointer">
                      {/* Furthest Reached (Ghost Bar) */}
                      <div 
                        className="absolute top-0 left-0 h-full bg-white/10 rounded-full" 
                        style={{ width: `${(maxTimeReached.current / duration) * 100}%` }}
                      />
                      {/* Current Progress */}
                      <div 
                        className="absolute top-0 left-0 h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] rounded-full transition-all duration-100" 
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                      {/* Interaction Layer */}
                      <input 
                        type="range"
                        min={0}
                        max={duration}
                        step={0.1}
                        value={currentTime}
                        onChange={(e) => {
                          const newTime = parseFloat(e.target.value);
                          if (newTime <= maxTimeReached.current && videoRef.current) {
                            videoRef.current.currentTime = newTime;
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-8">
                        <button 
                          onClick={() => {
                            if (videoRef.current) {
                              if (isPlaying) videoRef.current.pause();
                              else videoRef.current.play();
                            }
                          }}
                          className="hover:scale-110 transition-transform active:scale-95"
                        >
                          {isPlaying ? (
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                              <Pause className="w-5 h-5 text-white fill-white" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 border border-blue-400">
                              <Play className="w-5 h-5 text-white fill-white ml-1" />
                            </div>
                          )}
                        </button>
                        
                        <div className="flex items-center gap-2 text-sm font-bold tracking-tight tabular-nums text-white/90">
                          <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
                          <span className="opacity-30">/</span>
                          <span className="opacity-60">{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 group/volume">
                          <button onClick={() => {
                            const newMuted = !isMuted;
                            setIsMuted(newMuted);
                            if (videoRef.current) videoRef.current.muted = newMuted;
                          }} className="opacity-70 hover:opacity-100 transition-opacity">
                            {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                          </button>
                          <input 
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={isMuted ? 0 : volume}
                            onChange={(e) => {
                              const newVolume = parseFloat(e.target.value);
                              setVolume(newVolume);
                              setIsMuted(false);
                              if (videoRef.current) videoRef.current.volume = newVolume;
                            }}
                            className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
                          />
                        </div>
                        
                        <button 
                          onClick={() => {
                            if (!isFullscreen) {
                              containerRef.current?.requestFullscreen();
                            } else {
                              document.exitFullscreen();
                            }
                          }} 
                          className="opacity-70 hover:opacity-100 transition-opacity"
                        >
                          {isFullscreen ? <Minimize className="w-5 h-5 text-white" /> : <Maximize className="w-5 h-5 text-white" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full aspect-video bg-gray-900 rounded-3xl flex items-center justify-center text-gray-500 border border-gray-800 shadow-inner">
                  <div className="text-center">
                    <PlayCircle className="w-20 h-20 mx-auto mb-6 opacity-10" />
                    <p className="text-xl font-medium opacity-40">Select a lesson to begin</p>
                  </div>
                </div>
              )}
            </div>

            {/* Content & Metadata Section */}
            <div className="px-6 -mt-8">
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 md:p-12">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-10">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-blue-100/50">
                        <Sparkles className="w-3 h-3" />
                        Current Lesson
                      </div>
                      {activeVideo?.duration && (
                        <span className="text-gray-400 text-xs font-bold bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                          {Math.round(activeVideo.duration / 60)} MIN
                        </span>
                      )}
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight leading-[1.1] break-words">
                      {activeVideo ? activeVideo.title : course.title}
                    </h2>
                    <p className="text-gray-500 text-lg md:text-xl leading-relaxed max-w-3xl font-medium opacity-80">
                      {activeVideo?.description || course.description}
                    </p>
                  </div>
                  
                  {activeVideo && (
                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
                      <button 
                        onClick={handleSummarize}
                        disabled={isSummarizing}
                        className="group relative bg-white text-gray-900 border-2 border-gray-100 px-8 py-4 rounded-[1.25rem] transition-all font-black flex items-center justify-center gap-3 disabled:opacity-50 hover:border-indigo-200 hover:bg-indigo-50/30 active:scale-95 shadow-sm"
                      >
                        {isSummarizing ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                        ) : (
                          <Sparkles className="w-5 h-5 text-indigo-500 group-hover:rotate-12 transition-transform" />
                        )}
                        <span className="tracking-tight">Summarize</span>
                      </button>
                      
                      <button 
                        onClick={() => navigate(`/course/${courseId}/quiz/${activeVideo._id}`)}
                        disabled={!isQuizAvailable}
                        className={`group relative px-10 py-4 rounded-[1.25rem] transition-all font-black flex items-center justify-center gap-3 active:scale-95 shadow-xl ${
                          isQuizAvailable 
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/25 hover:shadow-blue-500/40 translate-y-[-2px] hover:translate-y-[-4px]' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200 shadow-none'
                        }`}
                      >
                        <span className="tracking-tight">Take Quiz</span>
                        {isQuizAvailable ? (
                          <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                        ) : (
                          <Lock className="w-4 h-4 opacity-50" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Integrated Q&A Section */}
                {activeVideo && (
                  <div className="mt-20 pt-20 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                          <MessageSquare className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Q&A and Feedback</h3>
                          <p className="text-gray-400 text-sm font-medium">Discuss this lesson with your instructor</p>
                        </div>
                      </div>
                      <div className="text-gray-400 text-sm font-bold">
                        {comments.length} Comments
                      </div>
                    </div>

                    {/* New Comment Box */}
                    <div className="relative mb-12">
                      <form onSubmit={handleSubmitComment} className="relative">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Have a question? Type it here..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-[2rem] p-6 pr-32 text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500/50 transition-all resize-none font-medium"
                          rows={2}
                          required
                        />
                        <div className="absolute right-3 bottom-3">
                          <button
                            type="submit"
                            disabled={isSubmittingComment || !newComment.trim()}
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl text-sm font-bold disabled:opacity-50 hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-500/20"
                          >
                            {isSubmittingComment ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            Send
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-6">
                      {comments.length === 0 ? (
                        <div className="bg-gray-50 rounded-[2rem] p-12 text-center border-2 border-dashed border-gray-200">
                          <p className="text-gray-400 font-bold italic">No questions yet. Be the first to start the discussion!</p>
                        </div>
                      ) : (
                        comments.map((comment: any) => (
                          <div key={comment._id} className="group bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex gap-6">
                              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shrink-0 text-white font-black text-xl shadow-lg shadow-indigo-200">
                                {comment.userId?.name ? comment.userId.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-bold text-gray-900">
                                    {comment.userId?.name || 'Unknown User'}
                                  </h4>
                                  <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                                    {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                                <p className="text-gray-600 leading-relaxed font-medium mb-4">{comment.text}</p>
                                
                                {comment.replies && comment.replies.length > 0 && (
                                  <div className="mt-6 space-y-4">
                                    {comment.replies.map((reply: any, idx: number) => (
                                      <div key={idx} className="bg-indigo-50/50 p-6 rounded-[1.5rem] border border-indigo-100 flex gap-4">
                                        <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 text-white">
                                          <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-indigo-900 text-xs uppercase tracking-wider">Instructor</span>
                                          </div>
                                          <p className="text-sm text-gray-700 font-medium leading-relaxed">{reply.text}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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
                const isCompleted = video.isCompleted;

                return (
                  <button
                    key={video._id}
                    onClick={() => {
                      if (!isUnlocked) {
                        return;
                      }
                      setActiveVideo(video);
                    }}
                    className={`relative w-full text-left p-4 rounded-2xl flex items-start gap-4 transition-all duration-300 group/item ${
                      isActive 
                        ? 'bg-blue-600 shadow-lg shadow-blue-500/20 translate-x-1' 
                        : isUnlocked 
                          ? 'hover:bg-white hover:shadow-md border border-transparent'
                          : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="mt-0.5 relative">
                      {isCompleted ? (
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-white/20' : 'bg-green-100'}`}>
                          <CheckCircle2 className={`w-4 h-4 ${isActive ? 'text-white' : 'text-green-600'}`} />
                        </div>
                      ) : isActive ? (
                        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      ) : !isUnlocked ? (
                        <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                          <Lock className="w-4 h-4 text-gray-400" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-sm font-black text-gray-400 group-hover/item:text-gray-600">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm leading-tight transition-colors truncate ${isActive ? 'text-white' : 'text-gray-900'}`}>
                        {video.title}
                      </p>
                      {video.duration > 0 && (
                        <p className={`text-[10px] font-black uppercase tracking-widest mt-1.5 opacity-60 ${isActive ? 'text-white' : 'text-gray-400'}`}>
                          {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
                        </p>
                      )}
                    </div>

                    {!isUnlocked && (
                      <div className="absolute top-2 right-2 p-1">
                        <Lock className="w-3 h-3 text-gray-300" />
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                <PlayCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-bold">No videos available</p>
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
    </div>
  );
}
