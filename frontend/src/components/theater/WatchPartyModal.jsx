import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import {
  Tv,
  Monitor,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  Film,
  Zap,
  Send,
  Radio,
} from 'lucide-react';

export const WatchPartyModal = ({
  isOpen,
  onClose,
  roomId,
  roomName,
}) => {
  const { socket, addToast } = useSocket();
  const { user } = useAuth();

  const [mode, setMode] = useState('youtube'); // 'youtube' | 'screen'
  const [videoInput, setVideoInput] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [activeVideoId, setActiveVideoId] = useState('dQw4w9WgXcQ');
  const [isPlaying, setIsPlaying] = useState(true);
  const [is120FpsActive, setIs120FpsActive] = useState(false);
  const [theaterChat, setTheaterChat] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const screenVideoRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Extract YouTube ID helper
  const extractYouTubeId = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\\&v=)([^#\\&\\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : url;
  };

  const handleLoadVideo = () => {
    const id = extractYouTubeId(videoInput);
    if (!id) {
      addToast({ type: 'info', message: 'Please provide a valid YouTube link' });
      return;
    }
    setActiveVideoId(id);
    socket?.emit('watchPartyAction', {
      roomId,
      action: 'CHANGE_VIDEO',
      videoUrl: id,
    });
    addToast({ type: 'info', message: 'Video loaded for all participants!' });
  };

  // Socket listener for synchronized Watch Party actions
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleWatchPartyUpdate = (data) => {
      if (data.action === 'CHANGE_VIDEO' && data.videoUrl) {
        setActiveVideoId(data.videoUrl);
        addToast({ type: 'info', message: `${data.updatedBy} changed the video` });
      } else if (data.action === 'PLAY') {
        setIsPlaying(true);
      } else if (data.action === 'PAUSE') {
        setIsPlaying(false);
      }
    };

    socket.on('watchPartyUpdate', handleWatchPartyUpdate);

    return () => {
      socket.off('watchPartyUpdate', handleWatchPartyUpdate);
    };
  }, [socket, isOpen, addToast]);

  // High FPS (Up to 120 FPS) Screen Sharing Stream
  const startHighFpsScreenShare = async () => {
    try {
      // 120 FPS display constraints with system audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 60, max: 120 },
          width: { ideal: 1920, max: 2560 },
          height: { ideal: 1080, max: 1440 },
          cursor: 'always',
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      screenStreamRef.current = stream;
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
      }

      setIs120FpsActive(true);
      setMode('screen');

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      addToast({
        type: 'info',
        title: '⚡ 120 FPS Stream Active',
        message: 'Screen sharing movie/show with high refresh rate and system audio!',
      });
    } catch (err) {
      console.warn('Screen share error:', err.message);
      addToast({ type: 'info', message: 'Screen share cancelled' });
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    setIs120FpsActive(false);
  };

  const handleSendReaction = (emoji) => {
    setTheaterChat((prev) => [
      ...prev.slice(-15),
      { id: Date.now(), user: user?.name || 'You', text: emoji, isEmoji: true },
    ]);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setTheaterChat((prev) => [
      ...prev.slice(-15),
      { id: Date.now(), user: user?.name || 'You', text: chatInput.trim(), isEmoji: false },
    ]);
    setChatInput('');
  };

  useEffect(() => {
    return () => {
      stopScreenShare();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopScreenShare();
        onClose();
      }}
      title="🎬 Watch Party & 120 FPS Stream Theater"
      subtitle={`Synchronized media streaming & ultra-smooth screen share for #${roomName || 'Channel'}`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Mode Switcher & Stream Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-950/80 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMode('youtube')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                mode === 'youtube'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>YouTube Party</span>
            </button>

            <button
              onClick={() => {
                setMode('screen');
                if (!is120FpsActive) startHighFpsScreenShare();
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                mode === 'screen'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>120 FPS Screen Share</span>
              {is120FpsActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px]">
              <Zap className="w-3 h-3 text-amber-400" /> Ultra-Smooth 120Hz Enabled
            </span>
          </div>
        </div>

        {/* Video Player & Stream Theater View */}
        <div className="relative w-full aspect-video rounded-2xl bg-black border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
          {mode === 'youtube' ? (
            <iframe
              title="YouTube Watch Party"
              src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&enablejsapi=1`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-contain ${is120FpsActive ? 'block' : 'hidden'}`}
              />
              {!is120FpsActive && (
                <div className="text-center space-y-3 p-6">
                  <Monitor className="w-12 h-12 text-indigo-400 mx-auto animate-pulse" />
                  <h4 className="text-sm font-bold text-slate-200">
                    Stream Movies, Shows & Games at up to 120 FPS
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Share your screen with high frame rate and pristine system audio sync!
                  </p>
                  <Button
                    variant="ai"
                    size="sm"
                    onClick={startHighFpsScreenShare}
                    icon={Monitor}
                  >
                    Start 120 FPS Stream
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Floating Reaction overlay inside theater */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-1 pointer-events-none max-h-36 overflow-hidden">
            {theaterChat.slice(-4).map((c) => (
              <div
                key={c.id}
                className="px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-xs text-slate-100 animate-slide-up"
              >
                <span className="text-indigo-300 font-bold text-[10px]">{c.user}: </span>
                <span>{c.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* YouTube URL input for Changing Video */}
        {mode === 'youtube' && (
          <div className="flex items-center gap-2">
            <Input
              id="watch-party-url"
              placeholder="Paste any YouTube video link (e.g. https://www.youtube.com/watch?v=...)"
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleLoadVideo}
              icon={Tv}
            >
              Sync Video
            </Button>
          </div>
        )}

        {/* Live Theater Reactions Bar */}
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Reactions:
            </span>
            {['🔥', '🍿', '😂', '🎉', '🤯', '❤️'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSendReaction(emoji)}
                className="p-1.5 text-base rounded-lg hover:bg-slate-800 hover:scale-125 transition-all active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="flex items-center gap-1.5 flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Quick reaction comment..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-3 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              stopScreenShare();
              onClose();
            }}
          >
            Exit Theater
          </Button>
        </div>
      </div>
    </Modal>
  );
};
