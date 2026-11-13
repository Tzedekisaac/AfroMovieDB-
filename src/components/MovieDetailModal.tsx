import React, { useState, useEffect, useMemo } from 'react';
import { Movie, UserReview, MovieWatchStatus } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  X, Play, Star, Bookmark, Trophy, Flame, 
  ExternalLink, Calendar, Clock, Globe, Film, 
  User, MessageSquare, Send, CheckCircle2, Share2, Pencil, RotateCw, RotateCcw, Plus, Minus
} from 'lucide-react';
import { PersonHeadshot } from './PersonHeadshot';
import { PersonProfileModal } from './PersonProfileModal';
import { pullMovieDetailsFromOnline, WebMovieCandidate } from '../utils/api';
import { TrackingStatusPicker } from './TrackingStatusPicker';
import { ReviewSection } from './ReviewSection';
import { calculateMovieRatingBreakdown, subscribeToMovieReviews } from '../lib/firestoreService';

interface MovieDetailModalProps {
  movie: Movie | null;
  onClose: () => void;
  onOpenTrailer: (movie: Movie) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (movieId: string) => void;
  watchStatus?: MovieWatchStatus | null;
  onUpdateStatus?: (movieId: string, status: MovieWatchStatus | null) => void;
  rewatchCount?: number;
  onUpdateRewatchCount?: (movieId: string, count: number) => void;
  allMovies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  reviews?: UserReview[];
  onAddReview?: (review: Omit<UserReview, 'id' | 'createdAt'>) => void;
  currentUser?: FirebaseUser | null;
  onOpenEdit?: (movie: Movie) => void;
  onUpdateMovie?: (movie: Movie) => void;
  onOpenAuth?: () => void;
}

const RelatedMovieCard: React.FC<{ rel: Movie; onSelect: (m: Movie) => void }> = ({ rel, onSelect }) => {
  const [imgError, setImgError] = useState(false);
  const rawPoster = rel.posterUrl && typeof rel.posterUrl === 'string' ? rel.posterUrl.trim() : '';
  const rawBackdrop = rel.backdropUrl && typeof rel.backdropUrl === 'string' ? rel.backdropUrl.trim() : '';

  const isPlaceholder = (url: string) => {
    return (
      url.includes('unsplash.com') ||
      url.includes('placeholder.com') ||
      url.includes('dummyimage.com') ||
      url.includes('via.placeholder')
    );
  };

  const dynamicUrl = useMemo(() => {
    if (imgError) return null;
    if (rawPoster && !isPlaceholder(rawPoster)) return rawPoster;
    if (rawBackdrop && !isPlaceholder(rawBackdrop)) return rawBackdrop;
    return null;
  }, [rawPoster, rawBackdrop, imgError]);

  return (
    <div
      onClick={() => onSelect(rel)}
      className="group bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
    >
      <div className="aspect-[3/4] overflow-hidden bg-slate-950 flex items-center justify-center">
        {dynamicUrl ? (
          <img
            src={dynamicUrl}
            alt={rel.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full p-2 flex flex-col items-center justify-center text-center bg-gradient-to-br from-slate-900 to-emerald-950/70">
            <Film className="w-6 h-6 text-emerald-400/80 mb-1" />
            <span className="text-[10px] font-bold text-white line-clamp-2">
              {rel.title}
            </span>
          </div>
        )}
      </div>
      <div className="p-2 space-y-0.5">
        <p className="text-xs font-bold text-white group-hover:text-emerald-400 truncate">
          {rel.title}
        </p>
        <p className="text-[10px] text-slate-400">
          {rel.releaseYear} • Dir: {rel.director.split(' ')[0]}
        </p>
      </div>
    </div>
  );
};

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  movie,
  onClose,
  onOpenTrailer,
  isWatchlisted,
  onToggleWatchlist,
  watchStatus,
  onUpdateStatus,
  rewatchCount = 0,
  onUpdateRewatchCount,
  allMovies,
  onSelectMovie,
  reviews,
  onAddReview,
  currentUser,
  onOpenEdit,
  onUpdateMovie,
  onOpenAuth
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  const [backdropError, setBackdropError] = useState(false);
  const [posterError, setPosterError] = useState(false);

  const [internalReviews, setInternalReviews] = useState<UserReview[]>(() => {
    if (reviews !== undefined && movie?.id) {
      return reviews.filter(r => r.movieId === movie.id);
    }
    return [];
  });

  useEffect(() => {
    if (!movie?.id) {
      setInternalReviews([]);
      return;
    }
    if (reviews !== undefined) {
      setInternalReviews(reviews.filter(r => r.movieId === movie.id));
      return;
    }
    const unsub = subscribeToMovieReviews(movie.id, (loadedReviews) => {
      setInternalReviews(loadedReviews || []);
    });
    return () => unsub();
  }, [movie?.id, reviews]);

  const activeReviews = reviews !== undefined && movie?.id
    ? reviews.filter(r => r.movieId === movie.id)
    : internalReviews;

  const ratingMetrics = useMemo(() => {
    return calculateMovieRatingBreakdown(activeReviews);
  }, [activeReviews]);

  useEffect(() => {
    setBackdropError(false);
    setPosterError(false);
  }, [movie?.id, movie?.backdropUrl, movie?.posterUrl]);

  const isPlaceholderUrl = (url: string) => {
    return (
      url.includes('unsplash.com') ||
      url.includes('placeholder.com') ||
      url.includes('dummyimage.com') ||
      url.includes('via.placeholder')
    );
  };

  const rawPoster = movie?.posterUrl && typeof movie.posterUrl === 'string' ? movie.posterUrl.trim() : '';
  const rawBackdrop = movie?.backdropUrl && typeof movie.backdropUrl === 'string' ? movie.backdropUrl.trim() : '';

  // Dynamic banner visual resolution: strictly avoids hardcoded defaults or placeholders
  const dynamicBannerUrl = useMemo(() => {
    if (backdropError) {
      if (rawPoster && rawPoster !== rawBackdrop && !posterError && !isPlaceholderUrl(rawPoster)) {
        return rawPoster;
      }
      return null;
    }
    if (rawBackdrop && !isPlaceholderUrl(rawBackdrop)) return rawBackdrop;
    if (rawPoster && !isPlaceholderUrl(rawPoster)) return rawPoster;
    return null;
  }, [rawBackdrop, rawPoster, backdropError, posterError]);

  // Dynamic poster visual resolution: strictly avoids hardcoded defaults or placeholders
  const dynamicPosterUrl = useMemo(() => {
    if (posterError) {
      if (rawBackdrop && rawBackdrop !== rawPoster && !backdropError && !isPlaceholderUrl(rawBackdrop)) {
        return rawBackdrop;
      }
      return null;
    }
    if (rawPoster && !isPlaceholderUrl(rawPoster)) return rawPoster;
    if (rawBackdrop && !isPlaceholderUrl(rawBackdrop)) return rawBackdrop;
    return null;
  }, [rawPoster, rawBackdrop, posterError, backdropError]);

  const handleRefreshMovie = async () => {
    if (!movie || isRefreshing) return;
    setIsRefreshing(true);
    setRefreshNotice('Refreshing...');
    try {
      const candidate: WebMovieCandidate = {
        tmdbId: (movie as any).tmdbId || (parseInt(movie.id.split('-').pop() || '0', 10) || 0),
        title: movie.title,
        originalTitle: movie.nativeTitle,
        releaseYear: movie.releaseYear,
        overview: movie.synopsis,
        posterUrl: movie.posterUrl,
        backdropUrl: movie.backdropUrl,
        rating: movie.rating,
        ratingCount: movie.ratingCount
      };

      const freshMovie = await pullMovieDetailsFromOnline(candidate, true);
      const merged: Movie = {
        ...movie,
        runtimeMinutes: freshMovie.runtimeMinutes || movie.runtimeMinutes,
        genres: freshMovie.genres?.length ? freshMovie.genres : movie.genres,
        leadCast: freshMovie.leadCast?.length ? freshMovie.leadCast : movie.leadCast,
        director: freshMovie.director || movie.director,
        directorAvatarUrl: freshMovie.directorAvatarUrl || movie.directorAvatarUrl,
        directorTmdbId: freshMovie.directorTmdbId || movie.directorTmdbId,
        trailerYoutubeId: freshMovie.trailerYoutubeId || movie.trailerYoutubeId,
        synopsis: freshMovie.synopsis || movie.synopsis
      };

      onSelectMovie(merged);
      if (onUpdateMovie) {
        onUpdateMovie(merged);
      }
      setRefreshNotice('Updated!');
      setTimeout(() => setRefreshNotice(null), 2500);
    } catch (err) {
      console.warn('Failed to refresh movie from TMDb:', err);
      setRefreshNotice('Failed');
      setTimeout(() => setRefreshNotice(null), 2500);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Active Person Profile Modal state (Actor or Director)
  const [selectedPerson, setSelectedPerson] = useState<{
    name: string;
    roleHint?: string;
    avatarUrl?: string;
    tmdbId?: number;
  } | null>(null);

  const handleOpenPerson = (name: string, roleHint?: string, avatarUrl?: string, tmdbId?: number) => {
    setSelectedPerson({ name, roleHint, avatarUrl, tmdbId });
  };


  // Synchronize ?movie=<id> search param with browser history
  useEffect(() => {
    if (movie) {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get('movie') !== movie.id) {
          url.searchParams.set('movie', movie.id);
          window.history.pushState({ movieId: movie.id }, '', url.toString());
        }
      } catch (e) {
        console.warn('Could not sync movie URL history', e);
      }
    }

    return () => {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('movie')) {
          url.searchParams.delete('movie');
          const cleanUrl = url.pathname + (url.search ? url.search : '') + url.hash;
          window.history.replaceState({}, '', cleanUrl);
        }
      } catch (e) {}
    };
  }, [movie?.id]);

  if (!movie) return null;

  // Related movies (same genre or director or era)
  const relatedMovies = allMovies
    .filter(m => m.id !== movie.id && (m.genres.some(g => movie.genres.includes(g)) || m.director === movie.director))
    .slice(0, 4);

  const handleShare = () => {
    if (!movie) return;
    const origin = window.location.origin;
    const path = window.location.pathname;
    const shareUrl = `${origin}${path}?movie=${encodeURIComponent(movie.id)}`;

    if (navigator.share) {
      navigator.share({
        title: `${movie.title} on NaijaReel`,
        text: `Explore ${movie.title} (${movie.releaseYear}) directed by ${movie.director} on NaijaReel!`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div 
      id="movie-detail-modal-overlay"
      className="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-black/80 backdrop-blur-md flex justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="movie-detail-modal-container"
        className="relative w-full max-w-4xl bg-[#0e131d] border border-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl text-slate-100 my-auto min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-movie-detail-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 backdrop-blur-md transition-all shadow-lg cursor-pointer"
          title="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Banner */}
        <div className="relative w-full overflow-hidden bg-slate-950 min-h-[220px] max-h-[35vh] sm:max-h-[50vh] flex items-center justify-center">
          {dynamicBannerUrl ? (
            <img
              src={dynamicBannerUrl}
              alt={movie.title}
              onError={() => setBackdropError(true)}
              className="w-full h-auto object-cover object-center max-h-[35vh] sm:max-h-[50vh]"
            />
          ) : (
            <div className="w-full h-[220px] sm:h-[300px] bg-gradient-to-br from-slate-950 via-[#0a1120] to-emerald-950/90 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2 shadow-inner z-10">
                <Film className="w-7 h-7 text-emerald-400" />
              </div>
              <span className="text-xs uppercase tracking-widest font-extrabold text-emerald-400 z-10">
                Nollywood Cinema Showcase
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-cinema mt-1 z-10">
                {movie.title}
              </h3>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e131d] via-[#0e131d]/60 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e131d] via-transparent to-transparent hidden sm:block pointer-events-none" />

          {/* Quick Play Trailer on backdrop */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              id="modal-play-trailer-btn"
              onClick={() => onOpenTrailer(movie)}
              className="group flex items-center gap-2.5 sm:gap-3 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-emerald-500/95 hover:bg-emerald-400 text-slate-950 font-bold shadow-2xl shadow-emerald-950/80 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-950 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-emerald-400 text-emerald-400 ml-0.5" />
              </div>
              <span className="text-xs sm:text-sm tracking-wide uppercase">Watch Official Trailer</span>
            </button>
          </div>
        </div>

        {/* Title, Poster & Metadata Header */}
        <div className="px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-16 relative z-10">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-end">
            {/* Responsive Poster Scaling */}
            <div className="w-24 sm:w-32 md:w-40 aspect-[2/3] rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700/80 shadow-2xl shrink-0 flex items-center justify-center">
              {dynamicPosterUrl ? (
                <img
                  src={dynamicPosterUrl}
                  alt={movie.title}
                  onError={() => setPosterError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full p-3 flex flex-col items-center justify-center text-center bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/80">
                  <Film className="w-8 h-8 text-emerald-400 mb-2" />
                  <span className="text-[11px] font-bold text-white line-clamp-3 leading-snug">
                    {movie.title}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold mt-1">
                    {movie.releaseYear}
                  </span>
                </div>
              )}
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 min-w-0 space-y-2 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500 text-slate-950">
                  {movie.releaseYear}
                </span>
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-900/90 text-slate-200 border border-slate-700">
                  {movie.era}
                </span>
                {ratingMetrics.total > 0 ? (
                  <div 
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-amber-400 text-xs font-bold"
                    title={`Based on ${ratingMetrics.total} user review${ratingMetrics.total === 1 ? '' : 's'}`}
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{ratingMetrics.average10}/10</span>
                  </div>
                ) : (
                  <div 
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800 text-slate-400 text-xs font-medium"
                    title="No community reviews yet"
                  >
                    <Star className="w-3.5 h-3.5 text-slate-500" />
                    <span>Unrated</span>
                  </div>
                )}
              </div>

              <h2 className="font-cinema text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                {movie.title}
              </h2>
              {movie.nativeTitle && (
                <p className="text-sm sm:text-base text-emerald-400 font-medium italic">
                  {movie.nativeTitle}
                </p>
              )}
            </div>
          </div>

          {/* Action Bar with Clean Spacing */}
          <div className="mt-5 mb-12 sm:mb-6">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
              {/* Watch Trailer */}
              <button
                id="action-bar-play-trailer-btn"
                onClick={() => onOpenTrailer(movie)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md active:scale-95 cursor-pointer"
                title="Watch official trailer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Watch Trailer</span>
              </button>

              {/* Multi-Status Tracking Picker (Authenticated) or Auth-Gated Watchlist (Guest) */}
              {!currentUser ? (
                <button
                  id="modal-toggle-watchlist-btn"
                  onClick={() => onOpenAuth ? onOpenAuth() : onToggleWatchlist(movie.id)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700 hover:border-amber-400/50 cursor-pointer shadow-md"
                  title="Sign in to save to your watchlist"
                >
                  <Bookmark className="w-4 h-4 text-amber-400" />
                  <span>Add to Watchlist</span>
                </button>
              ) : onUpdateStatus ? (
                <TrackingStatusPicker
                  movieId={movie.id}
                  currentStatus={watchStatus || (isWatchlisted ? 'plan_to_watch' : null)}
                  onUpdateStatus={onUpdateStatus}
                  size="md"
                />
              ) : (
                <button
                  id="modal-toggle-watchlist-btn"
                  onClick={() => onToggleWatchlist(movie.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                    isWatchlisted
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isWatchlisted ? 'fill-current' : ''}`} />
                  <span>{isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}</span>
                </button>
              )}

              {/* Rewatch Counter (if Completed) */}
              {watchStatus === 'completed' && onUpdateRewatchCount && (
                <div 
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold"
                  title="Rewatch counter for completed films"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Rewatches:</span>
                  <span className="font-mono text-emerald-400 px-1 font-bold">{rewatchCount || 0}</span>
                  <div className="flex items-center gap-0.5 ml-0.5">
                    <button
                      onClick={() => onUpdateRewatchCount(movie.id, Math.max(0, (rewatchCount || 0) - 1))}
                      className="p-1 rounded hover:bg-emerald-500/20 text-emerald-300 transition-colors"
                      title="Decrease rewatches"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onUpdateRewatchCount(movie.id, (rewatchCount || 0) + 1)}
                      className="p-1 rounded hover:bg-emerald-500/20 text-emerald-300 transition-colors"
                      title="Add rewatch"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Share */}
              <button
                id="modal-share-btn"
                onClick={handleShare}
                className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Share this movie"
              >
                <Share2 className="w-4 h-4" />
                <span>{copiedLink ? 'Copied Link!' : 'Share'}</span>
              </button>

              {/* Refresh */}
              <button
                id="modal-refresh-movie-btn"
                onClick={handleRefreshMovie}
                disabled={isRefreshing}
                className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Refresh movie details & credits from online TMDb registry"
              >
                <RotateCw className={`w-4 h-4 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{refreshNotice || 'Refresh'}</span>
              </button>

              {/* Edit Movie (Authenticated) */}
              {currentUser && (
                <button
                  id="modal-edit-movie-btn"
                  onClick={() => onOpenEdit && onOpenEdit(movie)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/50 hover:border-emerald-400 transition-all shadow-md group cursor-pointer sm:ml-auto"
                  title="Edit movie details in Firebase Firestore (Authenticated user permission)"
                >
                  <Pencil className="w-4 h-4 text-emerald-400 group-hover:text-slate-950 transition-colors" />
                  <span>Edit Movie</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 pb-16 sm:pb-10">
          
          {/* Authenticated Member Quick Edit Callout */}
          {currentUser && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>
                  Authenticated as <strong className="text-white">{currentUser.displayName || currentUser.email}</strong>. You have permissions to update this film's title, synopsis, director, cast, genres, and banner URL directly in Firestore.
                </span>
              </div>
              <button
                id="modal-callout-edit-btn"
                onClick={() => onOpenEdit && onOpenEdit(movie)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-sm shrink-0 self-start sm:self-center"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Movie</span>
              </button>
            </div>
          )}

          {/* Tagline / Quote Block */}
          {movie.quote && (
            <div className="bg-slate-900/70 border-l-4 border-emerald-500 rounded-r-xl p-4 sm:p-5">
              <p className="font-serif italic text-base sm:text-lg text-slate-200">
                "{movie.quote.text}"
              </p>
              <p className="text-xs sm:text-sm text-emerald-400 font-sans mt-2 font-semibold">
                — {movie.quote.character} <span className="text-slate-400 font-normal">({movie.quote.actor})</span>
              </p>
            </div>
          )}

          {/* Quick Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm">
            <div
              id="spec-director-interactive"
              onClick={() => movie.director && handleOpenPerson(movie.director, 'Director', movie.directorAvatarUrl, movie.directorTmdbId)}
              className={`group p-1.5 -m-1.5 rounded-xl transition-all ${movie.director ? 'cursor-pointer hover:bg-slate-800/80' : ''}`}
              title={movie.director ? `Click to view ${movie.director}'s profile & catalogue filmography` : 'Director unlisted'}
            >
              <span className="text-slate-500 block mb-1">Director</span>
              <div className="flex items-center gap-2">
                <PersonHeadshot
                  personName={movie.director || 'Unlisted'}
                  avatarUrl={movie.directorAvatarUrl}
                  tmdbId={movie.directorTmdbId}
                  size="sm"
                  fallbackIcon="film"
                />
                <strong className="text-white font-semibold group-hover:text-emerald-400 transition-colors truncate">
                  {movie.director || 'Not listed on TMDb'}
                </strong>
              </div>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Runtime</span>
              <strong className="text-white font-semibold">{movie.runtimeMinutes} Minutes</strong>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Languages</span>
              <strong className="text-white font-semibold">{movie.languages.join(', ')}</strong>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Box Office / Reach</span>
              <strong className="text-emerald-400 font-semibold">{movie.boxOffice || 'Classically Celebrated'}</strong>
            </div>
          </div>

          {/* Where to Stream section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Film className="w-4 h-4 text-emerald-400" />
              Where to Watch (Streaming & Distribution)
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {movie.streamingPlatforms.map((platform) => (
                <a
                  key={platform.name}
                  href={platform.url || '#'}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white ${platform.badgeColor} hover:brightness-110 shadow-md transition-all`}
                >
                  <span>Available on {platform.name}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Synopsis & Cultural Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Synopsis
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {movie.synopsis || 'No official synopsis returned from TMDb for this title.'}
              </p>
            </div>

            <div className="space-y-2 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                Nollywood Cultural Impact
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {movie.culturalSignificance || `${movie.era} Nigerian production catalogued on NaijaReel.`}
              </p>

              {movie.amvcaAwards && movie.amvcaAwards.length > 0 && (
                <div className="pt-2 border-t border-emerald-900/40 mt-3 space-y-1">
                  <span className="text-[11px] font-bold uppercase text-amber-400 tracking-wider">
                    Accolades & Honors:
                  </span>
                  <ul className="text-xs text-slate-300 space-y-0.5 list-disc list-inside">
                    {movie.amvcaAwards.map((award, i) => (
                      <li key={i}>{award}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Lead Cast & Roles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                Lead Cast & Characters
              </h3>
              {movie.leadCast && movie.leadCast.length > 0 && (
                <span className="text-[11px] text-slate-400">
                  Click any talent to view headshot & filmography
                </span>
              )}
            </div>
            {movie.leadCast && movie.leadCast.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {movie.leadCast.map((cast, index) => (
                  <div
                    key={index}
                    id={`cast-member-card-${index}`}
                    onClick={() => handleOpenPerson(cast.actor, 'Actor', cast.avatarUrl, cast.tmdbId)}
                    className="group bg-slate-900/80 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-800/90 rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all shadow-sm"
                    title={`Click to view ${cast.actor}'s profile & works`}
                  >
                    <PersonHeadshot
                      personName={cast.actor}
                      avatarUrl={cast.avatarUrl}
                      tmdbId={cast.tmdbId}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                        {cast.actor}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {cast.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Cast credits not listed on TMDb.</p>
            )}
          </div>

          {/* Interactive User Reviews & Ratings Section */}
          <ReviewSection
            movieId={movie.id}
            movie={movie}
            currentUser={currentUser}
            onOpenAuth={onOpenAuth}
          />

          {/* Related Nollywood Movies */}
          {relatedMovies.length > 0 && (
            <div className="border-t border-slate-800 pt-6 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                You May Also Enjoy (Related Nigerian Titles)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {relatedMovies.map((rel) => (
                  <RelatedMovieCard
                    key={rel.id}
                    rel={rel}
                    onSelect={onSelectMovie}
                  />
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Dedicated Person Profile Modal (Actors & Directors) */}
      {selectedPerson && (
        <PersonProfileModal
          personName={selectedPerson.name}
          roleHint={selectedPerson.roleHint}
          initialAvatarUrl={selectedPerson.avatarUrl}
          tmdbId={selectedPerson.tmdbId}
          allMovies={allMovies}
          onSelectMovie={(selectedFilm) => {
            setSelectedPerson(null);
            onSelectMovie(selectedFilm);
          }}
          onClose={() => setSelectedPerson(null)}
        />
      )}
    </div>
  );
};
