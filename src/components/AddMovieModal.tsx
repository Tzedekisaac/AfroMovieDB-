import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Globe, Plus, Search, Sparkles, Film, Check, AlertCircle, 
  ExternalLink, Play, Star, Calendar, User, Eye, ArrowRight, 
  Tv, Clapperboard, Trash2 
} from 'lucide-react';
import { Movie, Genre, Era, StreamingPlatform, CastMember } from '../types';
import { normalizeMovieCollections } from '../utils/movieCollections';
import { sanitizeAndTagMovie } from '../utils/sanitizeAndTagMovie';
import { 
  searchMoviesOnline, 
  pullMovieDetailsFromOnline, 
  WebMovieCandidate, 
  POPULAR_NIGERIAN_WEB_SUGGESTIONS,
  isNigerianMovie 
} from '../services/moviePuller';

interface AddMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMovie: (movie: Movie) => void;
}

const AVAILABLE_GENRES: Genre[] = [
  'Action',
  'Comedy',
  'Crime & Thriller',
  'Drama',
  'Epic & Folklore',
  'Historical Drama',
  'Romantic Comedy'
];

const AVAILABLE_LANGUAGES = ['English', 'Nigerian Pidgin', 'Yoruba', 'Igbo', 'Hausa'];

export const AddMovieModal: React.FC<AddMovieModalProps> = ({
  isOpen,
  onClose,
  onAddMovie
}) => {
  const [activeTab, setActiveTab] = useState<'auto-pull' | 'manual'>('auto-pull');

  // Auto-Pull State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [candidates, setCandidates] = useState<WebMovieCandidate[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<WebMovieCandidate | null>(null);
  const [previewMovie, setPreviewMovie] = useState<Movie | null>(null);
  const [isPullingDetails, setIsPullingDetails] = useState(false);
  const [addedSuccessId, setAddedSuccessId] = useState<string | null>(null);

  // Manual Form State
  const [manualTitle, setManualTitle] = useState('');
  const [manualNativeTitle, setManualNativeTitle] = useState('');
  const [manualYear, setManualYear] = useState<number>(new Date().getFullYear());
  const [manualDirector, setManualDirector] = useState('');
  const [manualTagline, setManualTagline] = useState('');
  const [manualGenres, setManualGenres] = useState<Genre[]>(['Drama']);
  const [manualLanguages, setManualLanguages] = useState<string[]>(['English', 'Nigerian Pidgin']);
  const [manualRuntime, setManualRuntime] = useState<number>(115);
  const [manualRating, setManualRating] = useState<number>(8.5);
  const [manualPosterUrl, setManualPosterUrl] = useState('');
  const [manualBackdropUrl, setManualBackdropUrl] = useState('');
  const [manualSynopsis, setManualSynopsis] = useState('');
  const [manualTrailerId, setManualTrailerId] = useState('');
  const [manualCast1, setManualCast1] = useState({ actor: '', role: '' });
  const [manualCast2, setManualCast2] = useState({ actor: '', role: '' });
  const [manualPlatform, setManualPlatform] = useState<'Netflix' | 'Prime Video' | 'YouTube' | 'Cinema'>('Netflix');

  // Perform internet search
  const handlePerformSearch = async (queryToSearch?: string) => {
    const q = (queryToSearch !== undefined ? queryToSearch : searchQuery).trim();
    if (!q) return;

    setIsSearching(true);
    setSearchError(null);
    setSelectedCandidate(null);
    setPreviewMovie(null);

    try {
      const results = await searchMoviesOnline(q);
      const verifiedResults = (results || []).filter((cand) => isNigerianMovie(cand));
      if (verifiedResults.length === 0) {
        setSearchError(`No verified Nollywood movies found online for "${q}". Hollywood, foreign, and non-Nigerian titles are strictly excluded. Try searching a Nigerian title (e.g. "The Black Book", "King of Boys", "Lionheart") or use the Manual tab.`);
      }
      setCandidates(verifiedResults);
    } catch (err: any) {
      setSearchError('Failed to pull from internet movie servers. Check your connection or add manually.');
    } finally {
      setIsSearching(false);
    }
  };

  // Inspect and pull details for candidate
  const handleSelectCandidate = async (cand: WebMovieCandidate) => {
    if (!isNigerianMovie(cand)) {
      setSearchError(`Movie "${cand.title}" does not meet Nollywood origin requirements and cannot be added.`);
      return;
    }
    setSelectedCandidate(cand);
    setIsPullingDetails(true);
    setSearchError(null);
    try {
      const fullMovie = await pullMovieDetailsFromOnline(cand);
      if (!isNigerianMovie(fullMovie)) {
        setSearchError(`Movie "${fullMovie.title}" does not meet Nigerian origin country or language requirements.`);
        setPreviewMovie(null);
        setSelectedCandidate(null);
        return;
      }
      setPreviewMovie(fullMovie);
    } catch (e: any) {
      console.error(e);
      setSearchError(e?.message || 'Failed to pull movie details.');
    } finally {
      setIsPullingDetails(false);
    }
  };

  // Confirm adding web-pulled movie
  const handleConfirmAddWebMovie = () => {
    if (!previewMovie) return;
    onAddMovie(sanitizeAndTagMovie(previewMovie) as Movie);
    setAddedSuccessId(previewMovie.id);
    setTimeout(() => {
      setAddedSuccessId(null);
      onClose();
    }, 1200);
  };

  // Submit manual movie
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    let era: Era = 'Modern Global Era (2019-Present)';
    if (manualYear <= 2005) era = 'Golden Era (1992-2005)';
    else if (manualYear <= 2018) era = 'New Nollywood (2006-2018)';

    const leadCast: CastMember[] = [];
    if (manualCast1.actor.trim()) leadCast.push({ actor: manualCast1.actor.trim(), role: manualCast1.role.trim() || 'Lead Role' });
    if (manualCast2.actor.trim()) leadCast.push({ actor: manualCast2.actor.trim(), role: manualCast2.role.trim() || 'Supporting Role' });

    const platformBadge = 
      manualPlatform === 'Netflix' ? 'bg-red-600' :
      manualPlatform === 'Prime Video' ? 'bg-blue-600' :
      manualPlatform === 'YouTube' ? 'bg-red-500' : 'bg-amber-600';

    const cleanId = manualTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now().toString().slice(-4);

    const newMovie: Movie = {
      id: cleanId,
      title: manualTitle.trim(),
      nativeTitle: manualNativeTitle.trim() || '',
      tagline: manualTagline.trim() || 'A story of Nigerian spirit and resilience.',
      releaseYear: manualYear,
      director: manualDirector.trim() || 'Independent Director',
      directorAvatarUrl: '',
      leadCast: leadCast,
      genres: manualGenres.length > 0 ? manualGenres : ['Drama'],
      languages: manualLanguages.length > 0 ? manualLanguages : ['English'],
      era: era,
      runtimeMinutes: manualRuntime || 110,
      rating: manualRating,
      ratingCount: 1,
      boxOffice: '',
      posterUrl: manualPosterUrl.trim() || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800&auto=format&fit=crop',
      backdropUrl: manualBackdropUrl.trim() || manualPosterUrl.trim() || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1600&auto=format&fit=crop',
      synopsis: manualSynopsis.trim() || 'A compelling new addition to the Nigerian cinema landscape.',
      culturalSignificance: `User-curated addition to NaijaReel celebrating Nigerian storytelling.`,
      collections: normalizeMovieCollections([]),
      streamingPlatforms: [
        { name: manualPlatform, badgeColor: platformBadge, url: 'https://google.com' }
      ],
      trailerYoutubeId: manualTrailerId.trim() || 'v8wIe7_xK3U',
      amvcaAwards: ['NaijaReel Community Pick'],
      featured: false,
      boxOfficeChampion: false,
      isUserAdded: true,
      source: 'custom'
    };

    onAddMovie(sanitizeAndTagMovie(newMovie) as Movie);
    setAddedSuccessId(newMovie.id);
    setTimeout(() => {
      setAddedSuccessId(null);
      onClose();
    }, 1000);
  };

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-4xl bg-[#101622] border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-4 sm:py-5 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/40">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                Add Movie to NaijaReel
              </h2>
              <p className="text-xs text-slate-400">
                Pull metadata & banners automatically from the internet or create a custom entry
              </p>
            </div>
          </div>

          <button
            id="close-add-modal-btn"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-800 bg-[#0d121c] px-6 shrink-0 gap-6">
          <button
            id="tab-auto-pull"
            onClick={() => setActiveTab('auto-pull')}
            className={`flex items-center gap-2 py-3.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'auto-pull'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Auto-Pull from Web (TMDb / Google)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
              Instant
            </span>
          </button>

          <button
            id="tab-manual-add"
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 py-3.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'manual'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clapperboard className="w-4 h-4" />
            <span>Custom Movie Creator</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: AUTO-PULL FROM INTERNET */}
          {activeTab === 'auto-pull' && (
            <div className="space-y-6">
              
              {/* Search Bar */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Search Movie Name on the Web
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="web-movie-search-input"
                      type="text"
                      placeholder="e.g. Sugar Rush, Far From Home, House of Ga'a, Omo Ghetto..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handlePerformSearch()}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    id="search-web-movies-btn"
                    onClick={() => handlePerformSearch()}
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/40"
                  >
                    {isSearching ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        <span>Pull from Web</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Popular Quick-Click Suggestions */}
                <div className="pt-1">
                  <span className="text-[11px] text-slate-400 font-medium mr-2">Try pulling:</span>
                  <div className="inline-flex flex-wrap gap-1.5 mt-1 sm:mt-0">
                    {POPULAR_NIGERIAN_WEB_SUGGESTIONS.slice(0, 8).map(title => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => {
                          setSearchQuery(title);
                          handlePerformSearch(title);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 border border-slate-700/60 transition-colors"
                      >
                        {title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Error State */}
              {searchError && (
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Candidate Results Grid */}
              {candidates.filter(isNigerianMovie).length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Online Nollywood Matches ({candidates.filter(isNigerianMovie).length})
                    </h3>
                    <span className="text-[11px] text-emerald-400 font-medium">
                      Origin: Nigeria (NG) Strictly Verified
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {candidates.filter(isNigerianMovie).map((cand) => {
                      const isSelected = selectedCandidate?.tmdbId === cand.tmdbId;
                      return (
                        <div
                          key={cand.tmdbId}
                          onClick={() => handleSelectCandidate(cand)}
                          className={`p-3 rounded-xl border flex gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/30'
                              : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="w-14 h-20 bg-slate-950 rounded-lg overflow-hidden shrink-0 border border-slate-800">
                            {cand.posterUrl ? (
                              <img
                                src={cand.posterUrl}
                                alt={cand.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-600">
                                <Film className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                {cand.releaseYear}
                              </span>
                              <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                                <Star className="w-3 h-3 fill-amber-400" />
                                <span>{cand.rating.toFixed(1)}</span>
                              </div>
                            </div>
                            <h4 className="text-sm font-bold text-white truncate">
                              {cand.title}
                            </h4>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {cand.overview}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Live Preview Panel for Selected Web Candidate */}
              {isPullingDetails && (
                <div className="py-8 text-center space-y-2 bg-slate-900/30 rounded-2xl border border-slate-800">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">
                    Pulling Google banners, cast, synopsis and trailers for film...
                  </p>
                </div>
              )}

              {previewMovie && !isPullingDetails && (
                <div className="bg-[#0b0f17] border border-emerald-500/40 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl shadow-black/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Live Preview & Banners Ready
                    </span>
                    <span className="text-xs text-slate-400">
                      TMDb / Google Theatrical Banner
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-5">
                    {/* Theatrical Poster */}
                    <div className="w-32 sm:w-40 aspect-[2/3] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 shadow-lg">
                      <img
                        src={previewMovie.posterUrl}
                        alt={previewMovie.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Metadata preview */}
                    <div className="flex-1 min-w-0 space-y-2.5">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-semibold">
                            {previewMovie.era}
                          </span>
                          <span className="text-xs text-slate-400">
                            {previewMovie.releaseYear} • {previewMovie.runtimeMinutes} mins
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                          {previewMovie.title}
                        </h3>
                        <p className="text-xs text-emerald-400 italic">
                          "{previewMovie.tagline}"
                        </p>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {previewMovie.synopsis}
                      </p>

                      <div className="text-xs text-slate-400 space-y-1">
                        <p>
                          <span className="text-slate-500">Director:</span>{' '}
                          <strong className="text-slate-200">{previewMovie.director}</strong>
                        </p>
                        <p className="line-clamp-1">
                          <span className="text-slate-500">Lead Cast:</span>{' '}
                          <span className="text-slate-300">
                            {previewMovie.leadCast.map(c => c.actor).join(', ')}
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {Array.from(new Set(previewMovie.genres)).map((g, idx) => (
                            <span key={`${g}-${idx}`} className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add action */}
                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setPreviewMovie(null)}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      id="confirm-add-pulled-movie-btn"
                      onClick={handleConfirmAddWebMovie}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/50 hover:scale-102 active:scale-98 transition-all"
                    >
                      {addedSuccessId ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Added to Catalogue!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>Add to Catalogue</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: MANUAL MOVIE CREATOR */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Movie Title <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    id="manual-title-input"
                    type="text"
                    required
                    placeholder="e.g. Gangs of Lagos"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Native Title */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Native / Indigenous Title (Optional)
                  </label>
                  <input
                    id="manual-native-title-input"
                    type="text"
                    placeholder="e.g. Ọba Àwọn Ọmọ Ìgboro"
                    value={manualNativeTitle}
                    onChange={(e) => setManualNativeTitle(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Year */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Release Year <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    id="manual-year-input"
                    type="number"
                    min="1960"
                    max="2030"
                    required
                    value={manualYear}
                    onChange={(e) => setManualYear(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Director */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Director Name <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    id="manual-director-input"
                    type="text"
                    required
                    placeholder="e.g. Jade Osiberu, Kemi Adetiba"
                    value={manualDirector}
                    onChange={(e) => setManualDirector(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Rating & Runtime */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Rating (out of 10)
                  </label>
                  <input
                    id="manual-rating-input"
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={manualRating}
                    onChange={(e) => setManualRating(parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Runtime (minutes)
                  </label>
                  <input
                    id="manual-runtime-input"
                    type="number"
                    min="30"
                    max="300"
                    value={manualRuntime}
                    onChange={(e) => setManualRuntime(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Tagline */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Tagline
                </label>
                <input
                  id="manual-tagline-input"
                  type="text"
                  placeholder="e.g. When justice is corrupt, vengeance becomes holy."
                  value={manualTagline}
                  onChange={(e) => setManualTagline(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Poster Banner URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Movie Poster / Google Banner Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    id="manual-poster-input"
                    type="url"
                    placeholder="https://image.tmdb.org/t/p/w780/... or web image link"
                    value={manualPosterUrl}
                    onChange={(e) => setManualPosterUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {manualPosterUrl && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-950">
                      <img src={manualPosterUrl} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Tip: You can paste any high-res banner link found on Google Images or TMDb.
                </p>
              </div>

              {/* Backdrop URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Backdrop / Landscape Banner Image URL (Optional)
                </label>
                <input
                  id="manual-backdrop-input"
                  type="url"
                  placeholder="https://image.tmdb.org/t/p/original/... (Landscape image)"
                  value={manualBackdropUrl}
                  onChange={(e) => setManualBackdropUrl(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Genres Selection Chips */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Select Genres
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_GENRES.map(g => {
                    const isSelected = manualGenres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          setManualGenres(prev => 
                            prev.includes(g)
                              ? (prev.length > 1 ? prev.filter(x => x !== g) : prev)
                              : [...prev, g]
                          );
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cast Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Lead Actor 1
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Actor Name (e.g. Richard Mofe-Damijo)"
                      value={manualCast1.actor}
                      onChange={(e) => setManualCast1(prev => ({ ...prev, actor: e.target.value }))}
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Character"
                      value={manualCast1.role}
                      onChange={(e) => setManualCast1(prev => ({ ...prev, role: e.target.value }))}
                      className="w-28 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Lead Actor 2
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Actor Name (e.g. Sola Sobowale)"
                      value={manualCast2.actor}
                      onChange={(e) => setManualCast2(prev => ({ ...prev, actor: e.target.value }))}
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Character"
                      value={manualCast2.role}
                      onChange={(e) => setManualCast2(prev => ({ ...prev, role: e.target.value }))}
                      className="w-28 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Synopsis */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Synopsis / Story Summary
                </label>
                <textarea
                  id="manual-synopsis-input"
                  rows={3}
                  required
                  placeholder="Describe the plot, stakes, and setting..."
                  value={manualSynopsis}
                  onChange={(e) => setManualSynopsis(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Streaming Platform */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Primary Streaming Platform
                  </label>
                  <select
                    value={manualPlatform}
                    onChange={(e: any) => setManualPlatform(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Netflix">Netflix</option>
                    <option value="Prime Video">Prime Video</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Cinema">Cinema</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    YouTube Trailer Video ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. v8wIe7_xK3U"
                    value={manualTrailerId}
                    onChange={(e) => setManualTrailerId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  id="submit-manual-movie-btn"
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all"
                >
                  {addedSuccessId ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Movie Saved!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Save & Add Film</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>
      </motion.div>
    </div>
  );
};
