import React, { useState, useRef, useEffect } from 'react';
import { 
  Bookmark, Eye, CheckCircle2, PauseCircle, XCircle, 
  ChevronDown, Trash2, Check, Clock 
} from 'lucide-react';
import { MovieWatchStatus } from '../types';

export const STATUS_CONFIG: Record<MovieWatchStatus, {
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}> = {
  plan_to_watch: {
    label: 'Plan to Watch',
    shortLabel: 'Plan',
    icon: Bookmark,
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/15',
    borderClass: 'border-amber-500/30'
  },
  watching: {
    label: 'Currently Watching',
    shortLabel: 'Watching',
    icon: Eye,
    colorClass: 'text-sky-400',
    bgClass: 'bg-sky-500/15',
    borderClass: 'border-sky-500/30'
  },
  completed: {
    label: 'Completed',
    shortLabel: 'Completed',
    icon: CheckCircle2,
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/15',
    borderClass: 'border-emerald-500/30'
  },
  on_hold: {
    label: 'On Hold',
    shortLabel: 'On Hold',
    icon: PauseCircle,
    colorClass: 'text-violet-400',
    bgClass: 'bg-violet-500/15',
    borderClass: 'border-violet-500/30'
  },
  dropped: {
    label: 'Dropped',
    shortLabel: 'Dropped',
    icon: XCircle,
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-500/15',
    borderClass: 'border-rose-500/30'
  }
};

interface TrackingStatusPickerProps {
  movieId: string;
  currentStatus?: MovieWatchStatus | null;
  onUpdateStatus: (movieId: string, status: MovieWatchStatus | null) => void;
  size?: 'sm' | 'md' | 'icon-only';
  className?: string;
}

export const TrackingStatusPicker: React.FC<TrackingStatusPickerProps> = ({
  movieId,
  currentStatus,
  onUpdateStatus,
  size = 'md',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const activeConfig = currentStatus ? STATUS_CONFIG[currentStatus] : null;

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {size === 'icon-only' ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={`p-2 rounded-lg border transition-all ${
            activeConfig
              ? `${activeConfig.bgClass} ${activeConfig.borderClass} ${activeConfig.colorClass}`
              : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
          }`}
          title={activeConfig ? `Tracked: ${activeConfig.label}` : 'Track this film'}
        >
          {activeConfig ? (
            <activeConfig.icon className="w-4 h-4 fill-current" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </button>
      ) : size === 'sm' ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
            activeConfig
              ? `${activeConfig.bgClass} ${activeConfig.borderClass} ${activeConfig.colorClass}`
              : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          {activeConfig ? (
            <activeConfig.icon className="w-3.5 h-3.5" />
          ) : (
            <Bookmark className="w-3.5 h-3.5" />
          )}
          <span>{activeConfig ? activeConfig.shortLabel : 'Track'}</span>
          <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
            activeConfig
              ? `${activeConfig.bgClass} ${activeConfig.borderClass} ${activeConfig.colorClass} shadow-md`
              : 'bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700'
          }`}
        >
          {activeConfig ? (
            <activeConfig.icon className="w-4 h-4" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
          <span>{activeConfig ? activeConfig.label : 'Add to Watchlist / Tracking'}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-1" />
        </button>
      )}

      {/* Popover Menu */}
      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl p-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Set Watch Status
          </div>

          <div className="space-y-0.5 mt-1">
            {(Object.keys(STATUS_CONFIG) as MovieWatchStatus[]).map((statusKey) => {
              const cfg = STATUS_CONFIG[statusKey];
              const isSelected = currentStatus === statusKey;
              const IconComp = cfg.icon;

              return (
                <button
                  key={statusKey}
                  onClick={() => {
                    onUpdateStatus(movieId, statusKey);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isSelected 
                      ? `${cfg.bgClass} ${cfg.colorClass} font-semibold` 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <IconComp className={`w-3.5 h-3.5 ${cfg.colorClass}`} />
                    <span>{cfg.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>

          {currentStatus && (
            <div className="pt-1 mt-1 border-t border-slate-800">
              <button
                onClick={() => {
                  onUpdateStatus(movieId, null);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove from Tracking</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
