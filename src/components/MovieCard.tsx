import React, { useState, useEffect, useMemo } from 'react';
import { Movie, MovieWatchStatus, UserReview } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { Star, Bookmark, Play, Flame, Trophy, Pencil, Film } from 'lucide-react';
import { SharePopover } from './SharePopover';
import { TrackingStatusPicker } from './TrackingStatusPicker';
import { calculateMovieRatingBreakdown, subscribeToMovieReviews } from '../lib/firestoreService';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
  onOpenTrailer: (movie: Movie) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (movieId: string) => void;
  watchStatus?: MovieWatchStatus | null;
  onUpdateStatus?: (movieId: string, status: MovieWatchStatus | null) => void;
  viewMode?: 'grid' | 'compact';
  currentUser?: FirebaseUser | null;
  onOpenEdit?: (movie: Movie) => void;
  onOpenAuth?: () => void;
  reviews?: UserReview[];
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onSelect,
  onOpenTrailer,
  isWatchlisted,
  onToggleWatchlist,
  watchStatus,
  onUpdateStatus,
  viewMode = 'grid',
  currentUser,
  onOpenEdit,
  onOpenAuth,
  reviews
}) => {
  const [imgError, setImgError] = useState(false);
  const [internalReviews, setInternalReviews] = useState<UserReview[]>(() => {
    if (reviews !== undefined) {
      return reviews.filter(r => r.movieId === movie.id);
    }
    return [];
  });

  // Subscribe to movie reviews if reviews prop was not passed down from parent
  useEffect(() => {
    if (reviews !== undefined) {
      setInternalReviews(reviews.filter(r => r.movieId === movie.id));
      return;
    }

    const unsub = subscribeToMovieReviews(movie.id, (loadedReviews) => {
      setInternalReviews(loadedReviews || []);
    });
    return () => unsub();
  }, [movie.id, reviews]);

  const activeReviews = reviews !== undefined ? reviews.filter(r => r.movieId === movie.id) : internalReviews;
  const ratingMetrics = useMemo(() => {
    return calculateMovieRatingBreakdown(activeReviews);
  }, [activeReviews]);

  // Reset imgError if movie posterUrl changes via onSnapshot stream
  useEffect(() => {
    setImgError(false);
  }, [movie.posterUrl, movie.backdropUrl, movie.id]);

  // Dynamic visual asset resolution: strictly eliminates hardcoded defaults and external stock placeholders
  const rawPoster = movie.posterUrl && typeof movie.posterUrl === 'string' ? movie.posterUrl.trim() : '';
  const rawBackdrop = movie.backdropUrl && typeof movie.backdropUrl === 'string' ? movie.backdropUrl.trim() : '';

  const isPlaceholder = (url: string) => {
    return (
      url.includes('unsplash.com') ||
      url.includes('placeholder.com') ||
      url.includes('dummyimage.com') ||
      url.includes('via.placeholder')
    );
  };

  const dynamicVisualUrl = useMemo(() => {
    if (imgError) return null;
    if (rawPoster && !isPlaceholder(rawPoster)) return rawPoster;
    if (rawBackdrop && !isPlaceholder(rawBackdrop)) return rawBackdrop;
    return null;
  }, [rawPoster, rawBackdrop, imgError]);

  const handleProtectedAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
    } else {
      action();
    }
  };

  // Compact List View Mode
  if (viewMode === 'compact') {
    return (
      <div 
        id={`compact-movie-row-${movie.id}`}
        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/75 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <div 
          onClick={() => onSelect(movie)}
          className="flex items-center gap-4 cursor-pointer min-w-0 flex-1"
        >
          <div className="relative w-16 h-24 sm:w-20 sm:h-28 rounded-xl overflow-hidden bg-slate-950 shrink-0 shadow-md border border-slate-800/80 flex items-center justify-center">
            {dynamicVisualUrl ? (
              <img 
                src={dynamicVisualUrl} 
                alt={movie.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full p-2 flex flex-col items-center justify-center text-center bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/70 group-hover:from-slate-800 transition-colors">
                <Film className="w-5 h-5 text-emerald-400 mb-1 shrink-0" />
                <span className="text-[10px] font-bold text-white line-clamp-2 leading-tight">
                  {movie.title}
                </span>
                <span className="text-[9px] text-emerald-400 font-semibold mt-0.5">
                  {movie.releaseYear}
                </span>
              </div>
            )}
            {movie.featured && (
              <span className="absolute top-1 left-1 p-0.5 rounded bg-amber-500 text-slate-950 shadow z-10">
                <Flame className="w-3 h-3 fill-current" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {movie.releaseYear}
              </span>
              <span className="text-xs text-slate-400 truncate max-w-[180px]">
                {movie.era.split('(')[0].trim()}
              </span>
              {movie.boxOfficeChampion && (
                <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ₦1B+ Club
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
              {movie.title}
            </h3>

            <p className="text-xs text-slate-400 line-clamp-1">
              Dir: <span className="text-slate-300 font-medium">{movie.director}</span> • Starring: <span className="text-slate-300">{movie.leadCast.slice(0, 2).map(c => c.actor).join(', ')}</span>
            </p>

            <div className="flex items-center gap-1.5 pt-0.5">
              {Array.from(new Set(movie.genres)).slice(0, 2).map((g, idx) => (
                <span key={`${g}-${idx}`} className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/50">
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800 shrink-0">
          {ratingMetrics.total > 0 ? (
            <div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-inner"
              title={`${ratingMetrics.total} community review${ratingMetrics.total === 1 ? '' : 's'}`}
            >
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold text-white">{ratingMetrics.average10}</span>
              <span className="text-[10px] text-slate-400">/10</span>
            </div>
          ) : (
            <div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-800/80 text-slate-400 shadow-inner"
              title="No community reviews yet"
            >
              <Star className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-400">Unrated</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenTrailer(movie)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-emerald-600/20 text-slate-200 hover:text-emerald-300 border border-slate-700/60 hover:border-emerald-500/40 transition-colors cursor-pointer"
              title="Watch Trailer"
            >
              <Play className="w-4 h-4" />
            </button>
            
            <SharePopover movieTitle={movie.title} movieId={movie.id} variant="icon-only" />

            {currentUser && onOpenEdit && (
              <button
                id={`compact-edit-${movie.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenEdit(movie);
                }}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-emerald-600/30 text-slate-200 hover:text-emerald-300 border border-slate-700/60 hover:border-emerald-500/40 transition-colors cursor-pointer"
                title="Edit Movie Details"
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
                onClick={(e) => handleProtectedAction(e, () => onToggleWatchlist(movie.id))}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
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
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Cinematic Portrait Grid Card View
  return (
    <div 
      id={`movie-card-${movie.id}`}
      className="group relative flex flex-col h-full rounded-3xl bg-slate-900/85 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-emerald-950/20 hover:-translate-y-1 select-none"
    >
      {/* Top Banner / Poster Container with standard movie portrait ratio */}
      <div 
        onClick={() => onSelect(movie)}
        className="relative aspect-[3/4] w-full overflow-hidden bg-slate-950 cursor-pointer"
      >
        {dynamicVisualUrl ? (
          <img 
            src={dynamicVisualUrl} 
            alt={movie.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full p-6 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-[#0a101d] to-emerald-950/80 relative overflow-hidden group-hover:to-emerald-950 transition-all duration-500">
            {/* Ambient Background Aura */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="pt-10 z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 shadow-inner">
                <Film className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-400/90 block mb-1">
                {movie.era.split('(')[0].trim()}
              </span>
              <h4 className="text-lg font-black text-white leading-snug line-clamp-3 font-cinema group-hover:text-emerald-300 transition-colors">
                {movie.title}
              </h4>
            </div>

            <div className="z-10 pb-2">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {Array.from(new Set(movie.genres)).slice(0, 2).map((g, idx) => (
                  <span key={`${g}-${idx}`} className="text-[10px] font-semibold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                    {g}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                Dir: {movie.director}
              </p>
            </div>
          </div>
        )}

        {/* Cinematic gradient depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-black/15 group-hover:bg-transparent transition-colors duration-300 pointer-events-none" />

        {/* Top Floating Bar: Badges Left, Actions Right */}
        <div className="absolute top-0 inset-x-0 p-3 sm:p-3.5 flex items-center justify-between z-10 bg-gradient-to-b from-slate-950/85 via-slate-950/40 to-transparent pointer-events-none">
          {/* Left Badges: Year & Featured */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold tracking-wider bg-slate-950/85 backdrop-blur-md text-emerald-400 border border-emerald-500/30 shadow-md">
              {movie.releaseYear}
            </span>
            {movie.featured && (
              <span 
                className="px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1 shadow-md"
                title="Featured Nollywood Cinema"
              >
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Featured</span>
              </span>
            )}
          </div>

          {/* Right Action Icons Pill */}
          <div className="pointer-events-auto flex items-center gap-1 bg-slate-950/85 backdrop-blur-md border border-slate-700/60 rounded-full p-1 shadow-md">
            {/* Edit Button (Authenticated Users) */}
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

            {/* Share Popover */}
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
                onClick={(e) => handleProtectedAction(e, () => onToggleWatchlist(movie.id))}
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

        {/* Hover Trailer Overlay Button */}
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

        {/* Bottom Floating Stats Bar */}
        <div className="absolute bottom-0 inset-x-0 p-3 sm:p-3.5 flex items-center justify-between pointer-events-none bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent z-10">
          {ratingMetrics.total > 0 ? (
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-800/80 shadow-md pointer-events-auto"
              title={`${ratingMetrics.total} community review${ratingMetrics.total === 1 ? '' : 's'}`}
            >
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="font-bold text-white text-xs">{ratingMetrics.average10}</span>
              <span className="text-[10px] text-slate-400">/10</span>
            </div>
          ) : (
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/75 backdrop-blur-md border border-slate-800/80 shadow-md pointer-events-auto"
              title="No community reviews yet"
            >
              <Star className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-400 text-xs">Unrated</span>
            </div>
          )}
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-200 bg-slate-950/85 backdrop-blur-md border border-slate-800/80 shadow-md pointer-events-auto">
            {movie.runtimeMinutes || 105} min
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-4 sm:p-5 justify-between space-y-3 bg-slate-900/80 group-hover:bg-slate-900 transition-colors">
        
        {/* Top Badges & Genres Row */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {movie.boxOfficeChampion && (
              <span className="px-2 py-0.5 text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-full flex items-center gap-1 shadow-sm shrink-0">
                <Trophy className="w-3 h-3 text-amber-400" />
                ₦1B+ Club
              </span>
            )}
            {Array.from(new Set(movie.genres)).slice(0, 2).map((genre, idx) => (
              <span 
                key={`${genre}-${idx}`}
                className="px-2.5 py-0.5 text-[10px] font-semibold text-slate-300 bg-slate-800/90 rounded-full border border-slate-700/50 shrink-0"
              >
                {genre}
              </span>
            ))}
            <span className="text-[10px] text-slate-400 font-medium ml-auto truncate max-w-[120px]">
              {movie.era.split('(')[0].trim()}
            </span>
          </div>

          {/* Title, Native Title & Tagline */}
          <div className="space-y-1">
            <h3 
              onClick={() => onSelect(movie)}
              className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 cursor-pointer"
              title={movie.title}
            >
              {movie.title}
            </h3>
            {movie.nativeTitle && (
              <p className="text-[11px] text-emerald-400/90 italic font-medium truncate">
                "{movie.nativeTitle}"
              </p>
            )}
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {movie.tagline || movie.synopsis}
            </p>
          </div>
        </div>

        {/* Bottom Metadata & CTAs */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80 mt-auto">
          {/* Filmmaker and Starring details */}
          <div className="text-xs text-slate-400 space-y-1">
            <p className="line-clamp-1 text-[11px]">
              <span className="text-slate-500">Dir:</span> <span className="text-slate-300 font-medium">{movie.director}</span>
            </p>
            <p className="line-clamp-1 text-[11px]">
              <span className="text-slate-500">Starring:</span> <span className="text-slate-300">{movie.leadCast.slice(0, 2).map(c => c.actor).join(', ')}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onSelect(movie)}
              className="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white transition-all duration-200 shadow-sm cursor-pointer"
            >
              View Film Archive
            </button>
            <SharePopover movieTitle={movie.title} movieId={movie.id} variant="card-button" />
          </div>
        </div>

      </div>
    </div>
  );
};
