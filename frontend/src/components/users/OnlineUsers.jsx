import React, { useState } from 'react';
import { Avatar } from '../common/Avatar';
import { useSocket } from '../../hooks/useSocket';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';

export const OnlineUsers = ({ members = [], isCollapsedDefault = false }) => {
  const { onlineUsers } = useSocket();
  const [isOpen, setIsOpen] = useState(!isCollapsedDefault);

  // Group members into online vs offline
  const onlineList = members.filter((m) => onlineUsers.has(m._id || m.id));
  const offlineList = members.filter((m) => !onlineUsers.has(m._id || m.id));

  return (
    <div className="border-t border-slate-800/80 pt-2 select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2 py-1.5 text-slate-400 hover:text-slate-200 transition-colors"
      >
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span>Community ({members.length})</span>
          <span className="text-emerald-400 font-semibold">• {onlineList.length} online</span>
        </div>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="mt-1 space-y-1 max-h-48 overflow-y-auto pr-1">
          {/* Online Section */}
          {onlineList.map((user) => (
            <div
              key={user._id || user.id}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-900/60 transition-colors text-left"
            >
              <Avatar
                name={user.name}
                avatar={user.avatar}
                size="xs"
                isOnline={true}
                showStatus={true}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-200 truncate">
                  {user.name}
                </p>
                <p className="text-[10px] text-emerald-400 truncate">
                  online
                </p>
              </div>
            </div>
          ))}

          {/* Offline Section */}
          {offlineList.map((user) => (
            <div
              key={user._id || user.id}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-900/40 opacity-60 transition-colors text-left"
            >
              <Avatar
                name={user.name}
                avatar={user.avatar}
                size="xs"
                isOnline={false}
                showStatus={true}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-300 truncate">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  offline
                </p>
              </div>
            </div>
          ))}

          {members.length === 0 && (
            <div className="py-2 text-center text-[11px] text-slate-500">
              No members listed
            </div>
          )}
        </div>
      )}
    </div>
  );
};
