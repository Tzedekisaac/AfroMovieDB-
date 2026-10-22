import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { Play, Bookmark, Info, Star, ChevronLeft, ChevronRight, Trophy, Flame, Pencil } from 'lucide-react';
import { Movie } from '../types';

interface HeroSpotlightProps {
  featuredMovies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onOpenTrailer: (movie: Movie) => void;
  isWatchlisted: (movieId: string) => boolean;
  onToggleWatchlist: (movieId: string) => void;
  currentUser?: FirebaseUser | null;
  onOpenEdit?: (movie: Movie) => void;
  onOpenAuth?: () => void;
}

export const HeroSpotlight: React.FC<HeroSpotlightProps> = ({
  featuredMovies,
  onSelectMovie,
  onOpenTrailer,
  isWatchlisted,
  onToggleWatchlist,
  currentUser,
  onOpenEdit,
  onOpenAuth
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance spotlight every 9 seconds
  useEffect(() => {
    if (featuredMovies.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 9000);
    return () => clearInterval(timer);
  }, [featuredMovies.length]);

  if (!featuredMovies.length) return null;
  const currentMovie = featuredMovies[currentIndex];
  const inWatchlist = isWatchlisted(currentMovie.id);

  return (
    <div className="relative w-full max-w-full h-[520px] sm:h-[580px] lg:h-[640px] overflow-hidden bg-slate-950 border-b border-slate-800">
      {/* Background Backdrop Image with Gradients */}
      <div className="absolute inset-0">
        <img
          src={currentMovie.backdropUrl}
          alt={currentMovie.title}
          className="w-full h-full object-cover object-center transform scale-105 transition-all duration-1000 ease-out"
        />
        {/* Layered cinematic vignette gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-[#0b0f17]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f17] via-[#0b0f17]/85 to-transparent sm:w-3/4" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Main Content Area */}
      <div className="relative h-full w-full max-w-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-16 pt-20">
        <div className="w-full max-w-full lg:max-w-4xl space-y-4">
          
          {/* Badges Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold tracking-wider uppercase bg-emerald-500 text-slate-950 rounded-md shadow-sm">
              Spotlight
            </span>
            <span className="px-2.5 py-1 text-xs font-medium bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-200 rounded-md">
              {currentMovie.era}
            </span>
            {currentMovie.boxOfficeChampion && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-500/20 border border-amber-500/50 text-amber-300 rounded-md">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Box Office Record</span>
              </span>
            )}
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-900/90 rounded-md text-amber-400 text-xs font-bold border border-slate-700">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{currentMovie.rating.toFixed(1)}</span>
              <span className="text-slate-400 font-normal">/10</span>
            </div>
          </div>

          {/* Title & Native Title */}
          <div>
            <h1 className="font-cinema text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight drop-shadow-md leading-tight">
              {currentMovie.title}
            </h1>
            {currentMovie.nativeTitle && (
              <p className="text-sm sm:text-base text-emerald-400 font-medium tracking-wide mt-1 italic">
                {currentMovie.nativeTitle}
              </p>
            )}
          </div>

          {/* Tagline or Quote */}
          {currentMovie.quote ? (
            <div className="border-l-2 border-emerald-500 pl-3 py-0.5 text-xs sm:text-sm text-slate-300 italic font-serif">
              "{currentMovie.quote.text}" — <span className="text-emerald-400 not-italic font-sans font-medium">{currentMovie.quote.character}</span> ({currentMovie.quote.actor})
            </div>
          ) : (
            <p className="text-sm sm:text-base text-slate-300 font-medium">
              {currentMovie.tagline}
            </p>
          )}

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-xl">
            {currentMovie.synopsis}
          </p>

          {/* Metadata pill row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
            <span>Dir: <strong className="text-slate-200">{currentMovie.director}</strong></span>
            <span>•</span>
            <span>{currentMovie.releaseYear}</span>
            <span>•</span>
            <span>{currentMovie.runtimeMinutes} mins</span>
            <span>•</span>
            <span>Lang: <strong className="text-slate-200">{currentMovie.languages.join(', ')}</strong></span>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              id="hero-watch-trailer-btn"
              onClick={() => onOpenTrailer(currentMovie)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-950/50 hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Watch Trailer</span>
            </button>

            <button
              id="hero-view-details-btn"
              onClick={() => onSelectMovie(currentMovie)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm backdrop-blur-sm hover:border-slate-500 transition-all"
            >
              <Info className="w-4 h-4 text-emerald-400" />
              <span>Film Details</span>
            </button>

            {currentUser && onOpenEdit && (
              <button
                id="hero-edit-movie-btn"
                onClick={() => onOpenEdit(currentMovie)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/50 hover:border-emerald-400 font-semibold text-sm backdrop-blur-sm transition-all shadow-md group"
                title="Edit film details in Firebase Firestore (Authenticated User)"
              >
                <Pencil className="w-4 h-4 text-emerald-400 group-hover:text-slate-950 transition-colors" />
                <span>Edit Movie</span>
              </button>
            )}

            <button
              id="hero-toggle-watchlist-btn"
              onClick={() => {
                if (!currentUser) {
                  if (onOpenAuth) onOpenAuth();
                } else {
                  onToggleWatchlist(currentMovie.id);
                }
              }}
              className={`flex items-center gap-2 p-2.5 sm:px-4 sm:py-2.5 rounded-full border text-sm font-medium transition-all cursor-pointer ${
                currentUser && inWatchlist
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={!currentUser ? 'Sign in to add to Watchlist' : inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              <Bookmark className={`w-4 h-4 ${currentUser && inWatchlist ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span className="hidden sm:inline">
                {currentUser && inWatchlist ? 'Saved' : 'Watchlist'}
              </span>
            </button>
          </div>

        </div>

        {/* Carousel controls & thumbnail strip */}
        <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-8 flex items-center gap-2 sm:gap-3">
          {/* Arrow navigation */}
          <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-full p-1">
            <button
              onClick={() => setCurrentIndex((prev) => (prev === 0 ? featuredMovies.length - 1 : prev - 1))}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Previous movie"
              id="hero-prev-btn"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 font-mono px-1">
              {currentIndex + 1}/{featuredMovies.length}
            </span>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % featuredMovies.length)}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Next movie"
              id="hero-next-btn"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dots */}
          <div className="hidden sm:flex items-center gap-1.5">
            {featuredMovies.map((movie, idx) => (
              <button
                key={movie.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-6 bg-emerald-400' : 'w-2 bg-slate-600 hover:bg-slate-400'
                }`}
                title={`Jump to ${movie.title}`}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
