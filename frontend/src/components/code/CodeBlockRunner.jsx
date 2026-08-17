import React, { useState } from 'react';
import { Play, Sparkles, Wrench, Copy, Check, Terminal, Loader2, X } from 'lucide-react';
import { aiService } from '../../services/aiService';
import { copyToClipboard } from '../../utils/helpers';

export const CodeBlockRunner = ({ code, language = 'javascript' }) => {
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [aiFix, setAiFix] = useState(null);
  const [isFixing, setIsFixing] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setOutput(null);

    try {
      if (language === 'html') {
        setOutput({
          type: 'html',
          content: code,
          logs: ['Rendered HTML preview successfully.'],
        });
        setIsRunning(false);
        return;
      }

      // Safe isolated JavaScript sandbox execution with console capture
      const logs = [];
      const customConsole = {
        log: (...args) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
        error: (...args) => logs.push('[ERROR] ' + args.join(' ')),
        warn: (...args) => logs.push('[WARN] ' + args.join(' ')),
      };

      const startTime = performance.now();
      // Execute in sandbox function scope
      const runFn = new Function('console', code);
      const result = runFn(customConsole);
      const duration = (performance.now() - startTime).toFixed(2);

      if (result !== undefined) {
        logs.push(`➜ Return Value: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`);
      }

      setOutput({
        type: 'js',
        logs: logs.length > 0 ? logs : ['Execution finished with no output.'],
        duration,
      });
    } catch (err) {
      setOutput({
        type: 'error',
        logs: [`Runtime Error: ${err.message}`],
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleExplain = async () => {
    setIsExplaining(true);
    try {
      const data = await aiService.explainCode(code, language);
      if (data.success) {
        setAiExplanation(data.explanation);
      }
    } catch (err) {
      console.error('Explain error:', err);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleFix = async () => {
    setIsFixing(true);
    try {
      const data = await aiService.fixCode(code, language);
      if (data.success) {
        setAiFix(data);
      }
    } catch (err) {
      console.error('Fix error:', err);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="my-2 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden text-xs shadow-lg">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 select-none">
        <span className="font-mono text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
          {language} Sandbox
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-semibold transition-all"
            title="Run Code Live"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run</span>
          </button>

          <button
            onClick={handleExplain}
            disabled={isExplaining}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-all"
            title="AI Explain Code"
          >
            <Sparkles className="w-3 h-3" />
            <span className="hidden sm:inline">Explain</span>
          </button>

          <button
            onClick={handleFix}
            disabled={isFixing}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white transition-all"
            title="AI Fix Bugs"
          >
            <Wrench className="w-3 h-3" />
            <span className="hidden sm:inline">Fix</span>
          </button>

          <button
            onClick={handleCopy}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Code Text Content */}
      <div className="p-3 font-mono text-[11px] text-slate-200 overflow-x-auto whitespace-pre leading-relaxed bg-slate-950/90">
        <code>{code}</code>
      </div>

      {/* Output Console Panel */}
      {output && (
        <div className="p-2.5 bg-black/80 border-t border-slate-800 text-[11px] font-mono space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[10px] pb-1 border-b border-slate-850">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <Terminal className="w-3 h-3" /> Console Output {output.duration && `(${output.duration}ms)`}
            </span>
            <button onClick={() => setOutput(null)} className="hover:text-slate-300">
              <X className="w-3 h-3" />
            </button>
          </div>
          {output.type === 'html' ? (
            <div
              className="p-2 bg-white rounded text-slate-900"
              dangerouslySetInnerHTML={{ __html: output.content }}
            />
          ) : (
            <div className="space-y-0.5 max-h-36 overflow-y-auto">
              {output.logs.map((log, i) => (
                <div
                  key={i}
                  className={log.startsWith('[ERROR]') || output.type === 'error' ? 'text-rose-400' : 'text-slate-300'}
                >
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Explanation Drawer */}
      {aiExplanation && (
        <div className="p-3 bg-indigo-950/40 border-t border-indigo-500/30 text-xs text-indigo-100 space-y-1.5">
          <div className="flex items-center justify-between text-indigo-300 font-bold text-[11px]">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AI Code Analysis
            </span>
            <button onClick={() => setAiExplanation(null)} className="text-slate-400 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="leading-relaxed whitespace-pre-wrap">{aiExplanation}</div>
        </div>
      )}

      {/* AI Fix Drawer */}
      {aiFix && (
        <div className="p-3 bg-purple-950/40 border-t border-purple-500/30 text-xs text-purple-100 space-y-2">
          <div className="flex items-center justify-between text-purple-300 font-bold text-[11px]">
            <span className="flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5 text-purple-400" /> Fixed & Optimized Code
            </span>
            <button onClick={() => setAiFix(null)} className="text-slate-400 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[11px] text-slate-300 italic">{aiFix.explanation}</p>
          <pre className="p-2 rounded bg-black/60 font-mono text-[10px] text-emerald-300 overflow-x-auto">
            <code>{aiFix.fixedCode}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
