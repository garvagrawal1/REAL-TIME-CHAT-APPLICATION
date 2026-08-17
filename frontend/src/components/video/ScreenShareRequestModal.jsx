import React from 'react';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { Monitor, Check, X, ShieldAlert } from 'lucide-react';

export const ScreenShareRequestModal = ({
  requestData,
  onAccept,
  onDecline,
}) => {
  if (!requestData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-750 p-6 shadow-2xl space-y-5 text-center">
        {/* Animated Monitor Icon Badge */}
        <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/25">
          <Monitor className="w-8 h-8 animate-pulse" />
        </div>

        {/* User Info & Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Avatar
              name={requestData.fromName || 'User'}
              avatar={requestData.fromAvatar}
              size="sm"
            />
            <h3 className="text-base font-bold text-slate-100">
              {requestData.fromName || 'Someone'}
            </h3>
          </div>

          <h2 className="text-lg font-extrabold text-white tracking-tight">
            Screen Share Request
          </h2>

          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            <span className="text-indigo-300 font-semibold">{requestData.fromName}</span> wants to share their screen with you in high definition.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onDecline}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-rose-950/50 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 text-xs font-semibold transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
            <span>Decline</span>
          </button>

          <Button
            variant="ai"
            size="md"
            onClick={onAccept}
            icon={Check}
            className="flex-1 !py-2.5 text-xs shadow-lg shadow-indigo-600/30"
          >
            Accept Screen
          </Button>
        </div>
      </div>
    </div>
  );
};
