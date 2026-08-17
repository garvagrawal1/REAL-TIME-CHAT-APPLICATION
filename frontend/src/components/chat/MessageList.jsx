import React, { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { Skeleton } from '../common/Skeleton';
import { formatDateDivider, isSameDay } from '../../utils/helpers';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { Sparkles, MessageSquareDashed, ArrowUpCircle, Loader2 } from 'lucide-react';

export const MessageList = ({
  messages = [],
  isLoading = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onDeleteMessage,
  roomName = 'Room',
}) => {
  const { user } = useAuth();
  const { onlineUsers } = useSocket();
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const prevMessagesLengthRef = useRef(messages.length);

  const currentUserId = user?._id || user?.id;

  // Auto-scroll to bottom on new messages (if user was already near bottom or initial load)
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  // Initial scroll to bottom on room load
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-center py-4">
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
        <div className="flex items-start gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-14 w-64 rounded-2xl" />
        </div>
        <div className="flex items-end justify-end gap-3">
          <Skeleton className="h-12 w-48 rounded-2xl" />
        </div>
        <div className="flex items-start gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-20 w-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 select-none">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
          <MessageSquareDashed className="w-7 h-7" />
        </div>
        <h4 className="text-base font-semibold text-slate-200">Welcome to #{roomName}!</h4>
        <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
          This is the beginning of the #{roomName} channel. Start the conversation, share code, or ask our AI assistant!
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-indigo-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time WebSocket & AI enabled</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 p-4 overflow-y-auto overflow-x-hidden space-y-1"
    >
      {/* Load More Button (Pagination) */}
      {hasMore && (
        <div className="flex justify-center my-2">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-slate-900/80 hover:bg-slate-900 border border-indigo-500/20 rounded-full transition-all duration-200 shadow-sm"
          >
            {isLoadingMore ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ArrowUpCircle className="w-3.5 h-3.5" />
            )}
            <span>{isLoadingMore ? 'Loading older messages...' : 'Load older messages'}</span>
          </button>
        </div>
      )}

      {/* Messages with Date Separators */}
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const showDateDivider =
          !prevMessage || !isSameDay(prevMessage.createdAt, message.createdAt);

        const senderId = message.sender?._id || message.sender;
        const isOwn = String(senderId) === String(currentUserId);
        const isOnline = onlineUsers.has(String(senderId));

        return (
          <React.Fragment key={message._id || `msg-${index}`}>
            {showDateDivider && (
              <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800/80"></div>
                </div>
                <div className="relative px-3 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {formatDateDivider(message.createdAt)}
                </div>
              </div>
            )}

            <MessageBubble
              message={message}
              isOwn={isOwn}
              isOnline={isOnline}
              onDelete={onDeleteMessage}
            />
          </React.Fragment>
        );
      })}

      <div ref={messagesEndRef} />
    </div>
  );
};
