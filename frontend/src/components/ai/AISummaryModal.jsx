import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { aiService } from '../../services/aiService';
import { copyToClipboard } from '../../utils/helpers';
import {
  Sparkles,
  CheckCircle2,
  Tag,
  Copy,
  Check,
  RefreshCw,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';

export const AISummaryModal = ({ isOpen, onClose, roomId, roomName }) => {
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && roomId) {
      fetchSummary();
    }
  }, [isOpen, roomId]);

  const fetchSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await aiService.summarize(roomId);
      if (data.success) {
        setSummaryData(data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate room summary');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!summaryData) return;
    const textToCopy = `ChatFlow AI Summary: #${roomName}\n\nSummary:\n${summaryData.summary}\n\nKey Topics:\n${summaryData.keyTopics?.join(', ')}\n\nAction Items:\n${summaryData.actionItems?.map(a => `• ${a}`).join('\n')}`;
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`✨ AI Summary — #${roomName}`}
      subtitle="Intelligent breakdown of recent messages and key takeaways"
      maxWidth="xl"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-indigo-400">
            <Sparkles className="w-8 h-8 animate-spin" />
            <p className="text-sm font-medium text-slate-300">
              Analyzing recent room conversation...
            </p>
            <p className="text-xs text-slate-500">
              Extracting key topics, sentiment, and action items
            </p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm">
            <p className="font-semibold">Unable to summarize:</p>
            <p className="text-xs mt-1">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchSummary}
              className="mt-3"
              icon={RefreshCw}
            >
              Retry
            </Button>
          </div>
        ) : summaryData ? (
          <div className="space-y-4">
            {/* Meta statistics bar */}
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>Analyzed {summaryData.messageCount || 0} messages</span>
              </div>
              {summaryData.sentiment && (
                <div className="flex items-center gap-1.5 text-slate-300">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tone: {summaryData.sentiment}</span>
                </div>
              )}
            </div>

            {/* Executive Summary */}
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Executive Overview
              </h4>
              <p className="text-sm text-slate-100 leading-relaxed">
                {summaryData.summary}
              </p>
            </div>

            {/* Key Topics */}
            {summaryData.keyTopics && summaryData.keyTopics.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  Key Discussion Topics
                </h4>
                <div className="flex flex-wrap gap-2">
                  {summaryData.keyTopics.map((topic, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200"
                    >
                      #{topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {summaryData.actionItems && summaryData.actionItems.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Action Items & Follow-ups
                </h4>
                <div className="space-y-1.5">
                  {summaryData.actionItems.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSummary}
            disabled={isLoading}
            icon={RefreshCw}
          >
            Regenerate
          </Button>

          <div className="flex items-center gap-2">
            {summaryData && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                icon={copied ? Check : Copy}
              >
                {copied ? 'Copied' : 'Copy Summary'}
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
