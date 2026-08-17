import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Avatar } from '../common/Avatar';
import { aiService } from '../../services/aiService';
import { formatMessageTime } from '../../utils/helpers';
import { Search, Sparkles, MessageSquare, Loader2, ArrowRight } from 'lucide-react';

export const AISearchModal = ({ isOpen, onClose, roomId, currentRoomName }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await aiService.search(query.trim(), roomId);
      if (data.success) {
        setResults(data.results || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete AI search');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🔍 AI Semantic Chat Search"
      subtitle={`Intelligent search across messages in #${currentRoomName || 'all rooms'}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1">
            <Input
              id="ai-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Find where we discussed MongoDB deployment bugs..."
              icon={Search}
              autoFocus
            />
          </div>
          <Button
            type="submit"
            variant="ai"
            size="md"
            isLoading={isLoading}
            disabled={!query.trim()}
            icon={Sparkles}
          >
            Search
          </Button>
        </form>

        {/* Results / Empty / Loading State */}
        <div className="min-h-[200px] max-h-[360px] overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-indigo-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-xs text-slate-400">
                Searching message history using semantic AI matching...
              </p>
            </div>
          ) : error ? (
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300">
              {error}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 px-1">
                Found {results.length} relevant message(s):
              </p>
              {results.map((msg) => (
                <div
                  key={msg._id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 transition-all duration-150 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={msg.sender?.name || msg.sender?.username}
                        avatar={msg.sender?.avatar}
                        size="xs"
                      />
                      <span className="text-xs font-semibold text-slate-200">
                        {msg.sender?.name || msg.sender?.username}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {formatMessageTime(msg.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 pl-8 whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          ) : hasSearched ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
              <MessageSquare className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-300">No matching messages found</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Try searching with different keywords or broader phrasing.
              </p>
            </div>
          ) : (
            <div className="py-10 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
              <Sparkles className="w-8 h-8 text-indigo-400/40" />
              <p className="text-xs text-slate-400">
                Type natural language queries to search through chat conversations.
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                {['MongoDB setup', 'Deployment error', 'Frontend bugs', 'Socket reconnection'].map((hint) => (
                  <button
                    key={hint}
                    onClick={() => {
                      setQuery(hint);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 hover:bg-indigo-600/30 hover:text-white transition-colors"
                  >
                    "{hint}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
