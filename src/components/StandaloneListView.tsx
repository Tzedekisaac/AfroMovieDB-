import React, { useState } from 'react';
import { CustomUserList, Movie, AppTheme } from '../types';
import { User } from 'firebase/auth';
import { 
  ArrowLeft, Share2, Check, Sparkles, Film, Clock, Star, 
  ExternalLink, Globe, Lock, Play, Pencil, Bookmark 
} from 'lucide-react';
import { MovieCard } from './MovieCard';

interface StandaloneListViewProps {
  list: CustomUserList;
  allMovies: Movie[];
  currentUser: User | null;
  onClose: () => void;
  onSelectMovie: (movie: Movie) => void;
  onOpenTrailer: (movie: Movie) => void;
  onEditList?: (list: CustomUserList) => void;
  watchlist: string[];
  onToggleWatchlist: (movieId: string) => void;
  trackingMap?: Map<string, any>;
  onUpdateStatus?: (movieId: string, status: any) => void;
}

export const StandaloneListView: React.FC<StandaloneListViewProps> = ({
  list,
  allMovies,
  currentUser,
  onClose,
  onSelectMovie,
  onOpenTrailer,
  onEditList,
  watchlist,
  onToggleWatchlist,
  trackingMap,
  onUpdateStatus
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  // Resolve movies belonging to this list in sequence
  const listMovies = list.movieIds
    .map(id => allMovies.find(m => m.id === id))
    .filter((m): m is Movie => Boolean(m));

  // Compute aggregate metrics
  const totalRuntimeMinutes = listMovies.reduce((acc, m) => acc + (m.runtimeMinutes || 110), 0);
  const totalHours = Math.floor(totalRuntimeMinutes / 60);
  const remainingMinutes = totalRuntimeMinutes % 60;
  const avgRating = listMovies.length > 0 
    ? (listMovies.reduce((acc, m) => acc + (m.rating || 7.5), 0) / listMovies.length).toFixed(1)
    : '0.0';

  const isOwner = currentUser && currentUser.uid === list.creatorId;

  const handleShare = () => {
    const origin = window.location.origin;
    const path = window.location.pathname;
    const shareUrl = `${origin}${path}?list=${encodeURIComponent(list.id)}`;

    if (navigator.share) {
      navigator.share({
        title: `${list.title} - Curated Nollywood Collection`,
        text: list.description || `Explore "${list.title}" curated by ${list.creatorName} on AfroMovieDB!`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Aesthetic styling accents matching the list's theme
  const theme = list.theme || 'emerald';
  const accentGradient = 
    theme === 'gold' 
      ? 'from-amber-500 via-amber-400 to-yellow-600'
      : theme === 'obsidian'
        ? 'from-purple-500 via-indigo-500 to-cyan-500'
        : 'from-emerald-500 via-teal-400 to-green-600';

  const badgeBg = 
    theme === 'gold'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      : theme === 'obsidian'
        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col selection:bg-emerald-600 selection:text-white animate-in fade-in duration-300">
      
      {/* Top Standalone Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#0b0f17]/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            id="standalone-back-to-catalogue-btn"
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
            title="Return to main AfroMovieDB catalogue"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Browse Full Catalogue</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {isOwner && onEditList && (
              <button
                onClick={() => onEditList(list)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-all"
                title="Edit this collection"
              >
                <Pencil className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Edit Collection</span>
              </button>
            )}

            <button
              onClick={handleShare}
              id="standalone-share-btn"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-950/40 transition-all cursor-pointer active:scale-95"
              title="Copy shareable link to this public collection"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share Collection</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Standalone Curator Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900/80 via-[#0b0f17] to-[#080b12] border-b border-slate-800/80 py-12 sm:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          
          {/* Curator Avatar Badge */}
          <div className="relative shrink-0">
            <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-gradient-to-br ${accentGradient} shadow-2xl`}>
              {list.creatorAvatar ? (
                <img 
                  src={list.creatorAvatar} 
                  alt={list.creatorName} 
                  className="w-full h-full object-cover rounded-2xl" 
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-3xl font-black text-white">
                  {list.creatorName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="absolute -bottom-2 inset-x-0 mx-auto w-max px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-950 border border-slate-700 text-slate-300 shadow">
              Curator
            </span>
          </div>

          {/* Collection Metadata & Description */}
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${badgeBg}`}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nollywood Curated List</span>
              </span>

              {list.isPublic ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-400">
                  <Globe className="w-3 h-3 text-emerald-400" />
                  <span>Public Web View</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800 text-amber-400">
                  <Lock className="w-3 h-3" />
                  <span>Private Draft</span>
                </span>
              )}

              <span className="text-xs text-slate-500 font-mono">
                Created {list.createdAt?.slice(0, 10)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {list.title}
            </h1>

            {list.description && (
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans max-w-3xl">
                {list.description}
              </p>
            )}

            {list.curatorNote && (
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs sm:text-sm text-slate-300 italic font-serif max-w-2xl">
                "{list.curatorNote}"
                <div className="text-[11px] font-sans not-italic text-slate-400 mt-1 font-bold">
                  — {list.creatorName}
                </div>
              </div>
            )}

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800">
                <Film className="w-4 h-4 text-emerald-400" />
                <span><strong>{listMovies.length}</strong> Titles Selected</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800">
                <Clock className="w-4 h-4 text-amber-400" />
                <span><strong>{totalHours}h {remainingMinutes}m</strong> Total Runtime</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-800">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span><strong>{avgRating}</strong> Avg Score</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curated Movies Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Films in this Collection</span>
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-800 text-slate-300">
              {listMovies.length}
            </span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Click any movie for full synopsis, streaming links & reviews
          </span>
        </div>

        {listMovies.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-3">
            <Film className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No films added to this list yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              This curated collection currently contains no movie entries.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {listMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onSelect={onSelectMovie}
                onOpenTrailer={onOpenTrailer}
                isWatchlisted={watchlist.includes(movie.id)}
                onToggleWatchlist={onToggleWatchlist}
                watchStatus={trackingMap?.get(movie.id)?.status || (watchlist.includes(movie.id) ? 'plan_to_watch' : null)}
                onUpdateStatus={onUpdateStatus}
                viewMode="grid"
                currentUser={currentUser}
              />
            ))}
          </div>
        )}
      </main>

      {/* Standalone Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-500 space-y-2">
        <p>Curated using <strong>AfroMovieDB</strong> — The Complete Nollywood & African Cinema Registry</p>
        <button
          onClick={onClose}
          className="text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
        >
          Explore More Nigerian Releases & Epics
        </button>
      </footer>

    </div>
  );
};
