import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  X, Save, Film, Sparkles, User, Image, Calendar, Clock, 
  Star, Trophy, Plus, Trash2, Check, AlertCircle, RefreshCw,
  ExternalLink, Layers, Globe, Video
} from 'lucide-react';
import { Movie, Genre, Era, CastMember, StreamingPlatform } from '../types';

interface EditMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: Movie | null;
  onSaveMovie: (updatedMovie: Movie) => Promise<void> | void;
  currentUser?: FirebaseUser | null;
}

const COMMON_GENRES: Genre[] = [
  'Action',
  'Comedy',
  'Crime & Thriller',
  'Drama',
  'Epic & Folklore',
  'Historical Drama',
  'Romantic Comedy'
];

const EXTRA_GENRES = ['Horror', 'Mystery', 'Family', 'Musical', 'Documentary', 'Adventure'];

const COMMON_LANGUAGES = ['English', 'Nigerian Pidgin', 'Yoruba', 'Igbo', 'Hausa', 'Edo', 'Ibibio'];

export const EditMovieModal: React.FC<EditMovieModalProps> = ({
  isOpen,
  onClose,
  movie,
  onSaveMovie,
  currentUser
}) => {
  // Form States
  const [title, setTitle] = useState('');
  const [nativeTitle, setNativeTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [releaseYear, setReleaseYear] = useState<number>(2024);
  const [director, setDirector] = useState('');
  const [directorAvatarUrl, setDirectorAvatarUrl] = useState('');
  const [directorTmdbId, setDirectorTmdbId] = useState<number | undefined>(undefined);
  const [synopsis, setSynopsis] = useState('');
  const [culturalSignificance, setCulturalSignificance] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [runtimeMinutes, setRuntimeMinutes] = useState<number>(110);
  const [rating, setRating] = useState<number>(8.0);
  const [boxOffice, setBoxOffice] = useState('');
  const [trailerYoutubeId, setTrailerYoutubeId] = useState('');
  const [era, setEra] = useState<Era>('Modern Global Era (2019-Present)');
  
  // Genres & Languages
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [customGenreInput, setCustomGenreInput] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Cast List
  const [castList, setCastList] = useState<CastMember[]>([]);

  // Streaming Platforms
  const [streamingPlatforms, setStreamingPlatforms] = useState<StreamingPlatform[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<'basics' | 'cast' | 'media'>('basics');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync form when movie changes
  useEffect(() => {
    if (movie) {
      setTitle(movie.title || '');
      setNativeTitle(movie.nativeTitle || '');
      setTagline(movie.tagline || '');
      setReleaseYear(movie.releaseYear || new Date().getFullYear());
      setDirector(movie.director || '');
      setDirectorAvatarUrl(movie.directorAvatarUrl || '');
      setDirectorTmdbId(movie.directorTmdbId);
      setSynopsis(movie.synopsis || '');
      setCulturalSignificance(movie.culturalSignificance || '');
      setBackdropUrl(movie.backdropUrl || '');
      setPosterUrl(movie.posterUrl || '');
      setRuntimeMinutes(movie.runtimeMinutes || 100);
      setRating(movie.rating || 7.5);
      setBoxOffice(movie.boxOffice || '');
      setTrailerYoutubeId(movie.trailerYoutubeId || '');
      setEra(movie.era || 'Modern Global Era (2019-Present)');
      setSelectedGenres(Array.isArray(movie.genres) ? [...movie.genres] : ['Drama']);
      setSelectedLanguages(Array.isArray(movie.languages) ? [...movie.languages] : ['English']);
      setCastList(Array.isArray(movie.leadCast) ? movie.leadCast.map(c => ({ ...c })) : []);
      setStreamingPlatforms(Array.isArray(movie.streamingPlatforms) ? [...movie.streamingPlatforms] : []);
      setErrorMessage(null);
      setSaveSuccess(false);
    }
  }, [movie, isOpen]);

  if (!isOpen || !movie) return null;

  // Toggle Genre
  const handleToggleGenre = (g: string) => {
    setSelectedGenres(prev => 
      prev.includes(g) ? prev.filter(item => item !== g) : [...prev, g]
    );
  };

  // Add custom genre
  const handleAddCustomGenre = () => {
    const trimmed = customGenreInput.trim();
    if (trimmed && !selectedGenres.includes(trimmed)) {
      setSelectedGenres(prev => [...prev, trimmed]);
      setCustomGenreInput('');
    }
  };

  // Toggle Language
  const handleToggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  // Cast member handlers
  const handleAddCastMember = () => {
    setCastList(prev => [...prev, { actor: '', role: '', avatarUrl: '' }]);
  };

  const handleUpdateCastMember = (index: number, field: keyof CastMember, value: string) => {
    setCastList(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveCastMember = (index: number) => {
    setCastList(prev => prev.filter((_, i) => i !== index));
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Movie title is required.');
      return;
    }
    if (!director.trim()) {
      setErrorMessage('Director name is required.');
      return;
    }
    if (!synopsis.trim()) {
      setErrorMessage('Synopsis is required.');
      return;
    }

    // Filter out blank cast members
    const cleanCast = castList.filter(c => c.actor.trim().length > 0);

    // Auto determine era if year shifted significantly
    let calculatedEra = era;
    if (releaseYear <= 2005) calculatedEra = 'Golden Era (1992-2005)';
    else if (releaseYear <= 2018) calculatedEra = 'New Nollywood (2006-2018)';
    else calculatedEra = 'Modern Global Era (2019-Present)';

    // Standardize trailer ID if user pasted full YouTube link
    let cleanTrailerId = trailerYoutubeId.trim();
    if (cleanTrailerId.includes('youtube.com/watch?v=')) {
      cleanTrailerId = cleanTrailerId.split('watch?v=')[1]?.split('&')[0] || cleanTrailerId;
    } else if (cleanTrailerId.includes('youtu.be/')) {
      cleanTrailerId = cleanTrailerId.split('youtu.be/')[1]?.split('?')[0] || cleanTrailerId;
    }

    const updatedMovie: Movie = {
      ...movie,
      title: title.trim(),
      nativeTitle: nativeTitle.trim() || '',
      tagline: tagline.trim() || `${title} - Iconic Nigerian Cinema`,
      releaseYear: Number(releaseYear) || movie.releaseYear,
      director: director.trim(),
      directorAvatarUrl: directorAvatarUrl.trim() || movie.directorAvatarUrl || '',
      directorTmdbId: directorTmdbId || movie.directorTmdbId || undefined,
      synopsis: synopsis.trim(),
      culturalSignificance: culturalSignificance.trim() || movie.culturalSignificance || '',
      backdropUrl: backdropUrl.trim() || movie.backdropUrl || '',
      posterUrl: posterUrl.trim() || movie.posterUrl || '',
      runtimeMinutes: Number(runtimeMinutes) || movie.runtimeMinutes,
      rating: Number(rating) || movie.rating,
      boxOffice: boxOffice.trim() || movie.boxOffice || '',
      trailerYoutubeId: cleanTrailerId,
      era: calculatedEra,
      genres: selectedGenres.length > 0 ? selectedGenres : ['Drama'],
      languages: selectedLanguages.length > 0 ? selectedLanguages : ['English'],
      leadCast: cleanCast.length > 0 ? cleanCast : movie.leadCast,
      streamingPlatforms: streamingPlatforms.length > 0 ? streamingPlatforms : movie.streamingPlatforms,
      isUserAdded: true, // Marked to ensure persistence across all catalogue filters
      addedByUserId: movie.addedByUserId || currentUser?.uid
    };

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await onSaveMovie(updatedMovie);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error saving movie updates:', err);
      setErrorMessage(err?.message || 'Failed to sync updates to Firebase Firestore. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-black/80 backdrop-blur-md flex justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        id="edit-movie-modal-container"
        className="relative w-full max-w-3xl bg-[#0e131d] border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl text-slate-100 my-auto flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Edit Movie Details
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Firebase Sync
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Modify title, director, cast, synopsis, banner, and genres stored in Firestore.
              </p>
            </div>
          </div>

          <button
            id="close-edit-movie-btn"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Cancel and close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-800/70 bg-slate-950/40 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('basics')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'basics'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Title & Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cast')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'cast'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Director & Cast ({castList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'media'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Banner & Media</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {saveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Film details successfully updated and synchronized to Firebase Firestore!</span>
            </div>
          )}

          {/* TAB 1: BASICS */}
          {activeTab === 'basics' && (
            <div className="space-y-4">
              
              {/* Title & Native Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Movie Title <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    id="edit-movie-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. A Tribe Called Judah"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Indigenous / Native Title (Optional)
                  </label>
                  <input
                    id="edit-movie-native-title"
                    type="text"
                    value={nativeTitle}
                    onChange={(e) => setNativeTitle(e.target.value)}
                    placeholder="e.g. Aníkúlápó: Rise of the Spectre"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tagline / Catchphrase
                </label>
                <input
                  id="edit-movie-tagline"
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Family bonds tested by a bold heist."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Release Year, Runtime, Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Release Year
                  </label>
                  <input
                    id="edit-movie-year"
                    type="number"
                    min="1980"
                    max="2035"
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Runtime (Minutes)
                  </label>
                  <input
                    id="edit-movie-runtime"
                    type="number"
                    min="30"
                    max="360"
                    value={runtimeMinutes}
                    onChange={(e) => setRuntimeMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Audience Rating (0 - 10)
                  </label>
                  <input
                    id="edit-movie-rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Box office milestone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Box Office Milestone / Distribution Reach
                </label>
                <input
                  id="edit-movie-box-office"
                  type="text"
                  value={boxOffice}
                  onChange={(e) => setBoxOffice(e.target.value)}
                  placeholder="e.g. ₦1.44 Billion Gross (Record-Setting Champion)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Synopsis */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Synopsis / Story Overview <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  id="edit-movie-synopsis"
                  required
                  rows={4}
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder="Provide an overview of the story, key conflicts, and memorable narrative arc..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              {/* Cultural Significance */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nollywood Cultural Impact & Significance
                </label>
                <textarea
                  id="edit-movie-cultural"
                  rows={3}
                  value={culturalSignificance}
                  onChange={(e) => setCulturalSignificance(e.target.value)}
                  placeholder="Explain why this film matters to Nigerian film history, diaspora audiences, or box office records..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              {/* Genres Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Genres ({selectedGenres.length} selected)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[...COMMON_GENRES, ...EXTRA_GENRES].map(genre => {
                    const isSelected = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => handleToggleGenre(genre)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        {isSelected && '✓ '} {genre}
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Genre */}
                <div className="flex gap-2 max-w-sm mt-1">
                  <input
                    type="text"
                    placeholder="Add other genre..."
                    value={customGenreInput}
                    onChange={(e) => setCustomGenreInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomGenre();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomGenre}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Languages Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Languages Spoken
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_LANGUAGES.map(lang => {
                    const isSelected = selectedLanguages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => handleToggleLanguage(lang)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-teal-500 text-slate-950 shadow-sm'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        {isSelected && '✓ '} {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DIRECTOR & CAST */}
          {activeTab === 'cast' && (
            <div className="space-y-6">
              
              {/* Director Details Section */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    Director Information
                  </h3>
                  <span className="text-[11px] text-slate-400">Essential Nollywood Filmmaker</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Director Full Name <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      id="edit-movie-director"
                      type="text"
                      required
                      value={director}
                      onChange={(e) => setDirector(e.target.value)}
                      placeholder="e.g. Funke Akindele, Kunle Afolayan, Kemi Adetiba"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Director Headshot / Avatar URL
                    </label>
                    <input
                      id="edit-movie-director-avatar"
                      type="url"
                      value={directorAvatarUrl}
                      onChange={(e) => setDirectorAvatarUrl(e.target.value)}
                      placeholder="https://image.tmdb.org/t/p/w185/..."
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Director Avatar Preview */}
                {directorAvatarUrl && (
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-950 border border-slate-700 shrink-0">
                      <img
                        src={directorAvatarUrl}
                        alt={director}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">Headshot preview for {director}</span>
                  </div>
                )}
              </div>

              {/* Lead Cast List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-400" />
                      Lead Cast & Characters
                    </h3>
                    <p className="text-xs text-slate-400">
                      Add key actors, character names, and official headshot paths.
                    </p>
                  </div>
                  <button
                    id="add-cast-member-btn"
                    type="button"
                    onClick={handleAddCastMember}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Actor</span>
                  </button>
                </div>

                {castList.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-800 rounded-2xl space-y-2">
                    <p className="text-xs text-slate-500">No cast members entered yet.</p>
                    <button
                      type="button"
                      onClick={handleAddCastMember}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      + Add first actor
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {castList.map((cast, index) => (
                      <div 
                        key={index}
                        className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Cast Member #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCastMember(index)}
                            className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                            title="Remove cast member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              Actor Full Name
                            </label>
                            <input
                              type="text"
                              value={cast.actor}
                              onChange={(e) => handleUpdateCastMember(index, 'actor', e.target.value)}
                              placeholder="e.g. Richard Mofe-Damijo"
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              Character Role
                            </label>
                            <input
                              type="text"
                              value={cast.role}
                              onChange={(e) => handleUpdateCastMember(index, 'role', e.target.value)}
                              placeholder="e.g. Paul Edima / Detective"
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            Actor Headshot URL (Optional)
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="url"
                              value={cast.avatarUrl || ''}
                              onChange={(e) => handleUpdateCastMember(index, 'avatarUrl', e.target.value)}
                              placeholder="https://image.tmdb.org/t/p/w185/..."
                              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            {cast.avatarUrl && (
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 shrink-0">
                                <img
                                  src={cast.avatarUrl}
                                  alt={cast.actor}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: BANNER & MEDIA */}
          {activeTab === 'media' && (
            <div className="space-y-5">
              
              {/* Banner / Backdrop URL */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Banner Backdrop URL (Landscape 16:9) <span className="text-emerald-400">*</span>
                </label>
                <input
                  id="edit-movie-backdrop-url"
                  type="url"
                  required
                  value={backdropUrl}
                  onChange={(e) => setBackdropUrl(e.target.value)}
                  placeholder="https://image.tmdb.org/t/p/original/... or https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                
                {/* Live Banner Preview */}
                <div className="mt-2 relative aspect-[16/8] sm:aspect-[16/7] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md">
                  {backdropUrl ? (
                    <img
                      src={backdropUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                      <Image className="w-8 h-8 mb-1" />
                      <span className="text-xs">No banner URL provided</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                    <span className="text-xs font-bold text-white uppercase tracking-wider bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-sm">
                      Live Hero Banner Preview
                    </span>
                  </div>
                </div>
              </div>

              {/* Poster URL */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Portrait Poster URL (3:4 ratio)
                </label>
                <div className="flex gap-4 items-start">
                  <div className="flex-1 space-y-1">
                    <input
                      id="edit-movie-poster-url"
                      type="url"
                      value={posterUrl}
                      onChange={(e) => setPosterUrl(e.target.value)}
                      placeholder="https://image.tmdb.org/t/p/w500/... or verified poster URL"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[11px] text-slate-400">
                      Used on catalog cards, user profile pages, and mobile view listings.
                    </p>
                  </div>

                  {/* Thumbnail preview */}
                  <div className="w-16 h-24 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 shadow-sm">
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt="Poster Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <Image className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* YouTube Trailer ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  YouTube Trailer Video ID or Full Link
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Video className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="edit-movie-trailer-id"
                      type="text"
                      value={trailerYoutubeId}
                      onChange={(e) => setTrailerYoutubeId(e.target.value)}
                      placeholder="e.g. dQw4w9WgXcQ or https://youtu.be/..."
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  {trailerYoutubeId && (
                    <a
                      href={`https://www.youtube.com/watch?v=${trailerYoutubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Test YouTube Trailer Link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Modal Footer / Save Actions */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky bottom-0 bg-[#0e131d]/95 backdrop-blur-md">
            <span className="text-xs text-slate-400">
              Logged in as <strong className="text-slate-200">{currentUser?.displayName || currentUser?.email || 'Authenticated User'}</strong>
            </span>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                id="submit-edit-movie-btn"
                type="submit"
                disabled={isSaving || saveSuccess}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-950/60 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Syncing to Firestore...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Movie Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
