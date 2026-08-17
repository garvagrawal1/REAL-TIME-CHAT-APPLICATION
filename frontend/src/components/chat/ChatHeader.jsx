import React from 'react';
import { ConnectionStatus } from './ConnectionStatus';
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
  onStartGame,
  onOpenWatchParty,
  onOpenWhiteboard,
  onOpenCatchUp,
}) => {
  const isDirectChat = room?.isDirect || !!activeFriend;
  const displayName = activeFriend ? activeFriend.name : room?.name || 'Select a Channel';

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

        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isDirectChat
              ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400'
              : 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-400'
          }`}
        >
          {isDirectChat ? <Users className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-100 truncate">
              {displayName}
            </h2>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>{onlineCount || 1} online</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 truncate max-w-[150px] sm:max-w-xs md:max-w-md">
            {isDirectChat
              ? 'Direct 1-on-1 Conversation'
              : room?.description || 'Collaborative real-time room'}
          </p>
        </div>
      </div>

      {/* Right Top Action Bar (Always Visible & Accessible) */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <ConnectionStatus />

        {/* 🎬 120 FPS Live Stream & Watch Party Button */}
        <button
          onClick={onOpenWatchParty}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-md shadow-rose-600/25 transition-all duration-150 active:scale-95 group font-bold text-xs"
          title="Watch Party & 120 FPS Screen Share"
        >
          <Tv className="w-4 h-4 animate-pulse" />
          <span>Stream</span>
        </button>

        {/* 🎥 Video Call Button (Direct or Hub) */}
        <button
          onClick={() => onStartVideoCall(activeFriend)}
          className="p-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 transition-all active:scale-95"
          title="Start 1-on-1 Video Call"
        >
          <Video className="w-4 h-4" />
        </button>

        {/* 📞 Audio Call Button */}
        <button
          onClick={() => onStartAudioCall(activeFriend)}
          className="hidden xs:inline-flex p-2 rounded-xl bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 transition-all active:scale-95"
          title="Start Audio Call"
        >
          <Phone className="w-4 h-4" />
        </button>

        {/* 🎨 Collaborative Whiteboard Button */}
        <button
          onClick={onOpenWhiteboard}
          className="p-2 rounded-xl bg-slate-900 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 border border-slate-750 hover:border-indigo-500/40 transition-all active:scale-95"
          title="Collaborative Live Whiteboard"
        >
          <PenTool className="w-4 h-4" />
        </button>

        {/* ⚡ Catch Me Up Button */}
        <button
          onClick={onOpenCatchUp}
          className="hidden sm:inline-flex p-2 rounded-xl bg-slate-900 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-slate-750 hover:border-amber-500/40 transition-all active:scale-95"
          title="Instant AI Catch Me Up Brief"
        >
          <Zap className="w-4 h-4" />
        </button>

        {/* 👥 Friends Hub Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenFriends}
          icon={Users}
          className="hidden md:inline-flex !py-1.5 !px-3 text-xs"
        >
          Friends
        </Button>

        {/* ✨ AI Summarize Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenSummary}
          icon={Sparkles}
          className="hidden lg:inline-flex !py-1.5 !px-3 text-xs border-indigo-500/30 text-indigo-300 hover:bg-indigo-950/40"
        >
          Summarize
        </Button>

        {/* 🔍 AI Search Button */}
        <button
          onClick={onOpenSearch}
          className="hidden sm:inline-flex p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-700/60 transition-colors"
          title="Semantic AI Chat Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* 🤖 AI Assistant Drawer Button */}
        <Button
          variant="ai"
          size="sm"
          onClick={onToggleAIAssistant}
          icon={Bot}
          className="!py-1.5 !px-2.5 sm:!px-3 text-xs"
        >
          <span className="hidden sm:inline">AI</span>
        </Button>
      </div>
    </div>
  );
};
