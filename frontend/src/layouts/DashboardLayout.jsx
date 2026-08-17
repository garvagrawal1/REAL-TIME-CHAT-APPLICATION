import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from '../components/common/Avatar';
import { ProfileModal } from '../components/users/ProfileModal';
import { NotificationToast } from '../components/chat/NotificationToast';
import { Sparkles, MessageSquare, LogOut, Settings, User } from 'lucide-react';

export const DashboardLayout = ({
  sidebar,
  children,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const { user, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 antialiased">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Responsive drawer on mobile, static on desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 sm:w-80 bg-slate-900/95 md:bg-slate-900 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 via-white to-purple-300 bg-clip-text text-transparent">
                ChatFlow AI
              </h1>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Real-Time & AI Core
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Content (Room List & Online Users) */}
        <div className="flex-1 flex flex-col overflow-y-auto p-3 space-y-4">
          {sidebar}
        </div>

        {/* User Mini Bar Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 relative">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2.5 min-w-0 p-1.5 rounded-xl hover:bg-slate-800 transition-colors flex-1 text-left"
            >
              <Avatar
                name={user?.name || 'User'}
                avatar={user?.avatar}
                size="sm"
                isOnline={true}
                showStatus={true}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-200 truncate">
                  {user?.name}
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  @{user?.username}
                </p>
              </div>
            </button>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat & Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-950 relative">
        {children}
      </main>

      {/* Modals & Global Toasts */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <NotificationToast />
    </div>
  );
};
