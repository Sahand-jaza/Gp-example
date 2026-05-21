import { useUser, useOrganization, UserButton, useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/api';
import { PlayCircle, Video as VideoIcon, Bell, Check } from 'lucide-react';
import { format } from 'date-fns';
import FocusMonitor from '../monitoring/FocusMonitor';

const StudentDashboard = () => {
  const { user } = useUser();
  const { organization } = useOrganization();
  const { getToken } = useAuth(); // Fix #9: get Clerk token for WS auth
  const navigate = useNavigate();
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

  return (
    <>
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 md:p-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500 hidden sm:block">
              Welcome back, {user?.firstName} {user?.lastName}
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-6">
             {/* Connection Code Badge */}
             {studentProfile?.connectionCode && (
               <div className="flex items-center px-2 py-1 md:px-3 md:py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
                 <span className="hidden lg:inline text-[10px] font-bold text-blue-500 uppercase tracking-wider mr-2">Link Code</span>
                 <span className="text-xs md:text-sm font-black text-blue-700 tracking-widest select-all">{studentProfile.connectionCode}</span>
               </div>
             )}

             {/* Notification Bell */}
             <div className="relative">
               <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all relative"
               >
                 <Bell size={24} />
                 {unreadCount > 0 && (
                   <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                     {unreadCount}
                   </span>
                 )}
               </button>

               {showNotifications && (
                 <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                   <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                     <h3 className="font-bold text-gray-900">Notifications</h3>
                     <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                       <Check size={16} />
                     </button>
                   </div>
                   <div className="max-h-96 overflow-y-auto">
                     {notifications.length === 0 ? (
                       <div className="p-8 text-center">
                         <Bell className="mx-auto text-gray-200 mb-2" size={32} />
                         <p className="text-sm text-gray-500">No notifications yet</p>
                       </div>
                     ) : (
                       notifications.map((notif) => (
                         <div 
                          key={notif._id} 
                          className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 cursor-pointer ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                          onClick={() => {
                            if (!notif.isRead) markNotificationRead(notif._id);
                            if (notif.link) navigate(notif.link);
                          }}
                         >
                           <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!notif.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
                           <div className="flex-1">
                             <p className={`text-sm ${!notif.isRead ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                               {notif.message}
                             </p>
                             <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">
                               {format(new Date(notif.createdAt), 'MMM d, h:mm a')}
                             </p>
                           </div>
                         </div>
                       ))
                     )}
                   </div>
                 </div>
               )}
             </div>

             <div className="flex items-center gap-3">
               <div className="hidden lg:block text-right">
                 <p className="text-sm font-bold text-gray-900">{organization?.name || 'Education'}</p>
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Organization</p>
               </div>
               <UserButton afterSignOutUrl="/" />
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Overview Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4 text-gray-800">My Learning Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Enrolled</p>
                <p className="text-3xl font-black text-blue-900">{studentProfile?.enrolledCount || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Assignments</p>
                <p className="text-3xl font-black text-green-900">0</p>
              </div>
               <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <p className="text-xs text-purple-600 font-bold uppercase tracking-wider mb-1">Quizzes Passed</p>
                <p className="text-3xl font-black text-purple-900">{studentProfile?.passedQuizzesCount || 0}</p>
              </div>
            </div>
          </div>

          {/* Courses List */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800">My Courses</h2>
            {isLoadingCourses ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border-2 border-gray-100 border-dashed">
                <VideoIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">No courses available</h3>
                <p className="text-gray-500 mt-1 max-w-xs mx-auto">Check back soon! Your teachers are preparing new content for you.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div 
                    key={course._id} 
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col"
                    onClick={() => navigate(`/course/${course._id}`)}
                  >
                    <div className="h-44 bg-gray-100 relative overflow-hidden shrink-0">
                      {course.thumbnailUrl ? (
                         <img 
                          src={course.thumbnailUrl} 
                          alt={course.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <PlayCircle className="w-14 h-14 text-gray-200" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <span className="text-white text-xs font-bold uppercase tracking-widest">Start Learning →</span>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-gray-900 text-lg line-clamp-1 mb-2">{course.title}</h3>
                      <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed flex-1">
                        {course.description || "No description provided."}
                      </p>
                      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                         <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Course</span>
                         <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  </>
  );
};

export default StudentDashboard;
