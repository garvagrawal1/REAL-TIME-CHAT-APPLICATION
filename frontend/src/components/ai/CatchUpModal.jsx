import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { aiService } from '../../services/aiService';
import {
  Zap,
  Sparkles,
  CheckCircle2,
  ListTodo,
  Clock,
  Loader2,
  Calendar,
} from 'lucide-react';

export const CatchUpModal = ({
  isOpen,
  onClose,
  roomId,
  roomName,
}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && roomId) {
      const fetchBrief = async () => {
        setIsLoading(true);
        try {
          const res = await aiService.catchUp(roomId);
          if (res.success) {
            setData(res);
          }
        } catch (err) {
          console.error('Catch up error:', err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchBrief();
    }
  }, [isOpen, roomId]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚡ Instant Time-Travel Catch Up"
      subtitle={`AI executive brief for #${roomName || 'Channel'}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-indigo-400 text-xs">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="font-semibold">Synthesizing discussion since you were away...</span>
          </div>
        ) : data ? (
          <div className="space-y-4 text-xs">
            {/* Top Stat Badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
              <span className="flex items-center gap-1.5 font-bold text-indigo-300">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Discussion Catch-Up</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {data.unreadCount || 0} messages analyzed
              </span>
            </div>

            {/* 3 Executive Bullets */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Key Highlights
              </h4>
              <div className="space-y-2">
                {data.bullets?.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-200">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span className="leading-relaxed">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Decisions & Action Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <h5 className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Key Decisions
                </h5>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {Array.isArray(data.keyDecisions) ? data.keyDecisions.join(', ') : data.keyDecisions || 'None'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <h5 className="text-[11px] font-bold text-purple-400 flex items-center gap-1">
                  <ListTodo className="w-3.5 h-3.5" /> Action For You
                </h5>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {data.actionForYou || 'No pending tasks required.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            Could not generate catch-up brief. Start typing in the channel!
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Got It!
          </Button>
        </div>
      </div>
    </Modal>
  );
};
