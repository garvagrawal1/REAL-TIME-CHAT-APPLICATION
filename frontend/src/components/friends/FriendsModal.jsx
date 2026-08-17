import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Avatar } from '../common/Avatar';
import { friendService } from '../../services/friendService';
import { useSocket } from '../../hooks/useSocket';
import {
  Users,
  UserPlus,
  UserCheck,
  Search,
  MessageSquare,
  Video,
  Gamepad2,
  Check,
  X,
  Clock,
  Loader2,
  Sparkles,
} from 'lucide-react';

export const FriendsModal = ({
  isOpen,
  onClose,
  onOpenDM,
  onStartVideoCall,
  onStartGame,
}) => {
  const [activeTab, setActiveTab] = useState('online'); // 'online' | 'all' | 'pending' | 'add'
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const { onlineUsers, socket, addToast } = useSocket();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [friendsData, requestsData] = await Promise.all([
        friendService.getFriends(),
        friendService.getFriendRequests(),
      ]);

      if (friendsData.success) {
        setFriends(friendsData.friends || []);
      }
      if (requestsData.success) {
        setIncomingRequests(requestsData.incoming || []);
        setOutgoingRequests(requestsData.outgoing || []);
      }
    } catch (err) {
      console.error('Failed to load friends data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Real-time friend request listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewFriendRequest = ({ senderName }) => {
      addToast({ type: 'info', message: `${senderName} sent you a friend request!` });
      loadData();
    };

    const handleFriendRequestAccepted = ({ userName }) => {
      addToast({ type: 'info', message: `${userName} accepted your friend request!` });
      loadData();
    };

    socket.on('newFriendRequest', handleNewFriendRequest);
    socket.on('friendRequestAccepted', handleFriendRequestAccepted);

    return () => {
      socket.off('newFriendRequest', handleNewFriendRequest);
      socket.off('friendRequestAccepted', handleFriendRequestAccepted);
    };
  }, [socket, addToast]);

  const handleSearchUsers = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await friendService.searchUsers(query.trim());
      if (data.success) {
        setSearchResults(data.users || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (targetUserId) => {
    try {
      const data = await friendService.sendFriendRequest(targetUserId);
      if (data.success) {
        addToast({ type: 'info', message: data.message });
        socket?.emit('friendRequestSent', { targetUserId });
        handleSearchUsers(searchQuery);
        loadData();
      }
    } catch (err) {
      addToast({ type: 'info', message: err.response?.data?.error || 'Failed to send friend request' });
    }
  };

  const handleAcceptRequest = async (requestId, senderId) => {
    try {
      const data = await friendService.acceptFriendRequest(requestId);
      if (data.success) {
        addToast({ type: 'info', message: data.message });
        socket?.emit('friendRequestAccepted', { senderId });
        loadData();
      }
    } catch (err) {
      addToast({ type: 'info', message: err.response?.data?.error || 'Failed to accept request' });
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const data = await friendService.rejectFriendRequest(requestId);
      if (data.success) {
        loadData();
      }
    } catch (err) {
      addToast({ type: 'info', message: 'Failed to update request' });
    }
  };

  const handleOpenDirectChat = async (friend) => {
    try {
      const data = await friendService.getOrCreateDM(friend._id);
      if (data.success && data.room) {
        onClose();
        onOpenDM(data.room, friend);
      }
    } catch (err) {
      console.error('Failed to open DM:', err);
    }
  };

  const onlineFriends = friends.filter((f) => onlineUsers.has(String(f._id)));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Friends & Social Hub"
      subtitle="Connect, direct message, challenge to games, and video call friends"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('online')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'online'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Online ({onlineFriends.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All ({friends.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all relative ${
              activeTab === 'pending'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
            {incomingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('add');
              handleSearchUsers('');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'add'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-400 hover:bg-emerald-950/30'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Friend</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[280px] max-h-[380px] overflow-y-auto pr-1 space-y-2">
          {/* 1. Online / All Friends Tab */}
          {(activeTab === 'online' || activeTab === 'all') && (
            <>
              {(activeTab === 'online' ? onlineFriends : friends).length > 0 ? (
                (activeTab === 'online' ? onlineFriends : friends).map((friend) => {
                  const isOnline = onlineUsers.has(String(friend._id));
                  return (
                    <div
                      key={friend._id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          name={friend.name}
                          avatar={friend.avatar}
                          size="md"
                          isOnline={isOnline}
                          showStatus={true}
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-100 truncate">
                            {friend.name}
                          </h4>
                          <p className="text-[10px] text-indigo-400 font-mono truncate">
                            @{friend.username}
                          </p>
                          {friend.bio && (
                            <p className="text-[10px] text-slate-500 truncate max-w-xs">
                              {friend.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleOpenDirectChat(friend)}
                          className="p-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors"
                          title="Open 1-on-1 Direct Chat"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            onClose();
                            onStartVideoCall(friend);
                          }}
                          className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white transition-colors"
                          title="Start Video Call"
                        >
                          <Video className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            onClose();
                            onStartGame(friend);
                          }}
                          className="p-2 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white transition-colors"
                          title="Play Game (Tic-Tac-Toe, RPS, Trivia)"
                        >
                          <Gamepad2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500">
                  <Users className="w-10 h-10 text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-300">
                    {activeTab === 'online' ? 'No friends currently online' : 'No friends added yet'}
                  </p>
                  <p className="text-xs text-slate-500 max-w-xs mt-1 mb-4">
                    Switch to the "Add Friend" tab to discover registered users!
                  </p>
                  <Button
                    variant="ai"
                    size="sm"
                    onClick={() => setActiveTab('add')}
                    icon={UserPlus}
                  >
                    Find Friends
                  </Button>
                </div>
              )}
            </>
          )}

          {/* 2. Pending Requests Tab */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {/* Incoming */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Incoming Requests ({incomingRequests.length})
                </h5>
                {incomingRequests.length > 0 ? (
                  <div className="space-y-2">
                    {incomingRequests.map((req) => (
                      <div
                        key={req._id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={req.sender?.name}
                            avatar={req.sender?.avatar}
                            size="sm"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-200">{req.sender?.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">@{req.sender?.username}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAcceptRequest(req._id, req.sender?._id)}
                            icon={Check}
                            className="!px-2.5 !py-1 text-xs"
                          >
                            Accept
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRejectRequest(req._id)}
                            icon={X}
                            className="!p-1 text-slate-400 hover:text-rose-400"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-2">No incoming friend requests.</p>
                )}
              </div>

              {/* Outgoing */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Sent Requests ({outgoingRequests.length})
                </h5>
                {outgoingRequests.length > 0 ? (
                  <div className="space-y-2">
                    {outgoingRequests.map((req) => (
                      <div
                        key={req._id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={req.recipient?.name}
                            avatar={req.recipient?.avatar}
                            size="sm"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-300">{req.recipient?.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">@{req.recipient?.username}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-amber-400 font-medium px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                            Pending
                          </span>
                          <button
                            onClick={() => handleRejectRequest(req._id)}
                            className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-2">No outgoing requests.</p>
                )}
              </div>
            </div>
          )}

          {/* 3. Add Friend / Directory Tab */}
          {activeTab === 'add' && (
            <div className="space-y-3">
              <div className="relative">
                <Input
                  id="friend-search-input"
                  placeholder="Search registered users by name, username, or email..."
                  value={searchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  icon={Search}
                  autoFocus
                />
              </div>

              {isSearching ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-indigo-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Searching users...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((targetUser) => (
                    <div
                      key={targetUser._id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          name={targetUser.name}
                          avatar={targetUser.avatar}
                          size="md"
                          isOnline={onlineUsers.has(String(targetUser._id))}
                          showStatus={true}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-100 truncate">
                            {targetUser.name}
                          </p>
                          <p className="text-[10px] text-indigo-400 font-mono truncate">
                            @{targetUser.username}
                          </p>
                          {targetUser.bio && (
                            <p className="text-[10px] text-slate-500 truncate max-w-xs">
                              {targetUser.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {targetUser.relationship === 'friends' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            <UserCheck className="w-3.5 h-3.5" /> Friends
                          </span>
                        ) : targetUser.relationship === 'pending_sent' ? (
                          <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                            Request Sent
                          </span>
                        ) : targetUser.relationship === 'pending_received' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAcceptRequest(targetUser.requestId, targetUser._id)}
                            icon={Check}
                            className="!py-1 !px-2.5 text-xs"
                          >
                            Accept
                          </Button>
                        ) : (
                          <Button
                            variant="ai"
                            size="sm"
                            onClick={() => handleSendRequest(targetUser._id)}
                            icon={UserPlus}
                            className="!py-1 !px-2.5 text-xs"
                          >
                            Add Friend
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No users found matching "{searchQuery}".
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  Type a name or username above to find other users to connect with!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
