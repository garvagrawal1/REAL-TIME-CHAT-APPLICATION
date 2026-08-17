import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '../common/Button';
import { ImproveMessageModal } from '../ai/ImproveMessageModal';
import { useSocket } from '../../hooks/useSocket';
import { Send, Sparkles, Wand2 } from 'lucide-react';

export const MessageInput = ({ roomId, onSendMessage, disabled = false }) => {
  const [content, setContent] = useState('');
  const [showImproveModal, setShowImproveModal] = useState(false);
  const { emitTyping, emitStopTyping } = useSocket();
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  const handleTyping = () => {
    if (!roomId) return;
    emitTyping(roomId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(roomId);
    }, 2000);
  };

  const handleSend = async () => {
    if (!content.trim() || disabled) return;

    const messageText = content.trim();
    setContent('');
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    emitStopTyping(roomId);

    try {
      await onSendMessage(messageText);
    } catch (err) {
      console.error('Failed to send message:', err);
      // Restore content on failure so user doesn't lose text
      setContent(messageText);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAcceptImproved = (newText) => {
    setContent(newText);
  };

  return (
    <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800">
      <div className="relative flex flex-col rounded-2xl bg-slate-900 border border-slate-750 focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all duration-200 shadow-inner">
        {/* Text Input Area */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
          disabled={disabled}
          className="w-full bg-transparent resize-none px-4 pt-3 pb-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none max-h-32 disabled:opacity-50"
        />

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-slate-800/40">
          <div className="flex items-center gap-1.5">
            {/* AI Improve Button */}
            <button
              type="button"
              onClick={() => setShowImproveModal(true)}
              disabled={!content.trim() || disabled}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-purple-300 hover:text-white bg-purple-950/30 hover:bg-purple-900/50 border border-purple-500/30 transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95"
              title="Enhance grammar and tone with AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>✨ Improve</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] text-slate-500">
              {content.length}/3000
            </span>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSend}
              disabled={!content.trim() || disabled}
              icon={Send}
              className="!rounded-xl"
            >
              Send
            </Button>
          </div>
        </div>
      </div>

      {/* Improve Message Modal */}
      <ImproveMessageModal
        isOpen={showImproveModal}
        onClose={() => setShowImproveModal(false)}
        originalText={content}
        onAccept={handleAcceptImproved}
      />
    </div>
  );
};
