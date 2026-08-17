import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { aiService } from '../../services/aiService';
import { Sparkles, Check, X, ArrowRight, Wand2 } from 'lucide-react';

export const ImproveMessageModal = ({
  isOpen,
  onClose,
  originalText,
  onAccept,
}) => {
  const [improvedText, setImprovedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && originalText) {
      handleImprove();
    }
  }, [isOpen, originalText]);

  const handleImprove = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await aiService.improve(originalText);
      if (data.success && data.improved) {
        setImprovedText(data.improved);
      } else {
        setImprovedText(data.improved || originalText);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to improve message with AI');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (improvedText) {
      onAccept(improvedText);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="✨ AI Message Polish & Grammar"
      subtitle="Improve tone, clarity, and phrasing before sending"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Original Draft */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Original Draft
          </label>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap">
            {originalText || 'No text provided'}
          </div>
        </div>

        {/* Improved Version */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              AI Improved Version
            </label>
            <button
              onClick={handleImprove}
              disabled={isLoading}
              className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline inline-flex items-center gap-1"
            >
              <Wand2 className="w-3 h-3" /> Regenerate
            </button>
          </div>

          {isLoading ? (
            <div className="p-6 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col items-center justify-center gap-2 text-indigo-300">
              <Sparkles className="w-5 h-5 animate-spin" />
              <p className="text-xs">Enhancing your message with AI...</p>
            </div>
          ) : error ? (
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300">
              {error}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/40 text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">
              {improvedText}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} icon={X}>
            Cancel
          </Button>
          <Button
            variant="ai"
            size="sm"
            onClick={handleApply}
            disabled={isLoading || !improvedText}
            icon={Check}
          >
            Accept & Replace
          </Button>
        </div>
      </div>
    </Modal>
  );
};
