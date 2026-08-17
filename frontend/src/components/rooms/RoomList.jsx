import React, { useState } from 'react';
import { RoomItem } from './RoomItem';
import { Skeleton } from '../common/Skeleton';
import { Plus, Search, Hash } from 'lucide-react';

export const RoomList = ({
  rooms = [],
  activeRoomId = null,
  onSelectRoom,
  onOpenCreateModal,
  isLoading = false,
}) => {
  const [search, setSearch] = useState('');

  const filteredRooms = rooms.filter((room) => {
    const q = search.toLowerCase();
    return (
      room.name.toLowerCase().includes(q) ||
      (room.description && room.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-2">
      {/* Header & New Room button */}
      <div className="flex items-center justify-between px-2 pt-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Chat Channels ({rooms.length})
        </span>
        <button
          onClick={onOpenCreateModal}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Create New Channel"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input Filter */}
      <div className="relative px-1">
        <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter channels..."
          className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Room Items List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {isLoading ? (
          <div className="space-y-2 p-1">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <RoomItem
              key={room._id}
              room={room}
              isActive={room._id === activeRoomId}
              onClick={onSelectRoom}
            />
          ))
        ) : (
          <div className="py-6 text-center text-xs text-slate-500">
            {search ? 'No matching channels found' : 'No channels created yet'}
          </div>
        )}
      </div>
    </div>
  );
};
