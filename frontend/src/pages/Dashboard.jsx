import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { RoomList } from '../components/rooms/RoomList';
import { OnlineUsers } from '../components/users/OnlineUsers';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import { SmartReplies } from '../components/ai/SmartReplies';
import { AIChatAssistant } from '../components/ai/AIChatAssistant';
import { AISummaryModal } from '../components/ai/AISummaryModal';
import { AISearchModal } from '../components/ai/AISearchModal';
import { CreateRoomModal } from '../components/rooms/CreateRoomModal';
import { FriendsModal } from '../components/friends/FriendsModal';
import { IncomingCallModal } from '../components/video/IncomingCallModal';
import { VideoCallModal } from '../components/video/VideoCallModal';
import { GameArenaModal } from '../components/games/GameArenaModal';
import { useChat } from '../hooks/useChat';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { roomService } from '../services/roomService';
import { Bot, Sparkles, MessageSquare, Users, Video, Gamepad2 } from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [activeFriend, setActiveFriend] = useState(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals & Panels
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  // WebRTC Video/Audio Call State
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [activeVideoCall, setActiveVideoCall] = useState(null); // { targetUser, isIncoming, signalData, callerSocketId, callType }

  // Game Arena State
  const [activeGameArena, setActiveGameArena] = useState(null); // { opponent, roomId }

  const { socket, roomOnlineCount, deleteMessage, addToast } = useSocket();

  // Load rooms
  const fetchRooms = useCallback(async () => {
    try {
      setIsLoadingRooms(true);
      const data = await roomService.getRooms();
      if (data.success && data.rooms) {
        setRooms(data.rooms);
        // Default to first room if none selected
        setActiveRoom((prev) => {
          if (prev) {
            const stillExists = data.rooms.find((r) => r._id === prev._id);
            return stillExists || data.rooms[0] || null;
          }
          return data.rooms[0] || null;
        });
      }
    } catch (err) {
      console.error('Failed to load chat rooms:', err);
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Active room chat hook
  const {
    messages,
    isLoading: isLoadingMessages,
    hasMore,
    isLoadingMore,
    loadMoreMessages,
    sendMessage,
  } = useChat(activeRoom?._id);

  // Real-time Global Listeners for Incoming Video Calls & Game Invites
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (callData) => {
      console.log('[WebRTC] Incoming call notification received:', callData);
      setIncomingCallData(callData);
    };

    const handleGameInvitation = (inviteData) => {
      addToast({
        type: 'message',
        title: '🎮 Game Invitation!',
        message: `${inviteData.challengerName} challenged you to ${inviteData.gameType.toUpperCase()}!`,
      });
      // Set active game arena
      setActiveGameArena({
        opponent: { _id: inviteData.challengerId, name: inviteData.challengerName, avatar: inviteData.challengerAvatar },
        roomId: inviteData.roomId || activeRoom?._id,
      });
    };

    socket.on('incomingCall', handleIncomingCall);
    socket.on('gameInvitation', handleGameInvitation);

    return () => {
      socket.off('incomingCall', handleIncomingCall);
      socket.off('gameInvitation', handleGameInvitation);
    };
  }, [socket, activeRoom, addToast]);

  const handleSelectRoom = (room) => {
    setActiveRoom(room);
    setActiveFriend(null);
    setIsSidebarOpen(false);
  };

  const handleOpenDM = (dmRoom, friend) => {
    setActiveRoom(dmRoom);
    setActiveFriend(friend);
    setIsSidebarOpen(false);
  };

  const handleRoomCreated = (newRoom) => {
    setRooms((prev) => [newRoom, ...prev]);
    setActiveRoom(newRoom);
    setActiveFriend(null);
  };

  const handleSelectSmartReply = (replyText) => {
    if (replyText) {
      sendMessage(replyText);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (activeRoom && messageId) {
      try {
        await deleteMessage(messageId, activeRoom._id);
      } catch (err) {
        console.error('Delete message error:', err);
      }
    }
  };

  // Video Call Triggers
  const handleStartVideoCall = (targetFriend, type = 'video') => {
    if (!targetFriend) return;
    setActiveVideoCall({
      targetUser: targetFriend,
      isIncoming: false,
      callType: type,
    });
  };

  const handleAcceptIncomingCall = () => {
    if (!incomingCallData) return;
    setActiveVideoCall({
      targetUser: {
        _id: incomingCallData.callerId,
        name: incomingCallData.callerName,
        username: incomingCallData.callerUsername,
        avatar: incomingCallData.callerAvatar,
      },
      isIncoming: true,
      incomingSignalData: incomingCallData.signal,
      callerSocketId: incomingCallData.fromSocketId,
      callType: incomingCallData.callType || 'video',
    });
    setIncomingCallData(null);
  };

  const handleRejectIncomingCall = () => {
    if (incomingCallData && incomingCallData.fromSocketId) {
      socket?.emit('rejectCall', {
        toSocketId: incomingCallData.fromSocketId,
        reason: 'Call declined',
      });
    }
    setIncomingCallData(null);
  };

  // Game Arena Trigger
  const handleStartGame = (opponent) => {
    const targetOpponent = opponent || activeFriend;
    if (!targetOpponent || !activeRoom) return;

    socket?.emit('inviteGame', {
      opponentId: targetOpponent._id,
      gameType: 'tictactoe',
      roomId: activeRoom._id,
    });

    setActiveGameArena({
      opponent: targetOpponent,
      roomId: activeRoom._id,
    });
  };

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  // Sidebar content
  const sidebarContent = (
    <>
      {/* Quick Friends & Discovery Button */}
      <button
        onClick={() => setShowFriendsModal(true)}
        className="w-full p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-750 hover:border-indigo-500/40 flex items-center justify-between transition-all group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-slate-200">Friends & Direct Chats</p>
            <p className="text-[10px] text-slate-500">Add friends, DMs & video calls</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
          HUB
        </span>
      </button>

      {/* Room list */}
      <RoomList
        rooms={rooms}
        activeRoomId={activeRoom?._id}
        onSelectRoom={handleSelectRoom}
        onOpenCreateModal={() => setShowCreateRoomModal(true)}
        isLoading={isLoadingRooms}
      />

      <OnlineUsers members={activeRoom?.members || []} />

      {/* AI Assistant Quick Trigger Banner in Sidebar */}
      <button
        onClick={() => setShowAIAssistant(true)}
        className="w-full p-3 rounded-xl bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-pink-900/30 border border-purple-500/30 hover:border-purple-500/60 flex items-center justify-between text-left transition-all duration-200 group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
              ChatFlow AI Assistant
            </p>
            <p className="text-[10px] text-slate-400">Ask coding & design queries</p>
          </div>
        </div>
        <Sparkles className="w-4 h-4 text-purple-400 group-hover:rotate-12 transition-transform" />
      </button>
    </>
  );

  return (
    <DashboardLayout
      sidebar={sidebarContent}
      isSidebarOpen={isSidebarOpen}
      setIsSidebarOpen={setIsSidebarOpen}
    >
      {/* Top Chat Channel / DM Header */}
      <ChatHeader
        room={activeRoom}
        activeFriend={activeFriend}
        onlineCount={roomOnlineCount}
        onOpenSummary={() => setShowSummaryModal(true)}
        onOpenSearch={() => setShowSearchModal(true)}
        onToggleAIAssistant={() => setShowAIAssistant((prev) => !prev)}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        onOpenFriends={() => setShowFriendsModal(true)}
        onStartVideoCall={(friend) => handleStartVideoCall(friend || activeFriend, 'video')}
        onStartAudioCall={(friend) => handleStartVideoCall(friend || activeFriend, 'audio')}
        onStartGame={handleStartGame}
      />

      {/* Main Messages Feed */}
      <MessageList
        messages={messages}
        isLoading={isLoadingMessages}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMoreMessages}
        onDeleteMessage={handleDeleteMessage}
        roomName={activeFriend ? activeFriend.name : activeRoom?.name || 'Channel'}
      />

      {/* Typing Indicator */}
      <TypingIndicator />

      {/* AI Smart Replies Suggestions Bar */}
      <SmartReplies
        roomId={activeRoom?._id}
        onSelectReply={handleSelectSmartReply}
        lastMessage={lastMessage}
      />

      {/* Message Composer Input */}
      <MessageInput
        roomId={activeRoom?._id}
        onSendMessage={sendMessage}
        disabled={!activeRoom}
      />

      {/* Modals & AI Drawers */}
      <FriendsModal
        isOpen={showFriendsModal}
        onClose={() => setShowFriendsModal(false)}
        onOpenDM={handleOpenDM}
        onStartVideoCall={(friend) => handleStartVideoCall(friend, 'video')}
        onStartGame={handleStartGame}
      />

      <CreateRoomModal
        isOpen={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
        onRoomCreated={handleRoomCreated}
      />

      <AISummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        roomId={activeRoom?._id}
        roomName={activeFriend ? activeFriend.name : activeRoom?.name || ''}
      />

      <AISearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        roomId={activeRoom?._id}
        currentRoomName={activeFriend ? activeFriend.name : activeRoom?.name}
      />

      <AIChatAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
      />

      {/* WebRTC Video Call & Incoming Call Modals */}
      {incomingCallData && (
        <IncomingCallModal
          callData={incomingCallData}
          onAccept={handleAcceptIncomingCall}
          onReject={handleRejectIncomingCall}
        />
      )}

      {activeVideoCall && (
        <VideoCallModal
          isOpen={true}
          onClose={() => setActiveVideoCall(null)}
          targetUser={activeVideoCall.targetUser}
          isIncoming={activeVideoCall.isIncoming}
          incomingSignalData={activeVideoCall.incomingSignalData}
          callerSocketId={activeVideoCall.callerSocketId}
          callType={activeVideoCall.callType || 'video'}
        />
      )}

      {/* In-Chat Multiplayer Game Arena */}
      {activeGameArena && (
        <GameArenaModal
          isOpen={true}
          onClose={() => setActiveGameArena(null)}
          roomId={activeGameArena.roomId}
          opponent={activeGameArena.opponent}
        />
      )}
    </DashboardLayout>
  );
};
