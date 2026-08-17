import React from 'react';
import { Hash, MessageSquare, Cpu, Gamepad2, Sparkles } from 'lucide-react';

export const RoomItem = ({
  room,
  isActive = false,
  onClick,
  onlineMemberCount = 0,
}) => {
  const iconMap = {
    MessageSquare: MessageSquare,
    Cpu: Cpu,
    Gamepad2: Gamepad2,
    Sparkles: Sparkles,
  };

  const Icon = iconMap[room.icon] || Hash;

  return (
    <button
      onClick={() => onClick(room)}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 group cursor-pointer ${
        isActive
          ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/40 shadow-sm font-semibold'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
            isActive
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium truncate group-hover:text-slate-100">
            {room.name}
          </p>
          {room.description && (
            <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
              {room.description}
            </p>
          )}
        </div>
      </div>

      {onlineMemberCount > 0 && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
            isActive
              ? 'bg-indigo-500/30 text-indigo-300'
              : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
          }`}
        >
          {onlineMemberCount}
        </span>
      )}
    </button>
  );
};
