import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../common/Button';
import { aiService } from '../../services/aiService';
import { copyToClipboard } from '../../utils/helpers';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  X,
  Trash2,
  HelpCircle,
  Code2,
  Flame,
} from 'lucide-react';

export const AIChatAssistant = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content:
        "Hello! I'm **ChatFlow AI Assistant** 🤖. Ask me any coding question, architecture design, debugging issue, or message drafting request. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const prompt = textToSend || input;
    if (!prompt.trim() || isLoading) return;

    const userMessage = { role: 'user', content: prompt.trim() };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInput('');
    setIsLoading(true);

    try {
      // Send conversation history to backend AI service
      const data = await aiService.chat(prompt.trim(), messages);
      if (data.success && data.reply) {
        setMessages((prev) => [...prev, { role: 'model', content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'model', content: "I'm sorry, I couldn't generate a response. Please try again." },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: `⚠️ Error: ${err.response?.data?.error || 'Failed to reach AI service. Please check your connection and try again.'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text, idx) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'model',
        content: "Chat cleared! What would you like to explore next?",
      },
    ]);
  };

  const quickPrompts = [
    { title: 'Explain Java HashMap', icon: Code2, prompt: 'Explain Java HashMap in simple language with code examples.' },
    { title: 'Deploy on Render & Vercel', icon: Flame, prompt: 'What are the steps to deploy an Express backend to Render and a React frontend to Vercel?' },
    { title: 'Socket.io Reconnection', icon: HelpCircle, prompt: 'How does Socket.io handle reconnection and multi-tab user presence?' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-900 border-l border-slate-700/80 shadow-2xl flex flex-col animate-slide-up sm:animate-fade-in backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>ChatFlow AI Assistant</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                PRO
              </span>
            </h3>
            <p className="text-xs text-slate-400">Intelligent full-stack assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            title="Clear Chat"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            title="Close Assistant"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => {
          const isAI = msg.role === 'model';
          return (
            <div
              key={index}
              className={`flex gap-3 ${isAI ? 'items-start' : 'items-end flex-row-reverse'}`}
            >
              {isAI ? (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white flex-shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 flex-shrink-0 mb-1 border border-slate-700">
                  <User className="w-4 h-4" />
                </div>
              )}

              <div
                className={`relative group max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isAI
                    ? 'bg-slate-950/80 border border-slate-800 text-slate-200'
                    : 'bg-indigo-600 text-white font-medium'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {isAI && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2 text-[10px] text-slate-400">
                    <button
                      onClick={() => handleCopy(msg.content, index)}
                      className="inline-flex items-center gap-1 hover:text-indigo-400 transition-colors"
                    >
                      {copiedIndex === index ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedIndex === index ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white flex-shrink-0 mt-1 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl flex items-center gap-2 text-xs text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick starter prompt pills */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/40 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Suggested Prompts
          </p>
          <div className="flex flex-col gap-1.5">
            {quickPrompts.map((qp, i) => {
              const Icon = qp.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleSend(qp.prompt)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-700/50 hover:border-indigo-500/40 text-left text-xs text-slate-300 hover:text-white transition-all duration-150"
                >
                  <Icon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span className="truncate">{qp.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Composer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI anything..."
            className="flex-1 bg-slate-900 border border-slate-750 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <Button
            type="submit"
            variant="ai"
            size="sm"
            isLoading={isLoading}
            disabled={!input.trim()}
            icon={Send}
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};
