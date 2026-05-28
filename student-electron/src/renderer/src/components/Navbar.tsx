import { useUser, UserButton } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Search, Bell, Check } from 'lucide-react';
import { format } from 'date-fns';

interface NavbarProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  // Notifications props from dashboard
  notifications?: any[];
  showNotifications?: boolean;
  setShowNotifications?: (show: boolean) => void;
  unreadCount?: number;
  markNotificationRead?: (id: string) => void;
  // Student Profile for organization / link code
  organizationName?: string;
}

export default function Navbar({
  searchQuery = '',
  setSearchQuery,
  activeTab = 'Browse',
  setActiveTab,
  notifications = [],
  showNotifications = false,
  setShowNotifications,
  unreadCount = 0,
  markNotificationRead,
  organizationName
}: NavbarProps) {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine user's displayed first name
  const displayName = user?.firstName || user?.username || 'Student';

  // Handle keyboard submit in search input
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // If not on the dashboard, navigate home with search focus
    if (location.pathname !== '/') {
      navigate('/', { state: { searchQuery } });
    }
  };

  return (
    <header className="bg-white border-b border-gray-100 py-3.5 px-6 sticky top-0 z-40 w-full shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left Side: Browser Navigation & Tabs */}
        <div className="flex items-center gap-6 select-none">
          {/* History Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-all duration-200 text-gray-700 hover:text-gray-900 active:scale-90"
              title="Back"
            >
              <ArrowLeft size={20} className="stroke-[2.5]" />
            </button>
            <button
              onClick={() => navigate(1)}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-all duration-200 text-gray-700 hover:text-gray-900 active:scale-90"
              title="Forward"
            >
              <ArrowRight size={20} className="stroke-[2.5]" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {['Browse', 'Subject', 'History'].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    if (setActiveTab) {
                      setActiveTab(tab);
                    }
                    if (location.pathname !== '/') {
                      navigate('/', { state: { initialTab: tab } });
                    }
                  }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#5B86F5] text-white shadow-sm shadow-[#5B86F5]/25 hover:bg-[#4d78e7] active:scale-95'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Middle: Capsule Search Bar */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          {setSearchQuery ? (
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <div className="w-full bg-[#EEF2F6] rounded-xl flex items-center px-4 py-1.5 focus-within:ring-2 focus-within:ring-[#5B86F5]/20 focus-within:bg-white border border-transparent focus-within:border-gray-200 transition-all duration-200">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none w-full pr-10"
                />
                <button
                  type="submit"
                  className="absolute right-2.5 bg-[#5B86F5] text-white p-1.5 rounded-lg hover:bg-[#4d78e7] transition-all duration-200 active:scale-90 shadow-sm"
                >
                  <Search size={14} className="stroke-[2.5]" />
                </button>
              </div>
            </form>
          ) : (
            <div className="w-full bg-[#EEF2F6] rounded-xl flex items-center px-4 py-1.5 border border-transparent">
              <input
                type="text"
                placeholder="Search..."
                disabled
                className="bg-transparent text-sm text-gray-400 focus:outline-none w-full pr-10 cursor-not-allowed"
              />
              <div className="absolute right-2.5 bg-[#5B86F5]/50 text-white/80 p-1.5 rounded-lg cursor-not-allowed">
                <Search size={14} className="stroke-[2.5]" />
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Profile & Interactive Utilities */}
        <div className="flex items-center gap-4">


          {/* Notification Bell */}
          {setShowNotifications && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-500 hover:text-[#5B86F5] hover:bg-blue-50 rounded-full transition-all duration-200 relative active:scale-95"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full leading-none border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="mx-auto text-gray-200 mb-2" size={28} />
                        <p className="text-xs text-gray-500">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          className={`p-3.5 border-b border-gray-50 hover:bg-gray-50/50 transition-colors flex gap-2.5 cursor-pointer ${
                            !notif.isRead ? 'bg-blue-50/20' : ''
                          }`}
                          onClick={() => {
                            if (markNotificationRead && !notif.isRead) markNotificationRead(notif._id);
                            if (notif.link) navigate(notif.link);
                          }}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!notif.isRead ? 'bg-[#5B86F5]' : 'bg-transparent'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-normal ${!notif.isRead ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                              {notif.message}
                            </p>
                            <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-wider">
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
          )}

          {/* User Name & Profile Avatar */}
          <div className="flex items-center gap-3 pl-1 border-l border-gray-100">
            <div className="text-right select-none hidden sm:block">
              <span className="text-sm font-semibold text-gray-800 leading-none block">{displayName}</span>
              {organizationName && (
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 block">{organizationName}</span>
              )}
            </div>
            <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center border border-violet-200/50 shadow-inner overflow-hidden cursor-pointer hover:opacity-90 active:scale-95 transition-all">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'w-9 h-9 border border-transparent'
                  }
                }}
              />
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
