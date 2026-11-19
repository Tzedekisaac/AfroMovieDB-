import React from 'react';
import { Film, Star, Play, RotateCcw, ChevronDown } from 'lucide-react';
import type { Movie, MovieWatchStatus, UserTrackedItem } from '../../types';
import { TrackingStatusPicker, STATUS_CONFIG } from '../TrackingStatusPicker';

interface ProfileTrackedTabProps {
  visibleTracked: Array<{ item: UserTrackedItem; movie: Movie }>;
  totalFilteredCount: number;
  hasMoreTracked: boolean;
  searchFilter: string;
  onLoadMore: () => void;
  onBackToCatalogue: () => void;
  onSelectMovie: (movie: Movie) => void;
  onOpenTrailer: (movie: Movie) => void;
  onUpdateStatus?: (movieId: string, status: MovieWatchStatus | null) => void;
  onUpdateRewatchCount?: (movieId: string, count: number) => void;
}

export const ProfileTrackedTab: React.FC<ProfileTrackedTabProps> = ({
  visibleTracked,
  totalFilteredCount,
  hasMoreTracked,
  searchFilter,
  onLoadMore,
  onBackToCatalogue,
  onSelectMovie,
  onOpenTrailer,
  onUpdateStatus,
  onUpdateRewatchCount
}) => {
  return (
    <div className="space-y-6">
      {visibleTracked.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 space-y-3">
          <Film className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">
            No movies found in this list
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchFilter
              ? 'Try clearing your search filter.'
              : 'Browse the NaijaReel catalog and select a status on any movie.'}
          </p>
          <button
            onClick={onBackToCatalogue}
            className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
          >
            Discover Nollywood Films
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7 lg:gap-8">
            {visibleTracked.map(({ item, movie }) => {
              const statusCfg = STATUS_CONFIG[item.status];
              const IconComp = statusCfg.icon;

              return (
                <div
                  key={`${item.movieId}-${item.status}`}
                  className="group flex flex-col rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 overflow-hidden shadow-lg transition-all"
                >
                  {/* Top Poster banner */}
                  <div
                    className="relative aspect-[16/10] bg-slate-950 overflow-hidden cursor-pointer"
                    onClick={() => onSelectMovie(movie)}
                  >
                    <img
                      src={movie.backdropUrl || movie.posterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                    {/* Status Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${statusCfg.bgClass} ${statusCfg.colorClass} ${statusCfg.borderClass}`}
                      >
                        <IconComp className="w-3 h-3" />
                        <span>{statusCfg.label}</span>
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/80 text-amber-400 text-xs font-bold border border-slate-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{movie.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                    <div>
                      <h4
                        onClick={() => onSelectMovie(movie)}
                        className="text-base font-bold text-white hover:text-emerald-400 transition-colors cursor-pointer line-clamp-1"
                      >
                        {movie.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {movie.releaseYear} • Dir. {movie.director}
                      </p>

                      <div className="flex flex-wrap items-center gap-1 mt-2">
                        {Array.from(new Set(movie.genres)).slice(0, 2).map((g, idx) => (
                          <span key={`${g}-${idx}`} className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Rewatch Counter for Completed Films */}
                    {item.status === 'completed' && onUpdateRewatchCount && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                        <span className="flex items-center gap-1 font-medium">
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Rewatched:</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              onUpdateRewatchCount(item.movieId, Math.max(0, (item.rewatchCount || 0) - 1))
                            }
                            className="w-5 h-5 rounded flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-colors"
                            title="Decrease rewatches"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-white text-xs w-4 text-center">
                            {item.rewatchCount || 0}
                          </span>
                          <button
                            onClick={() => onUpdateRewatchCount(item.movieId, (item.rewatchCount || 0) + 1)}
                            className="w-5 h-5 rounded flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-colors"
                            title="Add rewatch"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      {onUpdateStatus && (
                        <TrackingStatusPicker
                          movieId={movie.id}
                          currentStatus={item.status}
                          onUpdateStatus={onUpdateStatus}
                          size="sm"
                        />
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onOpenTrailer(movie)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Play Trailer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          onClick={() => onSelectMovie(movie)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {hasMoreTracked && (
            <div className="pt-6 flex flex-col items-center justify-center gap-2">
              <span className="text-xs text-slate-400">
                Showing <strong className="text-white">{visibleTracked.length}</strong> of{' '}
                <strong className="text-white">{totalFilteredCount}</strong> tracked films
              </span>
              <button
                onClick={onLoadMore}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700/80 hover:border-emerald-500/50 text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                <ChevronDown className="w-4 h-4" />
                <span>Load More</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
