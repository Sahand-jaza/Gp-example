import { useOrganization, UserButton } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApi } from '../../lib/api';
import { PlayCircle, Video as VideoIcon, BookOpen, Heart, X } from 'lucide-react';
import Navbar from '../Navbar';

const StudentDashboard = () => {
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const location = useLocation();
  const api = useApi();
  
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'linked' | 'unlinked'>('loading');
  const [parentCode, setParentCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentProfile, setStudentProfile] = useState<any>(null);

  const [courses, setCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Search & Navigation tab states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Browse');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Premium Home Page Actions states
  const [activePanel, setActivePanel] = useState<'summaries' | 'favorites' | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  // Sync state from history location state if navigation passed it
  useEffect(() => {
    if (location.state) {
      const stateObj = location.state as any;
      if (stateObj.searchQuery !== undefined) {
        setSearchQuery(stateObj.searchQuery);
      }
      if (stateObj.initialTab !== undefined) {
        setActiveTab(stateObj.initialTab);
      }
      // Clear location state safely
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/student/profile');
        if (response.data.success) {
          setStudentProfile(response.data.profile);
          if (response.data.profile.parentId) {
            setConnectionStatus('linked');
          } else {
            setConnectionStatus('unlinked');
          }
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error, error.response?.data);
        setConnectionStatus('unlinked');
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/student/courses');
        setCourses(response.data);
      } catch (error) {
        console.error('Error fetching student courses:', error);
      } finally {
        setIsLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [api]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
      setUnreadCount(response.data.filter((n: any) => !n.isRead).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (connectionStatus === 'linked') {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); // Poll every minute
      return () => clearInterval(interval);
    }
    return () => {};
  }, [connectionStatus]);

  const markNotificationRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentCode.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post('/connect/link', { connectionCode: parentCode });
      setConnectionStatus('linked');
      setParentCode('');
      alert("Connected to parent successfully!");
    } catch (error: any) {
      console.error('Connection error:', error, error.response?.data);
      const message = error.response?.data?.message || error.response?.data?.error || "Failed to connect";
      
      if (message.includes("already connected")) {
        setConnectionStatus('linked');
      } else {
        alert(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (connectionStatus === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (connectionStatus === 'unlinked') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6">
        <div className="absolute top-4 right-4 flex items-center gap-4">
          <UserButton afterSignOutUrl="/" />
        </div>
        
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect to Parent</h2>
          <p className="text-gray-600 mb-8">
            Before accessing the student portal, you must link your account to a parent using a connection code.
          </p>
          
          <form onSubmit={handleConnect} className="flex flex-col gap-4">
            <div className="text-left">
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">Parent Code</label>
              <input
                type="text"
                id="code"
                value={parentCode}
                onChange={(e) => setParentCode(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 border"
                placeholder="e.g. TEAM-123"
                disabled={isSubmitting}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !parentCode}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isSubmitting ? 'Connecting...' : 'Connect to Parent'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Enrich courses with beautiful defaults if DB fields are empty, or use DB fields
  const enrichCourses = (dbCourses: any[]) => {
    return dbCourses.map((c) => {
      let ratingStr = '5.0/5';
      if (c.rating !== undefined && c.rating !== null) {
        ratingStr = `${Number(c.rating).toFixed(1)}/5`;
      }
      return {
        ...c,
        grade: c.grade || 'Grade 10',
        subject: c.subject || 'Mathematics',
        rating: ratingStr,
        duration: c.duration || '--:--',
        teacherName: c.teacherName || 'Unknown Teacher',
      };
    });
  };

  const enrichedCourses = enrichCourses(courses);

  const filteredCourses = enrichedCourses.filter((course) => {
    // 1. Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = course.title?.toLowerCase().includes(query);
      const matchDesc = course.description?.toLowerCase().includes(query);
      const matchSubj = course.subject?.toLowerCase().includes(query);
      if (!matchTitle && !matchDesc && matchSubj) return false;
    }

    // 2. Filter by active tab & category
    if (activeTab === 'Subject' && selectedSubject) {
      const matchSubject = course.subject?.toLowerCase() === selectedSubject.toLowerCase() ||
                           course.title?.toLowerCase().includes(selectedSubject.toLowerCase());
      if (!matchSubject) return false;
    }

    return true;
  });

  // Split courses for carousels
  const featuredCourses = enrichedCourses.filter(c => {
    const rateNum = parseFloat(c.rating);
    return rateNum >= 4.3;
  });
  const newlyUploadedCourses = enrichedCourses.slice().reverse();

  // Find a dominant teacher name dynamically, or default to Rabar Faruq
  const dominantTeacher = enrichedCourses.length > 0 
    ? enrichedCourses[0].teacherName 
    : 'Dr. Rabar Faruq';

  const teacherCourses = enrichedCourses.filter(c => c.teacherName === dominantTeacher);

  // Custom styling to hide scrollbars on horizontal scrolls
  const scrollStyle = {
    msOverflowStyle: 'none' as const,
    scrollbarWidth: 'none' as const,
  };

  // Reusable card component
  const CourseCard = ({ course }: { course: any }) => {
    const isMock = course.isMock;
    const isFavorited = favorites.includes(course._id);

    const handleCardClick = () => {
      if (!isMock) {
        navigate(`/course/${course._id}`);
      } else {
        alert("This is a premium mockup course. Direct classroom integration will load your school's interactive videos here!");
      }
    };

    return (
      <div 
        onClick={handleCardClick}
        className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between w-[440px] shrink-0 snap-start cursor-pointer group"
      >
        {/* Top Split Layout */}
        <div className="flex items-start">
          {/* Left Video Box */}
          <div className="w-[180px] h-[110px] rounded-2xl bg-gray-50 border border-gray-100 relative overflow-hidden flex items-center justify-center shrink-0">
            {course.thumbnailUrl ? (
              <img 
                src={course.thumbnailUrl} 
                alt={course.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <PlayCircle className="w-7 h-7 text-gray-300 mb-1 group-hover:text-[#5B86F5] transition-colors" />
                <span className="text-xs font-black text-gray-400">Video</span>
              </div>
            )}
            <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded-md">
              {course.duration}
            </div>
          </div>

          {/* Right Text Block */}
          <div className="flex-1 pl-4 flex flex-col justify-between h-[110px]">
            {/* Badges Row */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="bg-sky-50 text-[#0284c7] font-black text-[9px] px-2 py-0.5 rounded-full border border-sky-100">
                  {course.grade}
                </span>
                <span className="bg-blue-50 text-[#5B86F5] font-black text-[9px] px-2 py-0.5 rounded-full border border-blue-100">
                  {course.subject}
                </span>
                <span className="bg-amber-50 text-amber-700 font-black text-[9px] px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-0.5">
                  {course.rating} <span className="text-amber-500 text-[8px]">★</span>
                </span>
              </div>

              <button 
                onClick={(e) => toggleFavorite(course._id, e)}
                className="text-gray-300 hover:text-red-500 hover:scale-110 transition-all p-1 cursor-pointer shrink-0"
              >
                <Heart 
                  className={`w-4 h-4 transition-colors ${
                    isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-300'
                  }`} 
                />
              </button>
            </div>

            {/* Description */}
            <p className="text-gray-500 text-[10.5px] leading-relaxed line-clamp-3 mt-1.5 flex-1">
              {course.description || "No description provided. Explore active course topics and learn at your own pace."}
            </p>

            {/* Teacher info */}
            <div className="flex items-center gap-2 mt-2">
              <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-[9px] font-black text-purple-600 border border-purple-200">
                {course.teacherName ? course.teacherName.charAt(0) : 'T'}
              </div>
              <span className="text-[10px] font-bold text-gray-600">{course.teacherName}</span>
            </div>
          </div>
        </div>

        {/* Bottom Full-Width Title */}
        <div className="mt-4 pt-4 border-t border-gray-50">
          <h3 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-[#5B86F5] transition-colors leading-tight">
            {course.title}
          </h3>
        </div>
      </div>
    );
  };

  return (
    <>
    <div className="flex flex-col h-screen bg-gray-50 relative">
      {/* Premium Navbar */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedSubject(null);
        }}
        notifications={notifications}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        unreadCount={unreadCount}
        markNotificationRead={markNotificationRead}
        studentProfile={studentProfile}
        organizationName={organization?.name}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Action Header Tabs Group (Summaries, Favorites) */}
          <div className="flex justify-end mb-2">
            <div className="bg-[#5B86F5] text-white rounded-full px-5 py-2.5 flex items-center gap-6 shadow-lg shadow-[#5B86F5]/25 font-bold text-xs select-none">
              <button 
                onClick={() => setActivePanel(activePanel === 'summaries' ? null : 'summaries')} 
                className={`flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer ${activePanel === 'summaries' ? 'underline' : ''}`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Summries</span>
              </button>
              <div className="w-[1px] h-3.5 bg-white/30" />
              <button 
                onClick={() => setActivePanel(activePanel === 'favorites' ? null : 'favorites')} 
                className={`flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer ${activePanel === 'favorites' ? 'underline' : ''}`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Favorites</span>
              </button>
            </div>
          </div>

          {/* Action Panels */}
          {activePanel === 'summaries' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xl mb-4 animate-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#5B86F5]" />
                  <h3 className="font-extrabold text-gray-800">Learning Summaries</h3>
                </div>
                <button onClick={() => setActivePanel(null)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <h4 className="font-black text-xs text-blue-900">Mathematics Study Cards</h4>
                    <p className="text-[11px] text-blue-700/80 mt-1 leading-relaxed">Focus: Quadratic equations & integral calculus. You have completed {studentProfile?.passedQuizzesCount || 0} quizzes.</p>
                  </div>
                </div>
                <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 flex items-start gap-3">
                  <span className="text-xl">📝</span>
                  <div>
                    <h4 className="font-black text-xs text-purple-900">Science Notes Overview</h4>
                    <p className="text-[11px] text-purple-700/80 mt-1 leading-relaxed">Focus: Quantum Mechanics and limits. Connect with your class study rooms for automated lecture cards.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePanel === 'favorites' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xl mb-4 animate-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                  <h3 className="font-extrabold text-gray-800">Your Favorited Lessons</h3>
                </div>
                <button onClick={() => setActivePanel(null)} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {favorites.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-gray-400 font-bold">No favorite lessons yet.</p>
                  <p className="text-[11px] text-gray-400 mt-1">Add lessons to your favorites by tapping the heart icon on any card.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enrichedCourses
                    .filter(c => favorites.includes(c._id))
                    .map(course => (
                      <div 
                        key={course._id}
                        onClick={() => {
                          if (!course.isMock) navigate(`/course/${course._id}`);
                        }}
                        className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-2xl cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center font-bold text-xs shrink-0 text-[#5B86F5]">
                            ★
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-gray-800 truncate leading-tight">{course.title}</h4>
                            <span className="text-[9px] text-gray-400 block mt-0.5">{course.subject} • {course.teacherName}</span>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => toggleFavorite(course._id, e)}
                          className="text-red-500 hover:text-gray-400 transition-colors p-1"
                        >
                          <Heart className="w-4 h-4 fill-red-500" />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Interactive Subject & History views */}
          {activeTab === 'Subject' && (
            <div className="flex flex-wrap gap-2 mb-2 animate-in fade-in slide-in-from-top-1 duration-200">
              {['All', 'Mathematic', 'Science', 'Coding', 'History'].map((subj) => (
                <button
                  key={subj}
                  onClick={() => setSelectedSubject(subj === 'All' ? null : subj)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    (subj === 'All' && !selectedSubject) || selectedSubject === subj
                      ? 'bg-[#5B86F5] text-white shadow-md shadow-[#5B86F5]/25 border border-transparent'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100 shadow-sm'
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'History' && (
            <div className="mb-2 p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="w-10 h-10 rounded-xl bg-[#5B86F5] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md shadow-[#5B86F5]/20 font-black">
                🎓
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-gray-800">Your Learning History</h3>
                <p className="text-xs text-gray-500">Showing courses you are enrolled in and have active study progress.</p>
              </div>
            </div>
          )}

          {/* Content Lists */}
          {isLoadingCourses ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : searchQuery.trim() || activeTab === 'Subject' || activeTab === 'History' ? (
            /* Standard Grid for Search results or Filter tabs */
            <div>
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                {searchQuery.trim() 
                  ? 'Search Results' 
                  : activeTab === 'History' 
                    ? 'Learning History' 
                    : 'Filter by Subject'}
              </h2>
              {filteredCourses.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 border-dashed">
                  <VideoIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900">No courses found</h3>
                  <p className="text-gray-500 mt-1 max-w-xs mx-auto text-xs">Try refining your search query or selecting a different filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredCourses.map((course) => (
                    <CourseCard key={course._id} course={course} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Premium Categorized Carousels Layout when on standard Browse Home Page */
            <div className="space-y-10">
              {/* Row 1: Featured & Recommended */}
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Featured & reccomended</h2>
                <div 
                  className="flex overflow-x-auto gap-6 pb-4 scroll-smooth snap-x snap-mandatory no-scrollbar"
                  style={scrollStyle}
                >
                  {featuredCourses.map((course) => (
                    <CourseCard key={`feat-${course._id}`} course={course} />
                  ))}
                </div>
              </div>

              {/* Row 2: Newly uploaded */}
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Newly uploaded</h2>
                <div 
                  className="flex overflow-x-auto gap-6 pb-4 scroll-smooth snap-x snap-mandatory no-scrollbar"
                  style={scrollStyle}
                >
                  {newlyUploadedCourses.map((course) => (
                    <CourseCard key={`new-${course._id}`} course={course} />
                  ))}
                </div>
              </div>

              {/* Row 3: New from dynamic teacher */}
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">New from {dominantTeacher}</h2>
                <div 
                  className="flex overflow-x-auto gap-6 pb-4 scroll-smooth snap-x snap-mandatory no-scrollbar"
                  style={scrollStyle}
                >
                  {teacherCourses.map((course) => (
                    <CourseCard key={`teach-${course._id}`} course={course} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>


    </div>
  </>
  );
};

export default StudentDashboard;
