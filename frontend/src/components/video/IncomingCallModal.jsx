import React, { useEffect, useRef } from 'react';
import { Avatar } from '../common/Avatar';
import { Phone, PhoneOff, Video } from 'lucide-react';

export const IncomingCallModal = ({
  callData,
  onAccept,
  onReject,
}) => {
  const audioCtxRef = useRef(null);
  const ringIntervalRef = useRef(null);

  // Play synthesized pleasant ringtone using Web Audio API
  useEffect(() => {
    if (!callData) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtxRef.current = new AudioContext();

        const playChime = () => {
          if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
          const osc = audioCtxRef.current.createOscillator();
          const gain = audioCtxRef.current.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, audioCtxRef.current.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, audioCtxRef.current.currentTime + 0.3);

          gain.gain.setValueAtTime(0.15, audioCtxRef.current.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.8);

          osc.connect(gain);
          gain.connect(audioCtxRef.current.destination);

          osc.start();
          osc.stop(audioCtxRef.current.currentTime + 0.8);
        };

        playChime();
        ringIntervalRef.current = setInterval(playChime, 2500);
      }
    } catch (err) {
      console.warn('Audio ringtone autoplay notice:', err.message);
    }

    return () => {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [callData]);

  if (!callData) return null;

  const isVideo = callData.callType === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-center space-y-6 animate-slide-up">
        {/* Caller Avatar with pulsing ring */}
        <div className="relative inline-block mx-auto mt-2">
          <div className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-30"></div>
          <Avatar
            name={callData.callerName || 'User'}
            avatar={callData.callerAvatar}
            size="xl"
            isOnline={true}
            showStatus={true}
          />
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-100">{callData.callerName}</h3>
          <p className="text-xs text-indigo-400 font-mono">@{callData.callerUsername}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
            {isVideo ? (
              <Video className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Phone className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>Incoming {isVideo ? 'Video Call' : 'Audio Call'}...</span>
          </div>
        </div>

        {/* Action Controls: Decline / Accept */}
        <div className="flex items-center justify-center gap-6 pt-2">
          {/* Decline button */}
          <button
            onClick={onReject}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/30 transition-all duration-150 group-hover:scale-105 active:scale-95">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-rose-400">Decline</span>
          </button>

          {/* Accept button */}
          <button
            onClick={onAccept}
            className="flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 transition-all duration-150 group-hover:scale-105 active:scale-95 animate-bounce">
              {isVideo ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
            </div>
            <span className="text-[11px] font-semibold text-emerald-400">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};
