import React, { useEffect, useState, useMemo } from 'react';
import { 
  X, 
  Film, 
  User, 
  MapPin, 
  Calendar, 
  Clapperboard, 
  Star, 
  ChevronRight, 
  ExternalLink,
  Award,
  Sparkles,
  Layers,
  RotateCw
} from 'lucide-react';
import { Movie, PersonProfileData, FilmographyItem } from '../types';
import { fetchPersonProfile, KNOWN_PERSON_HEADSHOTS, normalizePersonName } from '../utils/api';

interface PersonProfileModalProps {
  personName: string;
  roleHint?: string;
  initialAvatarUrl?: string;
  tmdbId?: number;
  allMovies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onClose: () => void;
}

export const PersonProfileModal: React.FC<PersonProfileModalProps> = ({
  personName,
  roleHint,
  initialAvatarUrl,
  tmdbId,
  allMovies,
  onSelectMovie,
  onClose
}) => {
  const [profile, setProfile] = useState<PersonProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const data = await fetchPersonProfile(personName, tmdbId, true);
      if (initialAvatarUrl && !data.avatarUrl) {
        data.avatarUrl = initialAvatarUrl;
      }
      setProfile(data);
    } catch (err) {
      console.warn('Failed to refresh person profile:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch official TMDb profile information and headshot
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchPersonProfile(personName, tmdbId)
      .then((data) => {
        if (isMounted) {
          // If initialAvatarUrl was provided and data doesn't have one, keep initial
          if (initialAvatarUrl && !data.avatarUrl) {
            data.avatarUrl = initialAvatarUrl;
          }
          setProfile(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Error fetching person profile:', err);
        if (isMounted) {
          setProfile({
            name: personName,
            avatarUrl: initialAvatarUrl || KNOWN_PERSON_HEADSHOTS[personName.toLowerCase().trim()],
            department: roleHint || 'Filmmaker & Artist'
          });
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [personName, tmdbId, initialAvatarUrl, roleHint]);

  // Compute comprehensive filmography in the current catalogue
  const catalogueFilmography = useMemo<FilmographyItem[]>(() => {
    const rawTarget = personName.toLowerCase().trim();
    const normTarget = normalizePersonName(personName).toLowerCase().trim();
    const results: FilmographyItem[] = [];
    const seenMovieIds = new Set<string>();

    for (const movie of allMovies) {
      const dirLower = movie.director.toLowerCase();
      const prodLower = (movie.producer || '').toLowerCase();

      // Check directing role
      const isDirector = 
        dirLower.includes(rawTarget) || 
        dirLower.includes(normTarget) ||
        rawTarget.includes(dirLower) ||
        (normTarget.length >= 4 && dirLower.includes(normTarget));

      if (isDirector) {
        results.push({
          movie,
          roleType: 'Director'
        });
        seenMovieIds.add(movie.id);
        continue;
      }

      // Check cast role
      const matchingCast = movie.leadCast.find((c) => {
        const cLower = c.actor.toLowerCase();
        const normCast = normalizePersonName(c.actor).toLowerCase();
        return (
          cLower.includes(rawTarget) ||
          cLower.includes(normTarget) ||
          rawTarget.includes(cLower) ||
          (normTarget.length >= 4 && (cLower.includes(normTarget) || normCast.includes(normTarget)))
        );
      });

      if (matchingCast) {
        results.push({
          movie,
          roleType: 'Cast',
          characterRole: matchingCast.role
        });
        seenMovieIds.add(movie.id);
        continue;
      }

      // Check producer role
      if (prodLower && (prodLower.includes(rawTarget) || prodLower.includes(normTarget))) {
        results.push({
          movie,
          roleType: 'Producer'
        });
        seenMovieIds.add(movie.id);
      }
    }

    return results;
  }, [personName, allMovies]);

  const activeAvatar = profile?.avatarUrl || initialAvatarUrl || KNOWN_PERSON_HEADSHOTS[personName.toLowerCase().trim()];

  // Format department badge
  const displayDepartment = useMemo(() => {
    if (profile?.department) {
      if (profile.department === 'Directing') return 'Director & Filmmaker';
      if (profile.department === 'Acting') return 'Actor & Performer';
      return profile.department;
    }
    if (roleHint) {
      if (roleHint.toLowerCase().includes('director')) return 'Director & Filmmaker';
      return roleHint;
    }
    if (catalogueFilmography.some(f => f.roleType === 'Director')) {
      return 'Director & Filmmaker';
    }
    return 'Nollywood Actor & Artist';
  }, [profile, roleHint, catalogueFilmography]);

  return (
    <div 
      id="person-profile-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        id="person-profile-modal-card"
        className="relative w-full max-w-3xl max-h-[92vh] bg-[#0c121d] border border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Clapperboard className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Talent & Filmmaker Profile
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="refresh-person-profile-btn"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
              title="Refresh profile details & credits from TMDb"
              aria-label="Refresh profile"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              id="close-person-modal-btn"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              aria-label="Close profile"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
          
          {/* Main Hero Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Official TMDb Headshot */}
            <div className="relative group shrink-0">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-slate-800 shadow-xl relative">
                {activeAvatar ? (
                  <img
                    src={activeAvatar}
                    alt={profile?.name || personName}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-950/60 to-slate-900 text-emerald-400">
                    <User className="w-16 h-16 opacity-60" />
                  </div>
                )}
                {/* Official TMDb Verified Badge */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-emerald-500/40 text-[10px] font-medium text-emerald-300 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>TMDb</span>
                </div>
              </div>
            </div>

            {/* Profile Bio / Key Specs */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {displayDepartment}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {profile?.name || personName}
                </h2>
              </div>

              {/* Origin and Date Info */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-2 gap-x-4 text-xs text-slate-400">
                {profile?.placeOfBirth && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{profile.placeOfBirth}</span>
                  </div>
                )}
                {profile?.birthday && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Born {profile.birthday}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{catalogueFilmography.length} in NaijaReel Catalogue</span>
                </div>
              </div>

              {/* Biography preview */}
              {isLoading ? (
                <div className="space-y-2 pt-2 animate-pulse">
                  <div className="h-3 bg-slate-800 rounded w-full"></div>
                  <div className="h-3 bg-slate-800 rounded w-4/5"></div>
                </div>
              ) : profile?.biography ? (
                <div className="text-sm text-slate-300 leading-relaxed pt-1">
                  <p className={bioExpanded ? '' : 'line-clamp-3'}>
                    {profile.biography}
                  </p>
                  {profile.biography.length > 200 && (
                    <button
                      onClick={() => setBioExpanded(!bioExpanded)}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 mt-1 transition-colors"
                    >
                      {bioExpanded ? 'Show less' : 'Read full biography'}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic pt-1">
                  Prominent Nollywood filmmaker and talent featured across Nigerian cinema milestones.
                </p>
              )}
            </div>
          </div>

          {/* Section: Catalogue Filmography */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-white text-base">
                  Catalogue Filmography ({catalogueFilmography.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Click any title to view details
              </span>
            </div>

            {catalogueFilmography.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {catalogueFilmography.map(({ movie, roleType, characterRole }) => (
                  <div
                    key={movie.id}
                    id={`person-filmography-${movie.id}`}
                    onClick={() => {
                      onSelectMovie(movie);
                      onClose();
                    }}
                    className="group flex items-center gap-3.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/60 hover:bg-slate-800/80 transition-all cursor-pointer shadow-md"
                  >
                    {/* Poster thumbnail */}
                    <div className="w-14 h-20 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800 relative">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Movie Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          roleType === 'Director' 
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {roleType === 'Director' ? '🎬 Director' : roleType === 'Producer' ? '💼 Producer' : '🎭 Actor'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {movie.releaseYear}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-white truncate group-hover:text-emerald-300 transition-colors">
                        {movie.title}
                      </h4>

                      {characterRole && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          as <span className="text-slate-200 font-medium">{characterRole}</span>
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{movie.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">•</span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {movie.genres.slice(0, 2).join(', ')}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0 mr-1" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-400">
                <Film className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-sm">No other movies currently indexed in this catalogue for this artist.</p>
              </div>
            )}
          </div>

          {/* Section: Other Notable Works from TMDb */}
          {profile?.knownFor && profile.knownFor.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-800/80">
                <Award className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-white text-base">
                  Additional Known Works (TMDb)
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {profile.knownFor.slice(0, 8).map((work) => (
                  <div
                    key={work.id}
                    className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 flex flex-col justify-between text-xs space-y-1.5"
                  >
                    <div className="font-semibold text-slate-200 truncate" title={work.title || work.name}>
                      {work.title || work.name}
                    </div>
                    {work.character && (
                      <div className="text-[11px] text-slate-400 truncate">
                        {work.character}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500">
                      {work.releaseDate ? work.releaseDate.slice(0, 4) : 'TMDb Title'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <span>NaijaReel Nollywood Cast & Crew Registry</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
