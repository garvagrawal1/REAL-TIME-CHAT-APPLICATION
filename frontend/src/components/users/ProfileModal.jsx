import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { User, Mail, AtSign, FileText, Check, LogOut } from 'lucide-react';

export const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isLoading, setIsLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const data = await authService.updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        avatar: avatar.trim(),
      });

      if (data.success && data.user) {
        updateUser(data.user);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    onClose();
    logout();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Profile & Settings"
      subtitle="Manage your profile information and preferences"
      maxWidth="md"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Avatar and Main Info Banner */}
        <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <Avatar
            name={user?.name || 'User'}
            avatar={avatar || user?.avatar}
            size="lg"
            isOnline={true}
            showStatus={true}
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-slate-100 truncate">{user?.name}</h4>
            <p className="text-xs text-indigo-400 font-mono truncate">@{user?.username}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
            {error}
          </div>
        )}

        <Input
          label="Full Name"
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={User}
          required
        />

        <Input
          label="Custom Avatar URL (Optional)"
          id="profile-avatar"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          placeholder="https://example.com/avatar.png"
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Bio
          </label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us a little bit about yourself..."
            className="w-full rounded-xl bg-slate-900 border border-slate-750 p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <Button
            variant="danger"
            size="sm"
            onClick={handleLogout}
            icon={LogOut}
          >
            Logout
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
