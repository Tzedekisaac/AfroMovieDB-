import React, { useState } from 'react';
import { Sparkles, Film, RefreshCw, X, ChevronUp, ChevronDown, CheckCircle2, History } from 'lucide-react';
import { HistoricalSweepProgress } from '../utils/api';

interface HistoricalSweepPillProps {
  progress: HistoricalSweepProgress | null;
  isRunning: boolean;
  onTriggerSweep: () => void;
  onDismiss: () => void;
}

export const HistoricalSweepPill: React.FC<HistoricalSweepPillProps> = ({
  progress,
  isRunning,
  onTriggerSweep,
  onDismiss
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // If not running and no recent progress, show the unobtrusive launch pill
  if (!isRunning && (!progress || progress.percent === 100 && !progress.statusText)) {
    return (
      <div className="fixed bottom-5 right-5 z-40 animate-in fade-in duration-300">
        <button
          onClick={onTriggerSweep}
          id="btn-trigger-historical-sweep"
          className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-800 text-slate-200 hover:text-white border border-emerald-500/30 hover:border-emerald-400/70 shadow-xl shadow-black/60 transition-all backdrop-blur-md active:scale-95 text-xs font-semibold"
          title="Run multi-decade historical Nollywood import sweep (1980s-2020s)"
        >
          <History className="w-4 h-4 text-emerald-400 group-hover:rotate-45 transition-transform" />
          <span>Historical Archive Sweep</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-mono tracking-wider border border-emerald-500/30">
            5 Eras
          </span>
        </button>
      </div>
    );
  }

  // When active or just completed:
  const isComplete = progress?.isComplete;

  return (
    <div className="fixed bottom-5 right-5 z-40 max-w-sm w-full px-3 sm:px-0 sm:w-96 animate-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl shadow-black/80 backdrop-blur-xl p-4 text-slate-100">
        
        {/* Header Strip */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {isRunning ? (
              <div className="relative flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
            ) : isComplete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Film className="w-4 h-4 text-amber-400 shrink-0" />
            )}

            <h4 className="text-xs font-bold text-white tracking-wide truncate">
              {isRunning 
                ? (progress?.decadeLabel ? `Scanning ${progress.decadeLabel}` : 'Historical Cinema Sweep')
                : (isComplete ? 'Historical Sweep Completed' : 'Historical Archive')}
            </h4>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title={isCollapsed ? "Expand details" : "Collapse"}
            >
              {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expandable Body */}
        {!isCollapsed && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-baseline justify-between text-xs font-mono">
              <span className="text-emerald-400 font-semibold">
                {progress?.importedCount || 0} Classic Films Added
              </span>
              <span className="text-slate-400">
                {progress?.percent || 0}%
              </span>
            </div>

            {/* Clean Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-300 rounded-full"
                style={{ width: `${progress?.percent || 0}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              {progress?.statusText || 'Querying TMDb Nollywood archive across multiple decades with strict deduplication...'}
            </p>

            {/* Action Bar when completed */}
            {isComplete && (
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Strict Deduplication Applied</span>
                <button
                  onClick={onTriggerSweep}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Re-run Sweep</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
