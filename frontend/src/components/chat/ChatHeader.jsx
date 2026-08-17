import React, { useState, useRef, useEffect } from 'react';
import { ConnectionStatus } from './ConnectionStatus';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import {
  Hash,
  Users,
  Sparkles,
  Search,
  Bot,
  Menu,
  Video,
  Phone,
  Gamepad2,
  Tv,
  PenTool,
  Zap,
  Monitor,
  MoreVertical,
  UserX,
  Trash2,
} from 'lucide-react';

export const ChatHeader = ({
  room,
  onlineCount = 0,
  activeFriend = null,
  onOpenSummary,
  onOpenSearch,
  onToggleAIAssistant,
  onToggleSidebar,
  onOpenFriends,
  onStartVideoCall,
  onStartAudioCall,
  onStartScreenShare,
  onStartGame,
  onOpenWatchParty,
  onOpenWhiteboard,
  onOpenCatchUp,
  onRemoveFriend,
}) => {
  const isDirectChat = room?.isDirect || !!activeFriend;
  const displayName = activeFriend ? activeFriend.name : room?.name || 'Select a Channel';

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-16 px-3 sm:px-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md flex items-center justify-between gap-2 select-none z-10">
      {/* Left channel/DM information */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors flex-shrink-0"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {activeFriend ? (
          <Avatar
            name={activeFriend.name}
            avatar={activeFriend.avatar}
            size="sm"
            isOnline={true}
            showStatus={true}
          />
        ) : (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isDirectChat
                ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400'
                : 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-400'
            }`}
          >
            {isDirectChat ? <Users className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-100 truncate">
              {displayName}
            </h2>
            {isDirectChat ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active</span>
              </span>
            ) : (
              <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>{onlineCount || 1} online</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate max-w-[150px] sm:max-w-xs md:max-w-md">
            {isDirectChat
              ? activeFriend?.username ? `@${activeFriend.username}` : 'Direct 1-on-1 Chat'
              : room?.description || 'Collaborative room'}
          </p>
        </div>
      </div>

      {/* Right WhatsApp-Style Action Icons Bar */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        <ConnectionStatus />

        {/* 📞 WhatsApp-style Audio Call */}
        <button
          onClick={() => onStartAudioCall && onStartAudioCall(activeFriend)}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-400 border border-slate-800 hover:border-emerald-500/40 transition-all duration-150 active:scale-95 group"
          title="Audio Call"
        >
          <Phone className="w-4 h-4" />
        </button>

        {/* 📹 WhatsApp-style Video Call */}
        <button
          onClick={() => onStartVideoCall && onStartVideoCall(activeFriend)}
          className="p-2.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 transition-all duration-150 active:scale-95 group shadow-sm shadow-emerald-950/40"
          title="Video Call"
        >
          <Video className="w-4 h-4" />
        </button>

        {/* 🖥️ Screen Share with Request Permission */}
        <button
          onClick={() => onStartScreenShare && onStartScreenShare(activeFriend)}
          className="p-2.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 transition-all duration-150 active:scale-95 group shadow-sm shadow-indigo-950/40"
          title="Share Screen (Sends Request)"
        >
          <Monitor className="w-4 h-4" />
        </button>

        {/* 🎮 Game Arena Duel (Tic-Tac-Toe, RPS, Trivia) */}
        <button
          onClick={() => onStartGame && onStartGame(activeFriend)}
          className="p-2.5 rounded-xl bg-purple-600/15 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 transition-all duration-150 active:scale-95 group shadow-sm shadow-purple-950/40"
          title="Play Games (Tic-Tac-Toe & RPS)"
        >
          <Gamepad2 className="w-4 h-4" />
        </button>

        {/* 🍿 Synchronized Watch Party */}
        <button
          onClick={onOpenWatchParty}
          className="p-2.5 rounded-xl bg-rose-600/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all duration-150 active:scale-95 group shadow-sm shadow-rose-950/40"
          title="Watch Party & Video Sync"
        >
          <Tv className="w-4 h-4" />
        </button>

        {/* 🎨 Collaborative Whiteboard */}
        <button
          onClick={onOpenWhiteboard}
          className="hidden sm:inline-flex p-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/40 transition-all active:scale-95"
          title="Live Collaborative Whiteboard"
        >
          <PenTool className="w-4 h-4" />
        </button>

        {/* 🤖 AI Assistant */}
        <button
          onClick={onToggleAIAssistant}
          className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 hover:from-indigo-600 hover:to-purple-600 text-purple-300 hover:text-white border border-purple-500/30 transition-all duration-150 active:scale-95 shadow-sm"
          title="ChatFlow AI Assistant"
        >
          <Bot className="w-4 h-4" />
        </button>

        {/* More Options Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl bg-slate-900/95 border border-slate-750 shadow-2xl p-1.5 backdrop-blur-xl z-50 space-y-1 animate-scale-in">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenSummary && onOpenSummary();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-indigo-600/20 transition-colors text-left"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>AI Summarize Chat</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenSearch && onOpenSearch();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-indigo-600/20 transition-colors text-left"
              >
                <Search className="w-4 h-4 text-indigo-400" />
                <span>Search Messages</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenCatchUp && onOpenCatchUp();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-amber-500/20 transition-colors text-left"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>AI Catch-Up Brief</span>
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenFriends && onOpenFriends();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left"
              >
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Friends Hub</span>
              </button>

              {activeFriend && (
                <>
                  <div className="border-t border-slate-800 my-1"></div>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onRemoveFriend && onRemoveFriend(activeFriend);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 transition-colors text-left"
                  >
                    <UserX className="w-4 h-4 text-rose-400" />
                    <span>Remove Friend</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
