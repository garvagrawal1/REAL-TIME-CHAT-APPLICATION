import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { roomService } from '../../services/roomService';
import {
  Hash,
  MessageSquare,
  Cpu,
  Gamepad2,
  Sparkles,
  Lock,
  Globe,
} from 'lucide-react';

export const CreateRoomModal = ({ isOpen, onClose, onRoomCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [icon, setIcon] = useState('MessageSquare');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const iconOptions = [
    { id: 'MessageSquare', label: 'General', icon: MessageSquare },
    { id: 'Cpu', label: 'Technology', icon: Cpu },
    { id: 'Gamepad2', label: 'Gaming', icon: Gamepad2 },
    { id: 'Sparkles', label: 'Random', icon: Sparkles },
    { id: 'Hash', label: 'Channel', icon: Hash },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Room name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await roomService.createRoom({
        name: name.trim(),
        description: description.trim(),
        topic: topic.trim(),
        icon,
        isPrivate,
      });

      if (data.success && data.room) {
        onRoomCreated(data.room);
        setName('');
        setDescription('');
        setTopic('');
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Channel"
      subtitle="Channels are where conversations happen around specific topics"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
            {error}
          </div>
        )}

        <Input
          label="Channel Name"
          id="room-name"
          placeholder="e.g. machine-learning, project-x"
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={Hash}
          required
          autoFocus
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this channel about?"
            className="w-full rounded-xl bg-slate-900 border border-slate-750 p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Channel Icon Picker */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Channel Icon
          </label>
          <div className="grid grid-cols-5 gap-2">
            {iconOptions.map((opt) => {
              const IconComp = opt.icon;
              const isSelected = icon === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setIcon(opt.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <IconComp className="w-4 h-4 mb-1" />
                  <span className="text-[10px] truncate max-w-full">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isLoading}
            disabled={!name.trim()}
          >
            Create Channel
          </Button>
        </div>
      </form>
    </Modal>
  );
};
