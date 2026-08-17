import React, { useState, useEffect } from 'react';
import { aiService } from '../../services/aiService';
import { Sparkles, Lightbulb, RefreshCw } from 'lucide-react';

export const SmartReplies = ({ roomId, onSelectReply, lastMessage }) => {
  const [replies, setReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const fetchReplies = async () => {
    if (!roomId) return;
    setIsLoading(true);
    try {
      const data = await aiService.smartReply(roomId);
      if (data.success && Array.isArray(data.replies)) {
        setReplies(data.replies);
        setIsVisible(true);
      }
    } catch (err) {
      console.warn('Smart replies fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch smart replies when a new message arrives from another user
  useEffect(() => {
    if (lastMessage) {
      fetchReplies();
    }
  }, [lastMessage?._id]);

  if (!isVisible || (replies.length === 0 && !isLoading)) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 overflow-x-auto no-scrollbar animate-fade-in border-t border-slate-800/40 bg-slate-950/40">
      <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 flex-shrink-0">
        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">Smart Reply:</span>
      </div>

      <div className="flex items-center gap-1.5 flex-1 overflow-x-auto py-0.5">
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic">
            <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
            <span>Generating suggestions...</span>
          </div>
        ) : (
          replies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => onSelectReply(reply)}
              className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full bg-slate-900 hover:bg-indigo-600/30 text-slate-300 hover:text-white border border-slate-700/80 hover:border-indigo-500/50 transition-all duration-150 active:scale-95 text-left"
            >
              {reply}
            </button>
          ))
        )}
      </div>

      <button
        onClick={fetchReplies}
        disabled={isLoading}
        title="Regenerate Smart Replies"
        className="text-slate-400 hover:text-indigo-400 p-1 rounded transition-colors flex-shrink-0"
      >
        <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};
