import { useUser, useOrganization, UserButton } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/api';
import { PlayCircle, Video as VideoIcon, Bell, Check } from 'lucide-react';
import { format } from 'date-fns';

const StudentDashboard = () => {
  const { user } = useUser();
  const { organization } = useOrganization();
  const navigate = useNavigate();
  const api = useApi();
  
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'linked' | 'unlinked'>('loading');
  const [parentCode, setParentCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [courses, setCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/student/profile');
        if (response.data.success && response.data.profile.isLinked) {
          setConnectionStatus('linked');
        } else {
          setConnectionStatus('unlinked');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setConnectionStatus('unlinked'); // Default to unlinked on error for now
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
      // toast.success("Connected to parent!");
      alert("Connected to parent successfully!");
    } catch (error: any) {
      console.error('Connection error:', error);
      // toast.error(error.response?.data?.message || "Failed to connect");
      alert(error.response?.data?.message || "Failed to connect");
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
          <div>
            <p className="text-sm font-medium text-gray-900">{organization?.name}</p>
            <p className="text-xs text-gray-500">Organization</p>
          </div>
          <UserButton />
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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back, {user?.firstName} {user?.lastName}
            </p>
          </div>
          <div className="text-right flex items-center gap-6">
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
                     <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                       {unreadCount} New
                     </span>
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
                           {!notif.isRead && (
                             <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationRead(notif._id);
                              }}
                              className="text-gray-300 hover:text-emerald-500 transition-colors"
                             >
                               <Check size={16} />
                             </button>
                           )}
                         </div>
                       ))
                     )}
                   </div>
                 </div>
               )}
             </div>

             <div className="flex items-center gap-4">
               <div className="hidden sm:block">
                 <p className="text-sm font-medium text-gray-900">{organization?.name}</p>
                 <p className="text-xs text-gray-500">Organization</p>
               </div>
               <UserButton />
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Recent Activity / Overview Card */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100 col-span-1 md:col-span-2 lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">My Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-600 font-medium">Courses Enrolled</p>
                <p className="text-2xl font-bold text-blue-900">0</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <p className="text-sm text-green-600 font-medium">Assignments Due</p>
                <p className="text-2xl font-bold text-green-900">0</p>
              </div>
               <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <p className="text-sm text-purple-600 font-medium">Completed Quizzes</p>
                <p className="text-2xl font-bold text-purple-900">0</p>
              </div>
            </div>
          </div>

          {/* Courses List */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100 col-span-1 md:col-span-3">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Available Courses</h2>
            {isLoadingCourses ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                <VideoIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No courses available yet</h3>
                <p className="text-gray-500 mt-1">Check back later when teachers publish new content.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div key={course._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/course/${course._id}`)}>
                    <div className="h-40 bg-gray-100 relative group overflow-hidden">
                      {course.thumbnailUrl ? (
                         <img 
                          src={course.thumbnailUrl} 
                          alt={course.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <PlayCircle className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-lg truncate">{course.title}</h3>
                      <p className="text-gray-500 text-sm line-clamp-2 mt-1">
                        {course.description || "No description provided."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
