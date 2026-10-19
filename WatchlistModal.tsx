import React, { useState } from 'react';
import { Movie } from '../types';
import { X, Bookmark, Trash2, Play, ExternalLink, Star, ChevronDown } from 'lucide-react';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlistMovies: Movie[];
  onRemoveFromWatchlist: (movieId: string) => void;
  onClearWatchlist: () => void;
  onSelectMovie: (movie: Movie) => void;
  onOpenTrailer: (movie: Movie) => void;
}

export const WatchlistModal: React.FC<WatchlistModalProps> = ({
  isOpen,
  onClose,
  watchlistMovies,
  onRemoveFromWatchlist,
  onClearWatchlist,
  onSelectMovie,
  onOpenTrailer
}) => {
  const [displayCount, setDisplayCount] = useState(12);

  if (!isOpen) return null;

  const visibleMovies = watchlistMovies.slice(0, displayCount);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        id="watchlist-modal-container"
        className="relative w-full max-w-2xl bg-[#0e131d] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                My Nollywood Watchlist
              </h2>
              <p className="text-xs text-slate-400">
                {watchlistMovies.length} movie{watchlistMovies.length !== 1 ? 's' : ''} saved for your next Nigerian movie night
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {watchlistMovies.length > 0 && (
              <button
                id="clear-watchlist-btn"
                onClick={onClearWatchlist}
                className="p-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1"
                title="Clear all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}
            <button
              id="close-watchlist-modal-btn"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-3 flex-1">
          {watchlistMovies.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Bookmark className="w-12 h-12 text-slate-700 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-300">Your Watchlist is empty</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click the bookmark icon on any Nigerian film card in the catalogue to save it here for later.
              </p>
            </div>
          ) : (
            <>
              {visibleMovies.map((movie) => (
                <div
                  key={movie.id}
                  id={`watchlist-item-${movie.id}`}
                  className="group bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors"
                >
                  {/* Left Poster & title */}
                  <div 
                    onClick={() => {
                      onSelectMovie(movie);
                      onClose();
                    }}
                    className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                  >
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-12 h-16 sm:w-14 sm:h-20 object-cover rounded-lg shrink-0 bg-slate-950"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-400">
                          {movie.releaseYear}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                          {movie.genres[0]}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-400 truncate transition-colors">
                        {movie.title}
                      </h4>
                      <p className="text-xs text-slate-400 truncate">
                        Dir: {movie.director} • ⭐ {movie.rating}/10
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        onOpenTrailer(movie);
                        onClose();
                      }}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Watch Trailer"
                    >
                      <Play className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onRemoveFromWatchlist(movie.id)}
                      className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {displayCount < watchlistMovies.length && (
                <div className="pt-2 pb-1 flex justify-center">
                  <button
                    onClick={() => setDisplayCount(prev => prev + 12)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Load More ({Math.min(12, watchlistMovies.length - displayCount)} more)</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-center text-xs text-slate-400">
          Watchlist is saved locally in your browser so you won't lose your selections.
        </div>
      </div>
    </div>
  );
};
