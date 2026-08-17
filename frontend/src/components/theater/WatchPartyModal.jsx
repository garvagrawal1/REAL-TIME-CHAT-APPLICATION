import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  FastForward,
  Rewind,
  CheckCircle2,
  Clock,
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lastSyncUser, setLastSyncUser] = useState('');
  const [is120FpsActive, setIs120FpsActive] = useState(false);
  const [theaterChat, setTheaterChat] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const ytPlayerRef = useRef(null);
  const isInternalUpdateRef = useRef(false);
  const screenVideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const timePollerRef = useRef(null);

  // Extract YouTube ID helper
  const extractYouTubeId = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\\&v=)([^#\\&\\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : url;
  };

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const total = Math.floor(secs || 0);
    const mins = Math.floor(total / 60);
    const remainder = total % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Initialize YouTube Iframe API
  useEffect(() => {
    if (!isOpen || mode !== 'youtube') return;

    // Load YouTube API script tag if not yet present
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      const container = document.getElementById('youtube-watchparty-player');
      if (!container) return;

      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {
          // ignore
        }
      }

      ytPlayerRef.current = new window.YT.Player('youtube-watchparty-player', {
        videoId: activeVideoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          enablejsapi: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event) => {
            setDuration(event.target.getDuration() || 0);
            if (isPlaying) {
              event.target.playVideo();
            }
          },
          onStateChange: (event) => {
            if (isInternalUpdateRef.current) return;

            // YT.PlayerState: 1 = PLAYING, 2 = PAUSED
            if (event.data === 1) {
              setIsPlaying(true);
              const curr = event.target.getCurrentTime() || 0;
              socket?.emit('watchPartyAction', {
                roomId,
                action: 'PLAY',
                currentTime: curr,
                videoUrl: activeVideoId,
              });
            } else if (event.data === 2) {
              setIsPlaying(false);
              const curr = event.target.getCurrentTime() || 0;
              socket?.emit('watchPartyAction', {
                roomId,
                action: 'PAUSE',
                currentTime: curr,
                videoUrl: activeVideoId,
              });
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    // Time poller for timeline display
    timePollerRef.current = setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        try {
          const curr = ytPlayerRef.current.getCurrentTime() || 0;
          const dur = ytPlayerRef.current.getDuration() || 0;
          setCurrentTime(curr);
          if (dur > 0 && dur !== duration) setDuration(dur);
        } catch (e) {
          // player not ready
        }
      }
    }, 500);

    return () => {
      if (timePollerRef.current) clearInterval(timePollerRef.current);
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {
          // ignore
        }
        ytPlayerRef.current = null;
      }
    };
  }, [isOpen, activeVideoId, mode, roomId]);

  // Load new video
  const handleLoadVideo = (customUrl = null) => {
    const rawUrl = customUrl || videoInput;
    const id = extractYouTubeId(rawUrl);
    if (!id) {
      addToast({ type: 'info', message: 'Please provide a valid YouTube link' });
      return;
    }
    setActiveVideoId(id);
    setIsPlaying(true);
    setCurrentTime(0);

    socket?.emit('watchPartyAction', {
      roomId,
      action: 'CHANGE_VIDEO',
      videoUrl: id,
      currentTime: 0,
    });
    addToast({ type: 'info', message: 'Video loaded & synchronized for everyone!' });
  };

  // Synchronized Play / Pause Action
  const handleTogglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);

    let curr = currentTime;
    if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
      try {
        curr = ytPlayerRef.current.getCurrentTime() || 0;
        if (nextState) {
          ytPlayerRef.current.playVideo();
        } else {
          ytPlayerRef.current.pauseVideo();
        }
      } catch (e) {
        // ignore
      }
    }

    socket?.emit('watchPartyAction', {
      roomId,
      action: nextState ? 'PLAY' : 'PAUSE',
      currentTime: curr,
      videoUrl: activeVideoId,
    });
  };

  // Synchronized Seek / Jump Action
  const handleSeek = (newSecs) => {
    const targetTime = Math.max(0, Math.min(duration || 99999, newSecs));
    setCurrentTime(targetTime);

    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      try {
        ytPlayerRef.current.seekTo(targetTime, true);
      } catch (e) {
        // ignore
      }
    }

    socket?.emit('watchPartyAction', {
      roomId,
      action: 'SEEK',
      currentTime: targetTime,
      videoUrl: activeVideoId,
    });
  };

  // Socket listener for synchronized Watch Party actions from peers
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleWatchPartyUpdate = (data) => {
      setLastSyncUser(data.updatedBy || 'Peer');

      if (data.action === 'CHANGE_VIDEO' && data.videoUrl) {
        setActiveVideoId(data.videoUrl);
        setIsPlaying(true);
        setCurrentTime(data.currentTime || 0);
        addToast({
          type: 'info',
          title: '🎬 Video Changed',
          message: `${data.updatedBy} changed video for the room.`,
        });
      } else if (data.action === 'PLAY') {
        setIsPlaying(true);
        isInternalUpdateRef.current = true;
        if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
          try {
            if (typeof data.currentTime === 'number') {
              ytPlayerRef.current.seekTo(data.currentTime, true);
              setCurrentTime(data.currentTime);
            }
            ytPlayerRef.current.playVideo();
          } catch (e) {
            // ignore
          }
        }
        setTimeout(() => {
          isInternalUpdateRef.current = false;
        }, 800);
      } else if (data.action === 'PAUSE') {
        setIsPlaying(false);
        isInternalUpdateRef.current = true;
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
          try {
            if (typeof data.currentTime === 'number') {
              ytPlayerRef.current.seekTo(data.currentTime, true);
              setCurrentTime(data.currentTime);
            }
            ytPlayerRef.current.pauseVideo();
          } catch (e) {
            // ignore
          }
        }
        setTimeout(() => {
          isInternalUpdateRef.current = false;
        }, 800);
      } else if (data.action === 'SEEK') {
        if (typeof data.currentTime === 'number') {
          setCurrentTime(data.currentTime);
          isInternalUpdateRef.current = true;
          if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
            try {
              ytPlayerRef.current.seekTo(data.currentTime, true);
            } catch (e) {
              // ignore
            }
          }
          setTimeout(() => {
            isInternalUpdateRef.current = false;
          }, 800);
        }
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
        message: 'Screen sharing movie/show with ultra-smooth 120Hz!',
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
      title="🎬 Synchronized Watch Party & 120 FPS Theater"
      subtitle={`Live media sync & high-framerate stream for #${roomName || 'Channel'}`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Mode Switcher & Live Sync Indicator */}
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
              <span>YouTube Sync</span>
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

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Synced {lastSyncUser ? `(by ${lastSyncUser})` : ''}</span>
            </span>
          </div>
        </div>

        {/* Video Player & Stream Theater View */}
        <div className="relative w-full aspect-video rounded-2xl bg-black border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
          {mode === 'youtube' ? (
            <div className="w-full h-full">
              <div id="youtube-watchparty-player" className="w-full h-full" />
            </div>
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
                    Stream Movies & Games at up to 120 FPS
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Share your screen with high refresh rate and crisp audio!
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
                className="px-2.5 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-700/60 text-xs text-slate-100 animate-slide-up"
              >
                <span className="text-indigo-300 font-bold text-[10px]">{c.user}: </span>
                <span>{c.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Synchronized Playback Control Bar (Play, Pause, Seek +10s / -10s, Scrub Slider) */}
        {mode === 'youtube' && (
          <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
            {/* Timeline Scrub Slider */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-slate-400 min-w-[40px]">
                {formatTime(currentTime)}
              </span>

              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
              />

              <span className="text-[11px] font-mono text-slate-400 min-w-[40px] text-right">
                {formatTime(duration)}
              </span>
            </div>

            {/* Play, Pause, Jump Buttons */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                {/* Jump -10s */}
                <button
                  onClick={() => handleSeek(currentTime - 10)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-all active:scale-95"
                  title="Rewind 10 Seconds (Syncs Both)"
                >
                  <Rewind className="w-3.5 h-3.5" />
                  <span>-10s</span>
                </button>

                {/* Main Play / Pause Button */}
                <button
                  onClick={handleTogglePlay}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                    isPlaying
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                  }`}
                  title={isPlaying ? 'Pause Video (Syncs for Both)' : 'Play Video (Syncs for Both)'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                  <span>{isPlaying ? 'Pause for Both' : 'Play for Both'}</span>
                </button>

                {/* Jump +10s */}
                <button
                  onClick={() => handleSeek(currentTime + 10)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-all active:scale-95"
                  title="Forward 10 Seconds (Syncs Both)"
                >
                  <span>+10s</span>
                  <FastForward className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-[11px] text-slate-400 italic">
                {isPlaying ? '▶️ Playing in sync' : '⏸️ Paused for all'}
              </div>
            </div>
          </div>
        )}

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
              onClick={() => handleLoadVideo()}
              icon={Tv}
            >
              Sync New Video
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
              placeholder="Reaction comment..."
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
