import React, { useState } from 'react';
import { 
  Sparkles, Download, Check, AlertCircle, Loader2, 
  X, Search, PlusCircle, Globe, Star, Clapperboard, Film
} from 'lucide-react';
import { Movie } from '../types';
import { 
  searchMoviesOnline, 
  pullMovieDetailsFromOnline, 
  WebMovieCandidate,
  POPULAR_NIGERIAN_WEB_SUGGESTIONS,
  isNigerianMovie,
  hasExplicitNigerianOrigin 
} from '../services/moviePuller';

interface AutoPullModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMoviePulled: (movie: Movie) => void;
  existingTitles: string[];
}

export const AutoPullModal: React.FC<AutoPullModalProps> = ({
  isOpen,
  onClose,
  onMoviePulled,
  existingTitles
}) => {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<WebMovieCandidate[]>([]);
  const [pullingId, setPullingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (titleToSearch?: string) => {
    const q = (titleToSearch || query).trim();
    if (!q) return;

    setSearching(true);
    setError(null);
    setCandidates([]);
    setSuccessMessage(null);

    try {
      const results = await searchMoviesOnline(q, true);
      const verifiedResults = (results || []).filter(cand => hasExplicitNigerianOrigin(cand));
      if (!verifiedResults || verifiedResults.length === 0) {
        setError(`No verified Nigerian film found for "${q}". Only real TMDb matches with origin_country: ['NG'] can be imported.`);
      } else {
        setCandidates(verifiedResults.slice(0, 6));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to search movie databases.');
    } finally {
      setSearching(false);
    }
  };

  const handlePullCandidate = async (candidate: WebMovieCandidate) => {
    if (!hasExplicitNigerianOrigin(candidate)) {
      setError(`No verified Nigerian film found: "${candidate.title}" lacks strict origin_country: ['NG'].`);
      return;
    }
    setPullingId(candidate.tmdbId);
    setError(null);
    try {
      const fullMovie = await pullMovieDetailsFromOnline(candidate, true);
      if (!hasExplicitNigerianOrigin(fullMovie)) {
        setError(`No verified Nigerian film found: "${fullMovie.title}" does not have strict origin_country: ['NG'].`);
        return;
      }
      onMoviePulled(fullMovie);
      setSuccessMessage(`"${fullMovie.title}" (${fullMovie.releaseYear}) added to your catalogue!`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err?.message || 'Could not pull complete details for this movie.');
    } finally {
      setPullingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-[#0e1420] border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-950/40">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Auto-Pull Nigerian Movie
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                  Live Internet & Google TMDb
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Search any Nollywood title to automatically pull authentic posters, backdrops, cast & trailers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Search bar */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="auto-pull-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type movie title (e.g. Gangs of Lagos, Shanty Town, House of Ga'a)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                disabled={searching}
              />
            </div>
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-md shadow-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shrink-0"
            >
              {searching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>Pull Movie</span>
                </>
              )}
            </button>
          </form>

          {/* Quick suggestions */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
              Quick-pull popular Nollywood titles:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_NIGERIAN_WEB_SUGGESTIONS.map((title) => {
                const alreadyExists = existingTitles.includes(title);
                return (
                  <button
                    key={title}
                    type="button"
                    onClick={() => {
                      setQuery(title);
                      handleSearch(title);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                      alreadyExists
                        ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-default'
                        : 'bg-slate-800/80 hover:bg-slate-700/90 border-slate-700 text-slate-300 hover:text-emerald-300 hover:border-emerald-600/60'
                    }`}
                  >
                    + {title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status feedback */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-700/60 text-emerald-300 text-xs flex items-center gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>{successMessage}</div>
            </div>
          )}

          {/* Results list */}
          {candidates.filter(isNigerianMovie).length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  Found {candidates.filter(isNigerianMovie).length} verified Nollywood matches:
                </span>
                <span className="text-[11px] text-emerald-400 font-medium">
                  Origin: Nigeria (NG) Verified
                </span>
              </div>

              <div className="space-y-2.5">
                {candidates.filter(isNigerianMovie).map((cand) => {
                  const isPulling = pullingId === cand.tmdbId;
                  const alreadyIn = existingTitles.some(t => t.toLowerCase() === cand.title.toLowerCase());

                  return (
                    <div
                      key={cand.tmdbId}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 flex items-center gap-3.5 transition-all"
                    >
                      {/* Thumbnail */}
                      <div className="w-14 h-20 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                        {cand.posterUrl ? (
                          <img 
                            src={cand.posterUrl} 
                            alt={cand.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <Film className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">
                            {cand.title}
                          </h4>
                          <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-medium">
                            {cand.releaseYear}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2">
                          {cand.overview || 'Nigerian cinema release.'}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-amber-400 font-bold">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{cand.rating.toFixed(1)}</span>
                          <span className="text-slate-500 font-normal">({cand.ratingCount} votes)</span>
                        </div>
                      </div>

                      {/* Pull Button */}
                      <div className="shrink-0">
                        <button
                          onClick={() => handlePullCandidate(cand)}
                          disabled={isPulling || alreadyIn}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                            alreadyIn 
                              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-default'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md active:scale-95'
                          }`}
                        >
                          {isPulling ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                              <span>Adding...</span>
                            </>
                          ) : alreadyIn ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>In Catalogue</span>
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-3.5 h-3.5 text-slate-950" />
                              <span>Pull Movie</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-emerald-400" />
            Live automated metadata extraction & banner synchronization
          </span>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
