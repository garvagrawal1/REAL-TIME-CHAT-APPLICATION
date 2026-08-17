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
  UserPlus,
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
}) => {
  if (!room) {
    return (
      <div className="h-16 px-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-slate-400">Select a channel or friend to begin</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onOpenFriends} icon={Users}>
            Friends
          </Button>
          <ConnectionStatus />
        </div>
      </div>
    );
  }

  const isDirectChat = room.isDirect || !!activeFriend;
  const displayName = activeFriend ? activeFriend.name : room.name;

  return (
    <div className="h-16 px-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center justify-between gap-2 select-none z-10">
      {/* Left info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isDirectChat
              ? 'bg-emerald-600/15 border border-emerald-500/30 text-emerald-400'
              : 'bg-indigo-600/15 border border-indigo-500/20 text-indigo-400'
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
          <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
            {isDirectChat ? '1-on-1 Direct Conversation' : room.description || 'Welcome to this channel!'}
          </p>
        </div>
      </div>

      {/* Right Actions & AI Controls */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <ConnectionStatus />

        {/* Video Call Trigger (If in DM or active friend) */}
        {isDirectChat && (
          <>
            <button
              onClick={() => onStartVideoCall(activeFriend)}
              className="p-2 rounded-xl text-emerald-400 hover:bg-emerald-950/40 border border-emerald-500/30 transition-colors"
              title="Start Video Call"
            >
              <Video className="w-4 h-4" />
            </button>

            <button
              onClick={() => onStartAudioCall(activeFriend)}
              className="p-2 rounded-xl text-indigo-400 hover:bg-indigo-950/40 border border-indigo-500/30 transition-colors"
              title="Start Audio Call"
            >
              <Phone className="w-4 h-4" />
            </button>

            <button
              onClick={() => onStartGame(activeFriend)}
              className="p-2 rounded-xl text-purple-400 hover:bg-purple-950/40 border border-purple-500/30 transition-colors"
              title="Play In-Chat Multiplayer Games"
            >
              <Gamepad2 className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Friends Hub button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenFriends}
          icon={Users}
          className="hidden sm:inline-flex !py-1.5 !px-3 text-xs"
        >
          Friends
        </Button>

        {/* AI Summarize Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenSummary}
          icon={Sparkles}
          className="hidden md:inline-flex !py-1.5 !px-3 text-xs border-indigo-500/30 text-indigo-300 hover:bg-indigo-950/40"
        >
          Summarize
        </Button>

        {/* AI Search Button */}
        <button
          onClick={onOpenSearch}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-700/60 transition-colors"
          title="Semantic AI Chat Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* AI Assistant Drawer Button */}
        <Button
          variant="ai"
          size="sm"
          onClick={onToggleAIAssistant}
          icon={Bot}
          className="!py-1.5 !px-3 text-xs"
        >
          <span className="hidden lg:inline">AI Assistant</span>
        </Button>
      </div>
    </div>
  );
};
