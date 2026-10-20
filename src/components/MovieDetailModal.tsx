import React, { useState, useEffect } from 'react';
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
  reviews: UserReview[];
  onAddReview: (review: Omit<UserReview, 'id' | 'createdAt'>) => void;
  currentUser?: FirebaseUser | null;
  onOpenEdit?: (movie: Movie) => void;
  onUpdateMovie?: (movie: Movie) => void;
}

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
  onUpdateMovie
}) => {
  // Review form state
  const [userName, setUserName] = useState('');
  const [userRating, setUserRating] = useState(10);
  const [userLocation, setUserLocation] = useState('Lagos, Nigeria');
  const [userComment, setUserComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

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

  // Auto-fill user name if logged in
  useEffect(() => {
    if (currentUser && !userName) {
      setUserName(currentUser.displayName || currentUser.email?.split('@')[0] || '');
    }
  }, [currentUser]);

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

  // Filter reviews for this movie
  const movieReviews = reviews.filter(r => r.movieId === movie.id);

  // Related movies (same genre or director or era)
  const relatedMovies = allMovies
    .filter(m => m.id !== movie.id && (m.genres.some(g => movie.genres.includes(g)) || m.director === movie.director))
    .slice(0, 4);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userComment.trim()) return;

    onAddReview({
      movieId: movie.id,
      userName: userName.trim(),
      rating: userRating,
      comment: userComment.trim(),
      userLocation: userLocation.trim() || 'Nigeria',
      userId: currentUser?.uid,
      userEmail: currentUser?.email || undefined
    });

    setUserComment('');
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 4000);
  };

  const handleShare = () => {
    if (!movie) return;
    const origin = window.location.origin;
    const path = window.location.pathname;
    const shareUrl = `${origin}${path}?movie=${encodeURIComponent(movie.id)}`;

    if (navigator.share) {
      navigator.share({
        title: `${movie.title} on AfroMovieDB`,
        text: `Explore ${movie.title} (${movie.releaseYear}) directed by ${movie.director} on AfroMovieDB!`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200">
      <div 
        id="movie-detail-modal-container"
        className="relative w-full max-w-4xl bg-[#0e131d] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-slate-100 my-auto"
      >
        {/* Close Button */}
        <button
          id="close-movie-detail-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 backdrop-blur-md transition-all shadow-lg"
          title="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Banner */}
        <div className="relative h-64 sm:h-80 lg:h-96 w-full overflow-hidden bg-slate-950">
          <img
            src={movie.backdropUrl}
            alt={movie.title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e131d] via-[#0e131d]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e131d] via-transparent to-transparent hidden sm:block" />

          {/* Quick Play Trailer on backdrop */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              id="modal-play-trailer-btn"
              onClick={() => onOpenTrailer(movie)}
              className="group flex items-center gap-3 px-6 py-3 rounded-full bg-emerald-500/95 hover:bg-emerald-400 text-slate-950 font-bold shadow-2xl shadow-emerald-950/80 hover:scale-105 active:scale-95 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center">
                <Play className="w-4 h-4 fill-emerald-400 text-emerald-400 ml-0.5" />
              </div>
              <span className="text-sm tracking-wide uppercase">Watch Official Trailer</span>
            </button>
          </div>

          {/* Bottom Floating Title Strip */}
          <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500 text-slate-950">
                  {movie.releaseYear}
                </span>
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-900/90 text-slate-200 border border-slate-700">
                  {movie.era}
                </span>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-amber-400 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{movie.rating.toFixed(1)}/10</span>
                </div>
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

            {/* Actions: Edit (Authenticated Users Only), Watchlist and Share */}
            <div className="flex items-center gap-2">
              {currentUser && (
                <button
                  id="modal-edit-movie-btn"
                  onClick={() => onOpenEdit && onOpenEdit(movie)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/50 hover:border-emerald-400 transition-all shadow-md group"
                  title="Edit movie details in Firebase Firestore (Authenticated user permission)"
                >
                  <Pencil className="w-4 h-4 text-emerald-400 group-hover:text-slate-950 transition-colors" />
                  <span>Edit Movie</span>
                </button>
              )}

              {/* Multi-Status Tracking Picker */}
              {onUpdateStatus ? (
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
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

              <button
                id="modal-share-btn"
                onClick={handleShare}
                className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors"
                title="Share this movie"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">{copiedLink ? 'Copied Link!' : 'Share'}</span>
              </button>

              <button
                id="modal-refresh-movie-btn"
                onClick={handleRefreshMovie}
                disabled={isRefreshing}
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Refresh movie details & credits from online TMDb registry"
              >
                <RotateCw className={`w-4 h-4 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{refreshNotice || 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
          
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
              onClick={() => handleOpenPerson(movie.director, 'Director', movie.directorAvatarUrl, movie.directorTmdbId)}
              className="group cursor-pointer p-1.5 -m-1.5 rounded-xl hover:bg-slate-800/80 transition-all"
              title={`Click to view ${movie.director}'s profile & catalogue filmography`}
            >
              <span className="text-slate-500 block mb-1">Director</span>
              <div className="flex items-center gap-2">
                <PersonHeadshot
                  personName={movie.director}
                  avatarUrl={movie.directorAvatarUrl}
                  tmdbId={movie.directorTmdbId}
                  size="sm"
                  fallbackIcon="film"
                />
                <strong className="text-white font-semibold group-hover:text-emerald-400 transition-colors truncate">
                  {movie.director}
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
                {movie.synopsis}
              </p>
            </div>

            <div className="space-y-2 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                Nollywood Cultural Impact
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {movie.culturalSignificance}
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
              <span className="text-[11px] text-slate-400">
                Click any talent to view headshot & filmography
              </span>
            </div>
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
          </div>

          {/* Interactive User Reviews & Ratings Section */}
          <div className="border-t border-slate-800 pt-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  Naija Film Fan Reviews & Discussions
                </h3>
                <p className="text-xs text-slate-400">
                  Join the cultural conversation — rate this Nollywood masterpiece.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
                {movieReviews.length} Review{movieReviews.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Write a Review Box */}
            <form onSubmit={handleSubmitReview} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Leave Your Review
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tunde Balogun"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Your City / State</label>
                  <input
                    type="text"
                    placeholder="e.g. Lagos, Abuja, London, Atlanta"
                    value={userLocation}
                    onChange={(e) => setUserLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Rating (1 to 10)</label>
                  <select
                    value={userRating}
                    onChange={(e) => setUserRating(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
                      <option key={num} value={num}>
                        {num} / 10 {num >= 9 ? '🌟 (Classic Masterpiece)' : num >= 7 ? '👍 (Great Watch)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Your Thoughts on the Film</label>
                <textarea
                  required
                  rows={3}
                  placeholder="What made this movie memorable? Acting, direction, plot twists, soundtrack..."
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {reviewSubmitted ? (
                  <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Review submitted successfully! Thank you for supporting Nollywood cinema.
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">
                    Your review helps others discover authentic Nigerian stories.
                  </span>
                )}

                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Review</span>
                </button>
              </div>
            </form>

            {/* Reviews List */}
            <div className="space-y-3">
              {movieReviews.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">
                  No user reviews yet for this title. Be the first to share your thoughts!
                </p>
              ) : (
                movieReviews.map((rev) => (
                  <div key={rev.id} className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                          {rev.userName[0]}
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-white">{rev.userName}</span>
                          <span className="text-[11px] text-slate-400 ml-2">from {rev.userLocation}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded text-amber-400 text-xs font-bold border border-slate-800">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{rev.rating}/10</span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      "{rev.comment}"
                    </p>
                    <span className="text-[10px] text-slate-500 block">
                      {rev.createdAt}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Related Nollywood Movies */}
          {relatedMovies.length > 0 && (
            <div className="border-t border-slate-800 pt-6 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                You May Also Enjoy (Related Nigerian Titles)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {relatedMovies.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectMovie(rel)}
                    className="group bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-slate-950">
                      <img
                        src={rel.posterUrl}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
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
