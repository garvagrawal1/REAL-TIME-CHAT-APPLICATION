import React, { useState, useEffect, useRef } from 'react';
import { Avatar } from '../common/Avatar';
import { useSocket } from '../../hooks/useSocket';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const VideoCallModal = ({
  isOpen,
  onClose,
  targetUser,
  isIncoming = false,
  incomingSignalData = null,
  callerSocketId = null,
  callType = 'video',
}) => {
  const { socket, addToast } = useSocket();

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState(isIncoming ? 'Connecting...' : 'Calling...');
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const remoteSocketIdRef = useRef(callerSocketId);
  const timerRef = useRef(null);

  // Initialize WebRTC and Local Media Stream
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const setupCall = async () => {
      try {
        // 1. Get user media (camera and microphone)
        const constraints = {
          audio: true,
          video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 2. Initialize RTCPeerConnection
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Listen for remote tracks
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setCallStatus('Connected');
            startDurationTimer();
          }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate && remoteSocketIdRef.current) {
            socket?.emit('iceCandidate', {
              toSocketId: remoteSocketIdRef.current,
              candidate: event.candidate,
            });
          }
        };

        // 3. If Caller: Create Offer
        if (!isIncoming && targetUser) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket?.emit('callUser', {
            userToCall: targetUser._id,
            signalData: offer,
            callType,
          });
        }

        // 4. If Receiver: Answer Offer
        if (isIncoming && incomingSignalData && callerSocketId) {
          remoteSocketIdRef.current = callerSocketId;
          await pc.setRemoteDescription(new RTCSessionDescription(incomingSignalData));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket?.emit('answerCall', {
            toSocketId: callerSocketId,
            signalData: answer,
          });
        }
      } catch (err) {
        console.error('WebRTC initialization error:', err);
        setCallStatus(`Error: ${err.message}`);
        addToast({ type: 'info', message: 'Could not access camera/mic.' });
      }
    };

    setupCall();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [isOpen]);

  // Socket event listeners for signaling
  useEffect(() => {
    if (!socket) return;

    const handleCallAccepted = async ({ signal, responderSocketId }) => {
      remoteSocketIdRef.current = responderSocketId;
      setCallStatus('Connected');
      startDurationTimer();

      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
        } catch (err) {
          console.error('Failed to set remote description on caller:', err);
        }
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Failed to add ICE candidate:', err);
        }
      }
    };

    const handleCallRejected = ({ reason }) => {
      setCallStatus('Call Declined');
      addToast({ type: 'info', message: `Call was declined: ${reason}` });
      setTimeout(() => cleanupAndClose(), 2000);
    };

    const handleCallEnded = () => {
      setCallStatus('Call Ended');
      addToast({ type: 'info', message: 'The other user ended the call.' });
      cleanupAndClose();
    };

    socket.on('callAccepted', handleCallAccepted);
    socket.on('iceCandidate', handleIceCandidate);
    socket.on('callRejected', handleCallRejected);
    socket.on('callEnded', handleCallEnded);

    return () => {
      socket.off('callAccepted', handleCallAccepted);
      socket.off('iceCandidate', handleIceCandidate);
      socket.off('callRejected', handleCallRejected);
      socket.off('callEnded', handleCallEnded);
    };
  }, [socket, addToast]);

  const startDurationTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const cleanupAndClose = () => {
    cleanup();
    onClose();
  };

  const handleHangup = () => {
    if (remoteSocketIdRef.current) {
      socket?.emit('endCall', { toSocketId: remoteSocketIdRef.current });
    }
    cleanupAndClose();
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current) return;

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');

        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          // Revert back to webcam
          if (localStreamRef.current) {
            const camTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoSender && camTrack) videoSender.replaceTrack(camTrack);
          }
          setIsScreenSharing(false);
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn('Screen share error:', err.message);
      }
    } else {
      if (localStreamRef.current) {
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        const camTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoSender && camTrack) videoSender.replaceTrack(camTrack);
      }
      setIsScreenSharing(false);
    }
  };

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-4xl h-[85vh] rounded-3xl bg-slate-900 border border-slate-750 shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header Bar */}
        <div className="absolute top-0 inset-x-0 z-20 px-6 py-4 bg-gradient-to-b from-slate-950/80 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              name={targetUser?.name || 'User'}
              avatar={targetUser?.avatar}
              size="sm"
            />
            <div>
              <h3 className="text-sm font-bold text-slate-100">{targetUser?.name}</h3>
              <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{callStatus}</span>
                {callDuration > 0 && <span>• {formatDuration(callDuration)}</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Video Streams Container */}
        <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Remote Video Stream (Main) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Remote Fallback Avatar if no remote video */}
          {callStatus !== 'Connected' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-6 bg-slate-950/90">
              <Avatar
                name={targetUser?.name || 'User'}
                avatar={targetUser?.avatar}
                size="xl"
                isOnline={true}
                showStatus={true}
              />
              <div>
                <h2 className="text-xl font-bold text-slate-100">{targetUser?.name}</h2>
                <p className="text-xs text-indigo-400 mt-1">{callStatus}</p>
              </div>
            </div>
          )}

          {/* Local Video Preview (Picture in Picture - Bottom Right) */}
          <div className="absolute bottom-24 right-5 z-20 w-36 sm:w-48 h-28 sm:h-36 rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl bg-slate-900">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
            />
            {isVideoOff && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 text-xs gap-1">
                <VideoOff className="w-5 h-5" />
                <span>Camera Off</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Floating Control Bar */}
        <div className="absolute bottom-6 inset-x-0 z-30 flex items-center justify-center gap-3 sm:gap-4 px-4">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md">
            {/* Mic Button */}
            <button
              onClick={toggleMic}
              className={`p-3 rounded-xl transition-colors ${
                isMicMuted
                  ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Video Toggle Button */}
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-xl transition-colors ${
                isVideoOff
                  ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            {/* Screen Share Button */}
            <button
              onClick={toggleScreenShare}
              className={`p-3 rounded-xl transition-colors ${
                isScreenSharing
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            >
              <Monitor className="w-5 h-5" />
            </button>

            {/* End Call Button */}
            <button
              onClick={handleHangup}
              className="p-3 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all font-semibold flex items-center gap-2"
              title="End Call"
            >
              <PhoneOff className="w-5 h-5" />
              <span className="text-xs">End Call</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
