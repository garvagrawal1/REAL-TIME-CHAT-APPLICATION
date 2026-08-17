import React from 'react';
import { useSocket } from '../../hooks/useSocket';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const ConnectionStatus = () => {
  const { connectionStatus } = useSocket();

  const configs = {
    connected: {
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-500',
      icon: Wifi,
      text: 'Connected',
      animateDot: true,
    },
    reconnecting: {
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-500',
      icon: RefreshCw,
      text: 'Reconnecting...',
      animateIcon: true,
    },
    disconnected: {
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-500',
      icon: WifiOff,
      text: 'Disconnected',
    },
  };

  const current = configs[connectionStatus] || configs.disconnected;
  const Icon = current.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-300 ${current.color}`}
      title={`Socket Status: ${current.text}`}
    >
      <span className="relative flex h-2 w-2">
        {current.animateDot && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${current.dot}`}></span>
      </span>
      <span className="hidden sm:inline">{current.text}</span>
    </div>
  );
};
