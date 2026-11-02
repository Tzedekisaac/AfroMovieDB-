import React, { useState } from 'react';
import { RefreshCw, X, ChevronUp, ChevronDown, CheckCircle2, History, Check, Sparkles } from 'lucide-react';
import { HistoricalSweepProgress } from '../utils/api';

interface HistoricalSweepPillProps {
  progress: HistoricalSweepProgress | null;
  isRunning: boolean;
  isFinishing?: boolean;
  isCancelling?: boolean;
  onTriggerSweep: () => void;
  onFinishSweep?: () => void;
  onCancelSweep?: () => void;
  onDismiss: () => void;
}

export const HistoricalSweepPill: React.FC<HistoricalSweepPillProps> = ({
  progress,
  isRunning,
  isFinishing = false,
  isCancelling = false,
  onTriggerSweep,
  onFinishSweep,
  onCancelSweep,
  onDismiss
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // If there is no active or recent progress data at all, render the compact launch button
  if (!isRunning && !progress) {
    return (
      <div 
        className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-40 max-w-[calc(100vw-1.5rem)] animate-in fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTriggerSweep();
          }}
          id="btn-trigger-historical-sweep"
          className="group flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-800 text-slate-200 hover:text-white border border-emerald-500/30 hover:border-emerald-400/70 shadow-lg shadow-black/60 transition-all backdrop-blur-md active:scale-95 text-xs font-semibold cursor-pointer"
          title="Run multi-decade historical Nollywood import sweep (1980s-2020s)"
        >
          <History className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-45 transition-transform" />
          <span>Historical Archive Sweep</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-mono tracking-wider border border-emerald-500/30">
            5 Eras
          </span>
        </button>
      </div>
    );
  }

  // Determine state flags
  const isFinished = Boolean(
    progress?.isComplete || 
    (progress?.percent !== undefined && progress.percent >= 100) || 
    progress?.decadeLabel === 'Complete'
  );
  const isFinishingActive = Boolean(isFinishing || isCancelling);
  const isSaving = Boolean(progress?.isSaving || progress?.firestoreSaveStarted);

  // Trigger stop & safe cloud export
  const handleFinishClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFinishingActive) return;
    if (onFinishSweep) {
      onFinishSweep();
    } else if (onCancelSweep) {
      onCancelSweep();
    }
  };

  return (
    <aside
      aria-label="Historical Archive Sweep Progress"
      className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-40 max-w-[calc(100vw-1.5rem)] w-[calc(100vw-1.5rem)] sm:w-80 md:w-[330px] animate-in slide-in-from-bottom-3 duration-200 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="rounded-xl sm:rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl shadow-black/80 backdrop-blur-xl p-2.5 sm:p-3 text-slate-100 transition-all duration-200">
        
        {/* Header Strip */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isRunning ? (
              <div className="relative flex items-center justify-center shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute" />
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
            ) : isFinished ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <History className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}

            <h4 className="text-xs font-bold text-white tracking-wide truncate">
              {isFinishingActive
                ? 'Exporting to cloud…'
                : isSaving
                  ? 'Saving archive…'
                  : isFinished
                    ? 'Archive Sweep'
                    : isRunning
                      ? (progress?.decadeLabel ? `Scanning ${progress.decadeLabel}` : 'Cinema Sweep')
                      : 'Historical Archive'}
            </h4>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Interactive "Finished" button while sweep is running; badge once completed */}
            {isRunning ? (
              <button
                onClick={handleFinishClick}
                disabled={isFinishingActive}
                id="btn-finish-historical-sweep"
                className="flex items-center gap-1 rounded-full px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 hover:border-emerald-400 active:scale-95 disabled:cursor-wait disabled:opacity-75 transition-all shadow-xs cursor-pointer"
                title={isFinishingActive ? 'Saving swept films to Cloud Firestore…' : 'Stop background loop now and save all processed films'}
              >
                {isFinishingActive ? (
                  <>
                    <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400 animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3 text-emerald-400 stroke-[2.5]" />
                    <span>Finished</span>
                  </>
                )}
              </button>
            ) : isFinished ? (
              <div 
                id="sweep-status-finished-badge"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 text-[10px] font-semibold tracking-wide shrink-0 animate-in fade-in zoom-in-95 duration-200"
              >
                <Check className="w-3 h-3 text-emerald-400 stroke-[2.5]" />
                <span>Finished</span>
              </div>
            ) : null}

            {/* Collapse / Expand toggle button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(prev => !prev);
              }}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand details' : 'Collapse'}
            >
              {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Dismiss (X) button when complete or inactive */}
            {(!isRunning || isFinished) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Expandable Body */}
        {!isCollapsed && (
          <div className="space-y-1.5 pt-2">
            {/* Metric Strip */}
            <div className="flex items-baseline justify-between text-[11px] font-mono">
              <span className="text-slate-300 truncate max-w-[150px]">
                {isFinished 
                  ? 'All 5 Eras Scanned'
                  : progress?.decadeLabel || 'Preparing scan'}
                {!isFinished && progress?.page ? ` • ${progress.page}/${progress.totalPages}` : ''}
              </span>
              <span className="text-emerald-400 font-semibold shrink-0">
                {progress?.importedCount || 0} films
              </span>
              <span className="text-slate-400 shrink-0">
                {isFinished ? 100 : (progress?.percent || 0)}%
              </span>
            </div>

            {/* Slim, Elegant Progress Bar */}
            <div className="w-full h-1 sm:h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-300 rounded-full"
                style={{ width: `${isFinished ? 100 : (progress?.percent || 0)}%` }}
              />
            </div>

            {/* Status Summary Line */}
            <p className="text-[10px] text-slate-300/90 leading-tight line-clamp-2 font-sans">
              {progress?.statusText || (isFinished ? 'Historical sweep completed across multiple eras.' : 'Querying Nollywood archives...')}
            </p>

            {/* Action Bar when Completed */}
            {isFinished && (
              <div className="pt-1 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                  <span>{progress?.importedCount || 0} films saved to Firestore</span>
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTriggerSweep();
                  }}
                  className="flex items-center gap-1 font-semibold text-slate-300 hover:text-emerald-300 transition-colors py-0.5 px-1.5 rounded hover:bg-slate-800 cursor-pointer"
                  title="Run another historical sweep"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Re-run</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
