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
import { ScreenShareRequestModal } from '../components/video/ScreenShareRequestModal';
import { GameArenaModal } from '../components/games/GameArenaModal';
import { WatchPartyModal } from '../components/theater/WatchPartyModal';
import { WhiteboardModal } from '../components/whiteboard/WhiteboardModal';
import { CatchUpModal } from '../components/ai/CatchUpModal';
import { useChat } from '../hooks/useChat';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { roomService } from '../services/roomService';
import { friendService } from '../services/friendService';
import {
  Bot,
  Sparkles,
  MessageSquare,
  Users,
  Video,
  Gamepad2,
  Tv,
  PenTool,
  Zap,
} from 'lucide-react';

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

  // Superpowers: Watch Party, Whiteboard & Catch Up
  const [showWatchPartyModal, setShowWatchPartyModal] = useState(false);
  const [showWhiteboardModal, setShowWhiteboardModal] = useState(false);
  const [showCatchUpModal, setShowCatchUpModal] = useState(false);

  // WebRTC Video/Audio Call State
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [activeVideoCall, setActiveVideoCall] = useState(null);

  // Screen Share Permission Request State
  const [incomingScreenShareData, setIncomingScreenShareData] = useState(null);

  // Game Arena State: { opponent, roomId, isChallenger, mySymbol }
  const [activeGameArena, setActiveGameArena] = useState(null);

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

  // Real-time Global Listeners for Calls, Games, Screen Share, and Watch Party
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (callData) => {
      console.log('[WebRTC] Incoming call notification received:', callData);
      setIncomingCallData(callData);
    };

    const handleIncomingScreenShare = (reqData) => {
      console.log('[ScreenShare] Incoming screen share request:', reqData);
      setIncomingScreenShareData(reqData);
    };

    const handleScreenShareResponse = (resData) => {
      if (resData.accepted) {
        addToast({
          type: 'info',
          title: '🖥️ Screen Share Accepted',
          message: `${resData.responderName || 'Friend'} accepted your screen share request!`,
        });
        if (activeFriend) {
          handleStartVideoCall(activeFriend, 'video');
        }
      } else {
        addToast({
          type: 'info',
          title: 'Screen Share Declined',
          message: `${resData.responderName || 'User'} declined the screen share.`,
        });
      }
    };

    const handleGameInvitation = (inviteData) => {
      addToast({
        type: 'message',
        title: '🎮 Game Invitation!',
        message: `${inviteData.challengerName} challenged you to ${inviteData.gameType.toUpperCase()}! You are Circle (O).`,
      });
      setActiveGameArena({
        opponent: {
          _id: inviteData.challengerId,
          name: inviteData.challengerName,
          avatar: inviteData.challengerAvatar,
        },
        roomId: inviteData.roomId || activeRoom?._id,
        isChallenger: false,
        assignedSymbol: 'O',
      });
    };

    const handleWatchPartyNotice = (wpData) => {
      if (wpData.action === 'CHANGE_VIDEO') {
        addToast({
          type: 'info',
          title: '🎬 Watch Party Started',
          message: `${wpData.updatedBy} loaded a video for everyone! Click Stream/Watch Party to join.`,
        });
      }
    };

    const handleFriendRemoved = ({ removedByName }) => {
      addToast({
        type: 'info',
        title: '👥 Friend List Updated',
        message: `${removedByName || 'A user'} removed friendship.`,
      });
      fetchRooms();
    };

    socket.on('incomingCall', handleIncomingCall);
    socket.on('incomingScreenShareRequest', handleIncomingScreenShare);
    socket.on('screenShareResponse', handleScreenShareResponse);
    socket.on('gameInvitation', handleGameInvitation);
    socket.on('watchPartyUpdate', handleWatchPartyNotice);
    socket.on('friendRemoved', handleFriendRemoved);

    return () => {
      socket.off('incomingCall', handleIncomingCall);
      socket.off('incomingScreenShareRequest', handleIncomingScreenShare);
      socket.off('screenShareResponse', handleScreenShareResponse);
      socket.off('gameInvitation', handleGameInvitation);
      socket.off('watchPartyUpdate', handleWatchPartyNotice);
      socket.off('friendRemoved', handleFriendRemoved);
    };
  }, [socket, activeRoom, activeFriend, addToast, fetchRooms]);

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

  // Direct Click on an Online/Offline user to open chat
  const handleOpenDirectChatWithUser = async (targetUser) => {
    try {
      const targetId = targetUser._id || targetUser.id;
      const data = await friendService.getOrCreateDM(targetId);
      if (data.success && data.room) {
        handleOpenDM(data.room, data.friend || targetUser);
      }
    } catch (err) {
      console.error('Failed to open DM with user:', err);
      addToast({ type: 'info', message: 'Could not open chat with this user' });
    }
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
    if (!targetFriend) {
      setShowFriendsModal(true);
      addToast({
        type: 'info',
        title: 'Choose a Friend to Call',
        message: 'Select any friend or online contact to start a call!',
      });
      return;
    }
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

  // Screen Share Permission Flow
  const handleRequestScreenShare = (targetFriend) => {
    const friendToCall = targetFriend || activeFriend;
    if (!friendToCall) {
      setShowFriendsModal(true);
      addToast({
        type: 'info',
        title: 'Select a Friend',
        message: 'Please select a friend or direct chat to share your screen with.',
      });
      return;
    }

    socket?.emit('requestScreenShare', {
      targetUserId: friendToCall._id,
      roomId: activeRoom?._id,
    });

    addToast({
      type: 'info',
      title: '🖥️ Screen Share Request Sent',
      message: `Waiting for ${friendToCall.name} to accept your screen share...`,
    });
  };

  const handleAcceptScreenShareRequest = () => {
    if (!incomingScreenShareData) return;

    socket?.emit('respondScreenShare', {
      toSocketId: incomingScreenShareData.fromSocketId,
      targetUserId: incomingScreenShareData.fromUserId,
      accepted: true,
    });

    setActiveVideoCall({
      targetUser: {
        _id: incomingScreenShareData.fromUserId,
        name: incomingScreenShareData.fromName,
        avatar: incomingScreenShareData.fromAvatar,
      },
      isIncoming: true,
      callerSocketId: incomingScreenShareData.fromSocketId,
      callType: 'video',
    });

    setIncomingScreenShareData(null);
  };

  const handleDeclineScreenShareRequest = () => {
    if (!incomingScreenShareData) return;

    socket?.emit('respondScreenShare', {
      toSocketId: incomingScreenShareData.fromSocketId,
      targetUserId: incomingScreenShareData.fromUserId,
      accepted: false,
      reason: 'Declined by user',
    });

    setIncomingScreenShareData(null);
  };

  // Game Arena Trigger: Player 1 gets 'X' and initial turn
  const handleStartGame = (opponent) => {
    const targetOpponent = opponent || activeFriend;
    if (!targetOpponent || !activeRoom) {
      setShowFriendsModal(true);
      addToast({
        type: 'info',
        title: 'Choose an Opponent',
        message: 'Open a chat with a friend or choose from the list to challenge them!',
      });
      return;
    }

    socket?.emit('inviteGame', {
      opponentId: targetOpponent._id,
      gameType: 'tictactoe',
      roomId: activeRoom._id,
    });

    setActiveGameArena({
      opponent: targetOpponent,
      roomId: activeRoom._id,
      isChallenger: true,
      assignedSymbol: 'X',
    });
  };

  // Remove friend handler from ChatHeader
  const handleRemoveFriendFromChat = async (friend) => {
    if (!friend) return;
    if (!window.confirm(`Are you sure you want to remove ${friend.name} from your friends list?`)) {
      return;
    }
    try {
      const data = await friendService.removeFriend(friend._id);
      if (data.success) {
        addToast({ type: 'info', message: `Removed ${friend.name} from friends.` });
        socket?.emit('friendRemoved', { targetUserId: friend._id });
        setActiveFriend(null);
        fetchRooms();
      }
    } catch (err) {
      addToast({ type: 'info', message: 'Failed to remove friend' });
    }
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

      {/* Quick Superpower Actions Bar */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setShowWatchPartyModal(true)}
          className="p-2 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 border border-rose-500/30 flex items-center gap-2 text-left transition-all"
        >
          <Tv className="w-4 h-4 text-rose-400" />
          <div>
            <p className="text-[11px] font-bold text-rose-200">Watch Party</p>
            <p className="text-[9px] text-rose-400/80">Video Sync</p>
          </div>
        </button>

        <button
          onClick={() => setShowWhiteboardModal(true)}
          className="p-2 rounded-xl bg-indigo-950/30 hover:bg-indigo-950/60 border border-indigo-500/30 flex items-center gap-2 text-left transition-all"
        >
          <PenTool className="w-4 h-4 text-indigo-400" />
          <div>
            <p className="text-[11px] font-bold text-indigo-200">Whiteboard</p>
            <p className="text-[9px] text-indigo-400/80">Live Draw</p>
          </div>
        </button>
      </div>

      {/* Room list */}
      <RoomList
        rooms={rooms}
        activeRoomId={activeRoom?._id}
        onSelectRoom={handleSelectRoom}
        onOpenCreateModal={() => setShowCreateRoomModal(true)}
        isLoading={isLoadingRooms}
      />

      {/* Online & Community Members with Tap to Chat */}
      <OnlineUsers
        members={activeRoom?.members || []}
        onSelectUser={handleOpenDirectChatWithUser}
      />

      {/* AI Assistant Trigger Banner */}
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
      {/* Top Chat Channel / DM Header with WhatsApp-style icons */}
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
        onStartScreenShare={handleRequestScreenShare}
        onStartGame={handleStartGame}
        onOpenWatchParty={() => setShowWatchPartyModal(true)}
        onOpenWhiteboard={() => setShowWhiteboardModal(true)}
        onOpenCatchUp={() => setShowCatchUpModal(true)}
        onRemoveFriend={handleRemoveFriendFromChat}
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

      {/* Modals & Superpowers */}
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

      {/* 🎬 Synchronized Watch Party & 120 FPS Stream Theater */}
      <WatchPartyModal
        isOpen={showWatchPartyModal}
        onClose={() => setShowWatchPartyModal(false)}
        roomId={activeRoom?._id}
        roomName={activeFriend ? activeFriend.name : activeRoom?.name || 'Channel'}
      />

      {/* 🎨 Collaborative Real-Time Whiteboard */}
      <WhiteboardModal
        isOpen={showWhiteboardModal}
        onClose={() => setShowWhiteboardModal(false)}
        roomId={activeRoom?._id}
        roomName={activeFriend ? activeFriend.name : activeRoom?.name || 'Channel'}
      />

      {/* ⚡ Instant Time-Travel Catch Up Brief */}
      <CatchUpModal
        isOpen={showCatchUpModal}
        onClose={() => setShowCatchUpModal(false)}
        roomId={activeRoom?._id}
        roomName={activeFriend ? activeFriend.name : activeRoom?.name || 'Channel'}
      />

      {/* WebRTC Video Call & Incoming Call Modals */}
      {incomingCallData && (
        <IncomingCallModal
          callData={incomingCallData}
          onAccept={handleAcceptIncomingCall}
          onReject={handleRejectIncomingCall}
        />
      )}

      {/* Screen Sharing Permission Prompt Modal */}
      {incomingScreenShareData && (
        <ScreenShareRequestModal
          requestData={incomingScreenShareData}
          onAccept={handleAcceptScreenShareRequest}
          onDecline={handleDeclineScreenShareRequest}
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

      {/* In-Chat Multiplayer Game Arena (Tic-Tac-Toe 'X' and 'O', RPS, Trivia) */}
      {activeGameArena && (
        <GameArenaModal
          isOpen={true}
          onClose={() => setActiveGameArena(null)}
          roomId={activeGameArena.roomId}
          opponent={activeGameArena.opponent}
          isChallenger={activeGameArena.isChallenger}
          assignedSymbol={activeGameArena.assignedSymbol}
        />
      )}
    </DashboardLayout>
  );
};
