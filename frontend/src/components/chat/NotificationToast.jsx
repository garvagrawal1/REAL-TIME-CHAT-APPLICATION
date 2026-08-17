import React from 'react';
import { useSocket } from '../../hooks/useSocket';
import { MessageSquare, Info, X } from 'lucide-react';

export const NotificationToast = () => {
  const { toasts, removeToast } = useSocket();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-xl backdrop-blur-md animate-slide-up text-slate-100"
        >
          <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 mt-0.5 flex-shrink-0">
            {toast.type === 'message' ? (
              <MessageSquare className="w-4 h-4" />
            ) : (
              <Info className="w-4 h-4" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {toast.title && (
              <p className="text-xs font-semibold text-indigo-300">{toast.title}</p>
            )}
            <p className="text-xs text-slate-200 line-clamp-2">{toast.message}</p>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
