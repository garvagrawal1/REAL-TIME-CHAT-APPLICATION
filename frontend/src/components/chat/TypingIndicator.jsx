import React from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { formatTypingText } from '../../utils/helpers';

export const TypingIndicator = () => {
  const { typingUsers } = useSocket();
  const { user } = useAuth();

  const currentUserId = user?._id || user?.id;
  const typingText = formatTypingText(typingUsers, currentUserId);

  if (!typingText) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-indigo-400 animate-fade-in">
      <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-full border border-indigo-500/20 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 typing-dot-1"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 typing-dot-2"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 typing-dot-3"></span>
      </div>
      <span className="font-medium text-slate-300 italic">{typingText}</span>
    </div>
  );
};
