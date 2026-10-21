import React, { useState } from 'react';
import { Movie, MovieWatchStatus } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { Star, Bookmark, Play, Info, Flame, Trophy, Film, Eye, Sparkles, Trash2, Pencil } from 'lucide-react';
import { SharePopover } from './SharePopover';
import { TrackingStatusPicker } from './TrackingStatusPicker';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
  onOpenTrailer: (movie: Movie) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (movieId: string) => void;
  watchStatus?: MovieWatchStatus | null;
  onUpdateStatus?: (movieId: string, status: MovieWatchStatus | null) => void;
  onDeleteMovie?: (movieId: string) => void;
  viewMode?: 'grid' | 'compact';
  currentUser?: FirebaseUser | null;
  onOpenEdit?: (movie: Movie) => void;
  onOpenAuth?: () => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onSelect,
  onOpenTrailer,
  isWatchlisted,
  onToggleWatchlist,
  watchStatus,
  onUpdateStatus,
  onDeleteMovie,
  viewMode = 'grid',
  currentUser,
  onOpenEdit,
  onOpenAuth
}) => {
  const [imgError, setImgError] = useState(false);

  // Fallback banner if image fails
  const fallbackPoster = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
  const displayPoster = imgError ? fallbackPoster : (movie.posterUrl || fallbackPoster);

  if (viewMode === 'compact') {
    return (
      <div 
        id={`compact-movie-row-${movie.id}`}
        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all duration-200"
      >
        <div 
          onClick={() => onSelect(movie)}
          className="flex items-center gap-4 cursor-pointer min-w-0 flex-1"
        >
          <div className="relative w-14 h-20 sm:w-16 sm:h-24 rounded-lg overflow-hidden bg-slate-800 shrink-0 shadow-md">
            <img 
              src={displayPoster} 
              alt={movie.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {movie.featured && (
              <span className="absolute top-1 left-1 p-0.5 rounded bg-amber-500/90 text-slate-950">
                <Flame className="w-3 h-3 fill-current" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {movie.releaseYear}
              </span>
              <span className="text-xs text-slate-400">
                {movie.era.split('(')[0].trim()}
              </span>
              {movie.boxOfficeChampion && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ₦1B+ Club
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
              {movie.title}
            </h3>

            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
              Dir: <span className="text-slate-300">{movie.director}</span> • Starring: <span className="text-slate-300">{movie.leadCast.slice(0, 2).map(c => c.actor).join(', ')}</span>
            </p>

            <div className="flex items-center gap-2 mt-2">
              {Array.from(new Set(movie.genres)).slice(0, 2).map((g, idx) => (
                <span key={`${g}-${idx}`} className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-sm font-bold text-white">{movie.rating.toFixed(1)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenTrailer(movie)}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-emerald-600/20 text-slate-200 hover:text-emerald-300 border border-slate-700/60 hover:border-emerald-500/40 transition-colors"
              title="Watch Trailer"
            >
              <Play className="w-4 h-4" />
            </button>
            <SharePopover movieTitle={movie.title} movieId={movie.id} variant="icon-only" />
            {currentUser && movie.isUserAdded && onDeleteMovie && (
              <button
                id={`compact-delete-${movie.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Remove "${movie.title}" from your catalogue?`)) {
                    onDeleteMovie(movie.id);
                  }
                }}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/40 transition-colors"
                title="Remove Movie"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {currentUser && onOpenEdit && (
              <button
                id={`compact-edit-${movie.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenEdit(movie);
                }}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-emerald-600/30 text-slate-200 hover:text-emerald-300 border border-slate-700/60 hover:border-emerald-500/40 transition-colors"
                title="Edit Movie (Authenticated User)"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {currentUser && onUpdateStatus ? (
              <TrackingStatusPicker 
                movieId={movie.id}
                currentStatus={watchStatus || (isWatchlisted ? 'plan_to_watch' : null)}
                onUpdateStatus={onUpdateStatus}
                size="sm"
              />
            ) : (
              <button
                id={`compact-bookmark-${movie.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!currentUser) {
                    if (onOpenAuth) onOpenAuth();
                  } else {
                    onToggleWatchlist(movie.id);
                  }
                }}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  currentUser && isWatchlisted 
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm' 
                    : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title={!currentUser ? 'Sign in to add to Watchlist' : isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
              >
                <Bookmark className={`w-4 h-4 ${currentUser && isWatchlisted ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
            )}
            <button
              onClick={() => onSelect(movie)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sleek Grid Card View (Default)
  return (
    <div 
      id={`movie-card-${movie.id}`}
      className="group relative flex flex-col rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-emerald-950/30 hover:-translate-y-1 select-none"
    >
      {/* Top Banner / Poster */}
      <div 
        onClick={() => onSelect(movie)}
        className="relative aspect-[16/11] sm:aspect-[4/3] w-full min-h-[190px] sm:min-h-[220px] overflow-hidden bg-slate-950 cursor-pointer"
      >
        <img 
          src={displayPoster} 
          alt={movie.title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Gradient overlays for cinematic depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        <div className="absolute inset-0 bg-black/15 group-hover:bg-transparent transition-colors duration-300" />

        {/* Top Action Bar (Neat, semi-transparent row with adequate padding) */}
        <div className="absolute top-0 inset-x-0 px-3 py-2.5 sm:px-3.5 sm:py-3 flex items-center justify-between z-10 bg-gradient-to-b from-slate-950/85 via-slate-950/45 to-transparent pointer-events-none">
          {/* Left Badges (Year & Featured Flame) */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold tracking-wider bg-slate-950/85 backdrop-blur-md text-emerald-400 border border-emerald-500/30 shadow-sm">
              {movie.releaseYear}
            </span>
            {movie.featured && (
              <span 
                className="p-1 sm:px-2 sm:py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1 shadow-md"
                title="Featured Nollywood Cinema"
              >
                <Flame className="w-3 h-3 fill-current" />
                <span className="hidden sm:inline">Featured</span>
              </span>
            )}
          </div>

          {/* Right Action Icons Row (Neat semi-transparent pill container) */}
          <div className="pointer-events-auto flex items-center gap-1 bg-slate-950/80 backdrop-blur-md border border-slate-700/60 rounded-full px-1.5 py-1 shadow-md">
            {/* Delete button (Gated to authenticated creators/owners only) */}
            {currentUser && movie.isUserAdded && onDeleteMovie && (
              <button
                id={`delete-${movie.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Remove "${movie.title}" from your catalogue?`)) {
                    onDeleteMovie(movie.id);
                  }
                }}
                className="p-1.5 rounded-full text-slate-300 hover:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                title="Remove Movie"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Edit button (Gated to authenticated users only) */}
            {currentUser && onOpenEdit && (
              <button
                id={`edit-card-${movie.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenEdit(movie);
                }}
                className="p-1.5 rounded-full text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
                title="Edit Movie Details"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Popover Share Menu */}
            <SharePopover movieTitle={movie.title} movieId={movie.id} variant="icon-only" />

            {/* Watchlist / Multi-Status Tracking Button (Auth-gated) */}
            {currentUser && onUpdateStatus ? (
              <div onClick={(e) => e.stopPropagation()}>
                <TrackingStatusPicker 
                  movieId={movie.id}
                  currentStatus={watchStatus || (isWatchlisted ? 'plan_to_watch' : null)}
                  onUpdateStatus={onUpdateStatus}
                  size="icon-only"
                />
              </div>
            ) : (
              <button
                id={`bookmark-${movie.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!currentUser) {
                    if (onOpenAuth) onOpenAuth();
                  } else {
                    onToggleWatchlist(movie.id);
                  }
                }}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  currentUser && isWatchlisted
                    ? 'text-amber-400 bg-amber-400/20 hover:bg-amber-400/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title={!currentUser ? 'Sign in to add to Watchlist' : isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
              >
                <Bookmark className={`w-3.5 h-3.5 ${currentUser && isWatchlisted ? 'fill-current text-amber-400' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Play Trailer Floating Overlay on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenTrailer(movie);
            }}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-xl shadow-emerald-950/60 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Watch Trailer</span>
          </button>
        </div>

        {/* Bottom edge info within image (Ratings & Runtime neatly anchored) */}
        <div className="absolute bottom-0 inset-x-0 px-3 py-2.5 sm:px-3.5 sm:py-3 flex items-center justify-between text-xs pointer-events-none bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-800/80 shadow-sm pointer-events-auto">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="font-bold text-white text-[11px]">{movie.rating.toFixed(1)}</span>
            <span className="text-[10px] text-slate-400">/10</span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-200 bg-slate-950/85 backdrop-blur-md border border-slate-800/80 shadow-sm pointer-events-auto">
            {movie.runtimeMinutes || 105} min
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-4 sm:p-5 space-y-3 bg-slate-900/80 group-hover:bg-slate-900 transition-colors">
        {/* Genre Tags, Box Office Champion Pill & Era */}
        <div className="flex flex-wrap items-center gap-1.5 min-h-[22px]">
          {movie.boxOfficeChampion && (
            <span className="px-2 py-0.5 text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-full flex items-center gap-1 shadow-sm">
              <Trophy className="w-3 h-3 text-amber-400" />
              ₦1B+ Club
            </span>
          )}
          {Array.from(new Set(movie.genres)).slice(0, 2).map((genre, idx) => (
            <span 
              key={`${genre}-${idx}`}
              className="px-2.5 py-0.5 text-[10px] font-semibold text-slate-300 bg-slate-800/80 rounded-full border border-slate-700/40"
            >
              {genre}
            </span>
          ))}
          <span className="text-[10px] text-slate-400 font-medium ml-auto">
            {movie.era.split('(')[0].trim()}
          </span>
        </div>

        {/* Title and Native Title */}
        <div>
          <h3 
            onClick={() => onSelect(movie)}
            className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 cursor-pointer"
            title={movie.title}
          >
            {movie.title}
          </h3>
          {movie.nativeTitle && (
            <p className="text-[11px] text-emerald-400/80 italic font-medium truncate mt-0.5">
              "{movie.nativeTitle}"
            </p>
          )}
          <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
            {movie.tagline || movie.synopsis}
          </p>
        </div>

        {/* Cast & Director */}
        <div className="text-xs text-slate-400 border-t border-slate-800/80 pt-2.5 space-y-1 mt-auto">
          <p className="line-clamp-1 text-[11px]">
            <span className="text-slate-500">Dir:</span> <span className="text-slate-300 font-medium">{movie.director}</span>
          </p>
          <p className="line-clamp-1 text-[11px]">
            <span className="text-slate-500">Starring:</span> <span className="text-slate-300">{movie.leadCast.slice(0, 2).map(c => c.actor).join(', ')}</span>
          </p>
        </div>

        {/* Action button & Popover Share button */}
        <div className="pt-2 flex items-center gap-2">
          <button
            onClick={() => onSelect(movie)}
            className="flex-1 py-2 text-center text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-emerald-600 text-slate-200 hover:text-white transition-all duration-200 shadow-sm cursor-pointer"
          >
            View Film Archive
          </button>
          <SharePopover movieTitle={movie.title} movieId={movie.id} variant="card-button" />
        </div>

      </div>
    </div>
  );
};
