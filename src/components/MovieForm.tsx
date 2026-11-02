import React, { useState, useEffect, useMemo } from 'react';
import { 
  Film, Sparkles, Image, Check, AlertCircle, RefreshCw, 
  User, Calendar, Clock, Star, Trophy, Plus, Trash2, Globe, Video
} from 'lucide-react';
import { Movie, Genre, Era, StreamingPlatform } from '../types';
import { 
  validateMovieArtwork, 
  sanitizeAndAlignMovieMetadata, 
  validateMovieForUpload,
  ArtworkValidationResult,
  VERIFIED_NOLLYWOOD_FALLBACK_POSTER,
  VERIFIED_NOLLYWOOD_FALLBACK_BACKDROP,
  determineNollywoodEra
} from '../utils/validation';

export interface MovieFormProps {
  initialMovie?: Partial<Movie> | null;
  onSave: (movie: Movie) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  mode?: 'create' | 'edit';
  isSubmitting?: boolean;
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

const COMMON_LANGUAGES = ['English', 'Nigerian Pidgin', 'Yoruba', 'Igbo', 'Hausa', 'Edo', 'Ibibio'];

export const MovieForm: React.FC<MovieFormProps> = ({
  initialMovie,
  onSave,
  onCancel,
  submitLabel,
  mode = 'create',
  isSubmitting = false
}) => {
  // Form Field States
  const [title, setTitle] = useState(initialMovie?.title || '');
  const [nativeTitle, setNativeTitle] = useState(initialMovie?.nativeTitle || '');
  const [tagline, setTagline] = useState(initialMovie?.tagline || '');
  const [releaseYear, setReleaseYear] = useState<number>(initialMovie?.releaseYear || new Date().getFullYear());
  const [director, setDirector] = useState(initialMovie?.director || '');
  const [directorAvatarUrl, setDirectorAvatarUrl] = useState(initialMovie?.directorAvatarUrl || '');
  const [synopsis, setSynopsis] = useState(initialMovie?.synopsis || '');
  const [culturalSignificance, setCulturalSignificance] = useState(initialMovie?.culturalSignificance || '');
  const [posterUrl, setPosterUrl] = useState(initialMovie?.posterUrl || '');
  const [backdropUrl, setBackdropUrl] = useState(initialMovie?.backdropUrl || '');
  const [runtimeMinutes, setRuntimeMinutes] = useState<number>(initialMovie?.runtimeMinutes || 115);
  const [rating, setRating] = useState<number>(initialMovie?.rating || 8.2);
  const [boxOffice, setBoxOffice] = useState(initialMovie?.boxOffice || '');
  const [trailerYoutubeId, setTrailerYoutubeId] = useState(initialMovie?.trailerYoutubeId || '');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialMovie?.genres || ['Drama']);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(initialMovie?.languages || ['English', 'Nigerian Pidgin']);
  const [actor1, setActor1] = useState(initialMovie?.leadCast?.[0]?.actor || '');
  const [role1, setRole1] = useState(initialMovie?.leadCast?.[0]?.role || '');
  const [actor2, setActor2] = useState(initialMovie?.leadCast?.[1]?.actor || '');
  const [role2, setRole2] = useState(initialMovie?.leadCast?.[1]?.role || '');
  const [platform, setPlatform] = useState<string>(initialMovie?.streamingPlatforms?.[0]?.name || 'Netflix');
  const [formError, setFormError] = useState<string | null>(null);

  // Synchronize when initialMovie changes
  useEffect(() => {
    if (initialMovie) {
      setTitle(initialMovie.title || '');
      setNativeTitle(initialMovie.nativeTitle || '');
      setTagline(initialMovie.tagline || '');
      setReleaseYear(initialMovie.releaseYear || new Date().getFullYear());
      setDirector(initialMovie.director || '');
      setDirectorAvatarUrl(initialMovie.directorAvatarUrl || '');
      setSynopsis(initialMovie.synopsis || '');
      setCulturalSignificance(initialMovie.culturalSignificance || '');
      setPosterUrl(initialMovie.posterUrl || '');
      setBackdropUrl(initialMovie.backdropUrl || '');
      setRuntimeMinutes(initialMovie.runtimeMinutes || 115);
      setRating(initialMovie.rating || 8.2);
      setBoxOffice(initialMovie.boxOffice || '');
      setTrailerYoutubeId(initialMovie.trailerYoutubeId || '');
      setSelectedGenres(initialMovie.genres?.length ? initialMovie.genres : ['Drama']);
      setSelectedLanguages(initialMovie.languages?.length ? initialMovie.languages : ['English', 'Nigerian Pidgin']);
      setActor1(initialMovie.leadCast?.[0]?.actor || '');
      setRole1(initialMovie.leadCast?.[0]?.role || '');
      setActor2(initialMovie.leadCast?.[1]?.actor || '');
      setRole2(initialMovie.leadCast?.[1]?.role || '');
      setPlatform(initialMovie.streamingPlatforms?.[0]?.name || 'Netflix');
    }
  }, [initialMovie]);

  // Dynamically aligned Nollywood Era
  const calculatedEra = useMemo(() => determineNollywoodEra(releaseYear), [releaseYear]);

  // Real-time artwork cross-referencing check
  const artworkValidation: ArtworkValidationResult = useMemo(() => {
    return validateMovieArtwork({
      title,
      posterUrl,
      backdropUrl,
      originCountry: initialMovie?.originCountry || ['NG'],
      releaseYear,
      tmdbId: initialMovie?.tmdbId
    });
  }, [title, posterUrl, backdropUrl, releaseYear, initialMovie?.originCountry, initialMovie?.tmdbId]);

  // Auto-resolve artwork to verified Nollywood asset
  const handleAutoResolveArtwork = () => {
    if (artworkValidation.recommendedPosterUrl) {
      setPosterUrl(artworkValidation.recommendedPosterUrl);
    }
    if (artworkValidation.recommendedBackdropUrl) {
      setBackdropUrl(artworkValidation.recommendedBackdropUrl);
    }
  };

  // Toggle Genre
  const handleToggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? (prev.length > 1 ? prev.filter(g => g !== genre) : prev)
        : [...prev, genre]
    );
  };

  // Toggle Language
  const handleToggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) 
        ? (prev.length > 1 ? prev.filter(l => l !== lang) : prev)
        : [...prev, lang]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Movie title is required.');
      return;
    }
    if (!director.trim()) {
      setFormError('Director name is required.');
      return;
    }

    // Assemble cast members
    const leadCast = [];
    if (actor1.trim()) {
      leadCast.push({ actor: actor1.trim(), role: role1.trim() || 'Lead Character' });
    }
    if (actor2.trim()) {
      leadCast.push({ actor: actor2.trim(), role: role2.trim() || 'Supporting Character' });
    }
    if (leadCast.length === 0) {
      leadCast.push({ actor: 'Nollywood Cast', role: 'Lead Character' });
    }

    // Raw candidate movie
    const candidateData: Partial<Movie> = {
      ...initialMovie,
      id: initialMovie?.id,
      title: title.trim(),
      nativeTitle: nativeTitle.trim() || undefined,
      tagline: tagline.trim() || undefined,
      releaseYear,
      director: director.trim(),
      directorAvatarUrl: directorAvatarUrl.trim() || undefined,
      synopsis: synopsis.trim() || undefined,
      culturalSignificance: culturalSignificance.trim() || undefined,
      posterUrl: posterUrl.trim(),
      backdropUrl: backdropUrl.trim(),
      runtimeMinutes,
      rating,
      boxOffice: boxOffice.trim() || undefined,
      trailerYoutubeId: trailerYoutubeId.trim(),
      genres: selectedGenres,
      languages: selectedLanguages,
      leadCast,
      streamingPlatforms: [{
        name: platform as any,
        badgeColor: platform === 'Netflix' ? 'bg-red-600' : platform === 'Prime Video' ? 'bg-sky-600' : 'bg-emerald-600'
      }],
      originCountry: initialMovie?.originCountry || ['NG'],
      isUserAdded: true
    };

    // Run validation and metadata alignment
    const validationReport = validateMovieForUpload(candidateData);

    if (!validationReport.isValid && validationReport.issues.length > 0) {
      // If the only issue was artwork mismatch, we automatically use the sanitized aligned movie
      if (validationReport.issues.every(i => i.includes('Artwork') || i.includes('poster'))) {
        await onSave(validationReport.sanitizedMovie);
        return;
      }
      setFormError(validationReport.issues[0]);
      return;
    }

    // Sanitize and align all metadata with verified visual assets
    const pristineMovie = sanitizeAndAlignMovieMetadata(validationReport.sanitizedMovie);
    await onSave(pristineMovie);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-slate-100">
      
      {/* Artwork Cross-Referencing & Status Banner */}
      <div className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
        artworkValidation.isValid
          ? 'bg-emerald-950/30 border-emerald-500/40'
          : 'bg-amber-950/30 border-amber-500/40'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            {artworkValidation.isValid ? (
              <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">
                  Visual Asset & Regional Cross-Reference
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                  artworkValidation.isValid
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {artworkValidation.isValid ? '✓ Verified Nollywood Asset' : '⚠️ Action Required'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                {artworkValidation.reason}
              </p>
            </div>
          </div>

          {!artworkValidation.isValid && (
            <button
              type="button"
              onClick={handleAutoResolveArtwork}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Use Verified Fallback</span>
            </button>
          )}
        </div>
      </div>

      {formError && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Main Grid: Visual Asset Previews & Core Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Visual Assets Preview & URLs (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-emerald-400" />
              <span>Poster Preview</span>
            </label>
            <div className="relative aspect-[2/3] w-full max-w-[240px] mx-auto rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg">
              <img 
                src={posterUrl || VERIFIED_NOLLYWOOD_FALLBACK_POSTER} 
                alt="Poster Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = VERIFIED_NOLLYWOOD_FALLBACK_POSTER;
                }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Poster URL (HTTPS)</label>
            <input
              type="url"
              required
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
              placeholder="https://image.tmdb.org/t/p/w500/..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Backdrop Banner URL</label>
            <input
              type="url"
              value={backdropUrl}
              onChange={(e) => setBackdropUrl(e.target.value)}
              placeholder="https://image.tmdb.org/t/p/original/..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Right Column: Titles, Director, Release Year, Genres (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          
          {/* Title & Native Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Official Title <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. A Tribe Called Judah"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Native / Indigenous Title</label>
              <input
                type="text"
                value={nativeTitle}
                onChange={(e) => setNativeTitle(e.target.value)}
                placeholder="e.g. Jagun Jagun (The Warrior)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Release Year & Era Alignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Release Year</label>
              <input
                type="number"
                required
                min={1960}
                max={new Date().getFullYear() + 2}
                value={releaseYear}
                onChange={(e) => setReleaseYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Aligned Nollywood Era</label>
              <div className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-emerald-300 font-semibold truncate flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{calculatedEra}</span>
              </div>
            </div>
          </div>

          {/* Director & Director Headshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Director <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                placeholder="e.g. Kunle Afolayan, Funke Akindele"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Director Avatar / Photo URL</label>
              <input
                type="url"
                value={directorAvatarUrl}
                onChange={(e) => setDirectorAvatarUrl(e.target.value)}
                placeholder="https://image.tmdb.org/t/p/w185/..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Rating, Runtime, Platform */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Rating (1-10)</label>
              <input
                type="number"
                step="0.1"
                min={1}
                max={10}
                value={rating}
                onChange={(e) => setRating(parseFloat(e.target.value) || 8.0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Runtime (Mins)</label>
              <input
                type="number"
                min={20}
                max={360}
                value={runtimeMinutes}
                onChange={(e) => setRuntimeMinutes(parseInt(e.target.value, 10) || 110)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {['Netflix', 'Prime Video', 'YouTube', 'Cinema', 'IROKOtv', 'Africa Magic'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lead Cast */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Lead Actor 1</label>
              <input
                type="text"
                value={actor1}
                onChange={(e) => setActor1(e.target.value)}
                placeholder="e.g. Richard Mofe-Damijo"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Character Role 1</label>
              <input
                type="text"
                value={role1}
                onChange={(e) => setRole1(e.target.value)}
                placeholder="e.g. Chief Balogun"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Genres & Languages Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">Genres</label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_GENRES.map(g => {
              const isSelected = selectedGenres.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleToggleGenre(g)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">Spoken Languages</label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_LANGUAGES.map(lang => {
              const isSelected = selectedLanguages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleToggleLanguage(lang)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Synopsis & Tagline */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Tagline</label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="e.g. Every family has a secret. Some have an entire legacy."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1">Synopsis / Story Description</label>
          <textarea
            rows={3}
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            placeholder="A compelling synopsis capturing the cultural drama and cinematic highlights..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
          />
        </div>
      </div>

      {/* Form Action Controls */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Aligning & Saving…</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>{submitLabel || (mode === 'edit' ? 'Save Changes' : 'Upload to Catalogue')}</span>
            </>
          )}
        </button>
      </div>

    </form>
  );
};
