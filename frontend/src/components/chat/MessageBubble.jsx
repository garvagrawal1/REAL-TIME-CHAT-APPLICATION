import React, { useState } from 'react';
import { Avatar } from '../common/Avatar';
import { formatMessageTime, copyToClipboard } from '../../utils/helpers';
import { aiService } from '../../services/aiService';
import {
  MoreVertical,
  Languages,
  Smile,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Loader2,
} from 'lucide-react';

export const MessageBubble = ({
  message,
  isOwn = false,
  onDelete,
  isOnline = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [translatedText, setTranslatedText] = useState(null);
  const [translatedLang, setTranslatedLang] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [sentiment, setSentiment] = useState(message.sentiment !== 'unknown' ? message.sentiment : null);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);

  const sender = message.sender || {};
  const senderName = sender.name || sender.username || 'User';

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShowMenu(false);
  };

  const handleTranslate = async (language) => {
    setIsTranslating(true);
    setShowMenu(false);
    try {
      const data = await aiService.translate(message.content, language, message._id);
      if (data.success && data.translated) {
        setTranslatedText(data.translated);
        setTranslatedLang(language);
      }
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSentiment = async () => {
    setIsAnalyzingSentiment(true);
    setShowMenu(false);
    try {
      const data = await aiService.sentiment(message.content, message._id);
      if (data.success && data.sentiment) {
        setSentiment(data.sentiment);
      }
    } catch (err) {
      console.error('Sentiment error:', err);
    } finally {
      setIsAnalyzingSentiment(false);
    }
  };

  const sentimentBadges = {
    positive: { emoji: '😊', label: 'Positive', class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    neutral: { emoji: '😐', label: 'Neutral', class: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
    negative: { emoji: '😟', label: 'Negative', class: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  };

  return (
    <div
      className={`group relative flex gap-3 my-2.5 px-2 transition-all ${
        isOwn ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar (For other user's message) */}
      {!isOwn && (
        <Avatar
          name={senderName}
          avatar={sender.avatar}
          size="sm"
          isOnline={isOnline}
          showStatus={true}
        />
      )}

      {/* Message Content Container */}
      <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender Name & Time */}
        <div className={`flex items-center gap-2 mb-1 px-1 text-xs ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          {!isOwn && (
            <span className="font-semibold text-slate-200">{senderName}</span>
          )}
          <span className="text-[11px] text-slate-400">
            {formatMessageTime(message.createdAt)}
          </span>
          {sentiment && sentimentBadges[sentiment] && (
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-medium rounded-md border ${sentimentBadges[sentiment].class}`}
              title={`AI Sentiment: ${sentimentBadges[sentiment].label}`}
            >
              <span>{sentimentBadges[sentiment].emoji}</span>
              <span className="hidden sm:inline">{sentimentBadges[sentiment].label}</span>
            </span>
          )}
        </div>

        {/* Message Bubble Box */}
        <div className="relative group/bubble">
          <div
            className={`relative rounded-2xl px-4 py-2.5 text-sm shadow-sm break-words whitespace-pre-wrap leading-relaxed ${
              isOwn
                ? 'bg-indigo-600 text-white rounded-tr-xs'
                : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-tl-xs'
            }`}
          >
            {message.content}

            {/* Translation Output */}
            {isTranslating && (
              <div className="mt-2 pt-2 border-t border-indigo-400/30 flex items-center gap-1.5 text-xs italic text-indigo-200">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Translating with AI...</span>
              </div>
            )}

            {translatedText && (
              <div className="mt-2 pt-2 border-t border-indigo-400/30 text-xs text-indigo-100 bg-indigo-950/40 p-2 rounded-lg">
                <div className="flex items-center justify-between text-[11px] font-medium text-indigo-300 mb-1">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    Translated ({translatedLang})
                  </span>
                  <button
                    onClick={() => setTranslatedText(null)}
                    className="hover:underline text-[10px] text-slate-400 hover:text-white"
                  >
                    Hide
                  </button>
                </div>
                <p>{translatedText}</p>
              </div>
            )}
          </div>

          {/* Action Menu Trigger (Hoverable) */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-150 flex items-center ${
              isOwn ? '-left-10' : '-right-10'
            }`}
          >
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700 shadow-sm"
                title="Message Actions"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {/* Action Dropdown */}
              {showMenu && (
                <div
                  className={`absolute z-30 bottom-full mb-1 w-44 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl p-1.5 text-xs text-slate-200 animate-fade-in ${
                    isOwn ? 'right-0' : 'left-0'
                  }`}
                >
                  <button
                    onClick={handleCopy}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                  </button>

                  <button
                    onClick={handleSentiment}
                    disabled={isAnalyzingSentiment}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left transition-colors"
                  >
                    <Smile className="w-3.5 h-3.5 text-amber-400" />
                    <span>Analyze Sentiment</span>
                  </button>

                  <div className="my-1 border-t border-slate-800"></div>

                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Languages className="w-3 h-3 text-indigo-400" /> Translate
                  </div>

                  {['Hindi', 'Hinglish', 'Spanish', 'French', 'German', 'English'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleTranslate(lang)}
                      className="w-full flex items-center justify-between px-2.5 py-1 rounded-md hover:bg-indigo-600/30 text-left text-slate-300 hover:text-white transition-colors"
                    >
                      <span>{lang}</span>
                    </button>
                  ))}

                  {isOwn && onDelete && (
                    <>
                      <div className="my-1 border-t border-slate-800"></div>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDelete(message._id);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-900/30 text-rose-400 hover:text-rose-300 text-left transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Message</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
