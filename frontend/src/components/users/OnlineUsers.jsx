import React, { useState } from 'react';
import { Avatar } from '../common/Avatar';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { Users, ChevronDown, ChevronUp, MessageSquare, Sparkles } from 'lucide-react';

export const OnlineUsers = ({
  members = [],
  onSelectUser,
  isCollapsedDefault = false,
}) => {
  const { onlineUsers } = useSocket();
  const { user: currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(!isCollapsedDefault);

  // Filter out current logged in user from direct click if needed or indicate (You)
  const currentUserId = String(currentUser?._id || currentUser?.id || '');

  // Group members into online vs offline
  const onlineList = members.filter((m) => {
    const mId = String(m._id || m.id || m);
    return onlineUsers.has(mId);
  });

  const offlineList = members.filter((m) => {
    const mId = String(m._id || m.id || m);
    return !onlineUsers.has(mId);
  });

  const handleUserClick = (targetUser) => {
    const targetId = String(targetUser._id || targetUser.id);
    if (targetId === currentUserId) return;
    if (onSelectUser) {
      onSelectUser(targetUser);
    }
  };

  return (
    <div className="border-t border-slate-800/80 pt-2 select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2 py-1.5 text-slate-400 hover:text-slate-200 transition-colors"
      >
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span>Members ({members.length})</span>
          <span className="text-emerald-400 font-semibold">• {onlineList.length} online</span>
        </div>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="mt-1 space-y-1 max-h-56 overflow-y-auto pr-1">
          {/* Online Section */}
          {onlineList.map((mUser) => {
            const isMe = String(mUser._id || mUser.id) === currentUserId;
            return (
              <button
                key={mUser._id || mUser.id}
                onClick={() => !isMe && handleUserClick(mUser)}
                disabled={isMe}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-all group ${
                  isMe
                    ? 'bg-slate-900/30 opacity-75 cursor-default'
                    : 'hover:bg-indigo-950/40 hover:border-indigo-500/30 border border-transparent cursor-pointer'
                }`}
                title={isMe ? 'You' : `Tap to chat with ${mUser.name}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    name={mUser.name}
                    avatar={mUser.avatar}
                    size="xs"
                    isOnline={true}
                    showStatus={true}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                      {mUser.name} {isMe && <span className="text-[10px] text-slate-500 font-normal">(You)</span>}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-mono truncate flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>online</span>
                    </p>
                  </div>
                </div>

                {!isMe && (
                  <div className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-indigo-600/20 text-indigo-300 transition-opacity">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}

          {/* Offline Section */}
          {offlineList.map((mUser) => {
            const isMe = String(mUser._id || mUser.id) === currentUserId;
            return (
              <button
                key={mUser._id || mUser.id}
                onClick={() => !isMe && handleUserClick(mUser)}
                disabled={isMe}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-all group ${
                  isMe
                    ? 'bg-slate-900/20 opacity-50 cursor-default'
                    : 'hover:bg-slate-900/50 hover:border-slate-700/40 border border-transparent cursor-pointer opacity-70 hover:opacity-100'
                }`}
                title={isMe ? 'You' : `Tap to chat with ${mUser.name}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    name={mUser.name}
                    avatar={mUser.avatar}
                    size="xs"
                    isOnline={false}
                    showStatus={true}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-300 truncate">
                      {mUser.name} {isMe && <span className="text-[10px] text-slate-500 font-normal">(You)</span>}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      offline
                    </p>
                  </div>
                </div>

                {!isMe && (
                  <div className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-slate-800 text-slate-300 transition-opacity">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}

          {members.length === 0 && (
            <div className="py-3 text-center text-[11px] text-slate-500">
              No members listed
            </div>
          )}
        </div>
      )}
    </div>
  );
};
