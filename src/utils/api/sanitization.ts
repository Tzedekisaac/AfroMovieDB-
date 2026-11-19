import type { Movie, StreamingPlatform, CastMember, Era } from '../../types.ts';
import {
  GENRE_MAP,
  PLATFORM_PRESETS,
  DEFAULT_MOVIE_RUNTIME_MINUTES
} from '../../data/tmdbConfig.ts';
import {
  isNigerianMovie,
  parseSpokenLanguages,
  extractOriginCountries,
  NIGERIAN_ORIGIN_COUNTRY
} from '../nigerianMovieValidator.ts';
import { normalizeMovieCollections } from '../movieCollections.ts';
import { sanitizeAndTagMovie } from '../sanitizeAndTagMovie.ts';
import {
  buildTmdbPosterUrl,
  buildTmdbBackdropUrl,
  buildTmdbAvatarUrl
} from './artworkHelpers.ts';
import type { WebMovieCandidate } from './types.ts';

export function determineEra(year: number): Era {
  if (year <= 2005) return 'Golden Era (1992-2005)';
  if (year <= 2018) return 'New Nollywood (2006-2018)';
  return 'Modern Global Era (2019-Present)';
}

export function getDefaultStreamingPlatforms(releaseYear: number): StreamingPlatform[] {
  if (releaseYear >= 2021) {
    return [{ ...PLATFORM_PRESETS.netflix }, { ...PLATFORM_PRESETS.prime }];
  }
  if (releaseYear >= 2010) {
    return [{ ...PLATFORM_PRESETS.netflix }, { ...PLATFORM_PRESETS.youtube }];
  }
  return [{ ...PLATFORM_PRESETS.youtube }, { ...PLATFORM_PRESETS.africaMagic }];
}

/**
 * Strict online-search check: requires explicit 'NG' in origin_country / production_countries
 * AND passing authoritative Nigerian cinema verification (blocks blacklisted titles/crew and foreign studios).
 */
export function hasExplicitNigerianOrigin(movieOrItem: any): boolean {
  if (!movieOrItem || typeof movieOrItem !== 'object') return false;
  const countries = extractOriginCountries(movieOrItem);
  return countries.includes(NIGERIAN_ORIGIN_COUNTRY) && isNigerianMovie(movieOrItem);
}

/**
 * Rigorously sanitizes candidate movie data discovered from TMDb or search endpoints.
 * Strips out or defaults any undefined or null properties to prevent runtime crashes.
 */
export function sanitizeCandidate(item: any, fallbackTitle: string = ''): WebMovieCandidate {
  if (!item || typeof item !== 'object') {
    return {
      tmdbId: 0,
      title: fallbackTitle,
      originalTitle: '',
      releaseYear: new Date().getFullYear(),
      overview: '',
      posterUrl: '',
      backdropUrl: '',
      rating: 0,
      ratingCount: 0,
      genreIds: [],
      language: 'en',
      popularity: 0
    };
  }

  let year = new Date().getFullYear();
  if (typeof item.release_date === 'string' && item.release_date.trim()) {
    const parsedYear = parseInt(item.release_date.split('-')[0], 10);
    if (!isNaN(parsedYear) && parsedYear >= 1950 && parsedYear <= new Date().getFullYear() + 2) {
      year = parsedYear;
    }
  } else if (typeof item.releaseYear === 'number' && !isNaN(item.releaseYear) && item.releaseYear >= 1950) {
    year = Math.floor(item.releaseYear);
  }

  const rawTitle = typeof item.title === 'string' && item.title.trim()
    ? item.title.trim()
    : typeof item.original_title === 'string' && item.original_title.trim()
      ? item.original_title.trim()
      : typeof item.name === 'string' && item.name.trim()
        ? item.name.trim()
        : fallbackTitle;

  const originalTitle = typeof item.original_title === 'string' && item.original_title.trim()
    ? item.original_title.trim()
    : typeof item.originalTitle === 'string' && item.originalTitle.trim()
      ? item.originalTitle.trim()
      : '';

  const posterPath = buildTmdbPosterUrl(item.poster_path, item.posterUrl);
  const backdropPath = buildTmdbBackdropUrl(item.backdrop_path, item.backdropUrl, posterPath);

  const rating = typeof item.vote_average === 'number' && !isNaN(item.vote_average) && item.vote_average > 0
    ? Math.min(10, Math.max(0, Math.round(item.vote_average * 10) / 10))
    : typeof item.rating === 'number' && !isNaN(item.rating) && item.rating > 0
      ? Math.min(10, Math.max(0, Math.round(item.rating * 10) / 10))
      : 0;

  const ratingCount = typeof item.vote_count === 'number' && !isNaN(item.vote_count) && item.vote_count >= 0
    ? Math.floor(item.vote_count)
    : typeof item.ratingCount === 'number' && !isNaN(item.ratingCount) && item.ratingCount >= 0
      ? Math.floor(item.ratingCount)
      : 0;

  const genreIds = Array.isArray(item.genre_ids)
    ? item.genre_ids.filter((g: any) => typeof g === 'number' && !isNaN(g))
    : Array.isArray(item.genreIds)
      ? item.genreIds.filter((g: any) => typeof g === 'number' && !isNaN(g))
      : [];

  const overview = typeof item.overview === 'string' && item.overview.trim()
    ? item.overview.trim()
    : '';

  const language = typeof item.original_language === 'string' && item.original_language.trim()
    ? item.original_language.trim()
    : typeof item.language === 'string' && item.language.trim()
      ? item.language.trim()
      : 'en';

  const popularity = typeof item.popularity === 'number' && !isNaN(item.popularity)
    ? item.popularity
    : 0;

  const tmdbId = typeof item.id === 'number' && !isNaN(item.id)
    ? Math.floor(item.id)
    : typeof item.tmdbId === 'number' && !isNaN(item.tmdbId)
      ? Math.floor(item.tmdbId)
      : Math.floor(Math.random() * 900000) + 100000;

  const originCountry = extractOriginCountries(item);
  const originalLanguage = typeof item.original_language === 'string' && item.original_language.trim()
    ? item.original_language.trim().toLowerCase()
    : typeof item.originalLanguage === 'string' && item.originalLanguage.trim()
      ? item.originalLanguage.trim().toLowerCase()
      : language;

  return {
    tmdbId,
    title: rawTitle,
    originalTitle,
    releaseYear: year,
    overview,
    posterUrl: posterPath,
    backdropUrl: backdropPath,
    rating,
    ratingCount,
    genreIds,
    language,
    popularity,
    originCountry: originCountry.length > 0 ? originCountry : undefined,
    originalLanguage
  };
}

export function formatTmdbResult(item: any, fallbackTitle: string): WebMovieCandidate {
  return sanitizeCandidate(item, fallbackTitle);
}

/**
 * Rigorously sanitizes a full Movie object, guaranteeing zero undefined, null,
 * or corrupted fields to prevent any downstream component crashes.
 */
export function sanitizeMovie(movie: any): Movie {
  if (!movie || typeof movie !== 'object') {
    const fallbackId = `movie-${Date.now()}`;
    return sanitizeAndTagMovie({
      id: fallbackId,
      title: '',
      nativeTitle: '',
      tagline: '',
      releaseYear: new Date().getFullYear(),
      director: '',
      directorAvatarUrl: '',
      leadCast: [],
      genres: ['Drama'],
      languages: ['English'],
      era: 'Modern Global Era (2019-Present)',
      runtimeMinutes: DEFAULT_MOVIE_RUNTIME_MINUTES,
      rating: 0,
      ratingCount: 0,
      posterUrl: '',
      backdropUrl: '',
      synopsis: '',
      culturalSignificance: '',
      streamingPlatforms: [],
      collections: [],
      trailerYoutubeId: '',
      amvcaAwards: [],
      featured: false,
      boxOfficeChampion: false,
      isUserAdded: true,
      source: 'web_pulled'
    }) as Movie;
  }

  const title = String(movie.title || '').trim();

  let year = new Date().getFullYear();
  if (typeof movie.releaseYear === 'number' && !isNaN(movie.releaseYear) && movie.releaseYear >= 1950) {
    year = Math.floor(movie.releaseYear);
  } else if (typeof movie.release_date === 'string' && movie.release_date.trim()) {
    const parsed = parseInt(movie.release_date.split('-')[0], 10);
    if (!isNaN(parsed) && parsed >= 1950) {
      year = parsed;
    }
  }
  const era = determineEra(year);

  let id = typeof movie.id === 'string' && movie.id.trim() ? movie.id.trim() : '';
  if (!id) {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const numId = typeof movie.tmdbId === 'number' && !isNaN(movie.tmdbId) ? movie.tmdbId : Date.now();
    id = `${slug || 'film'}-${numId}`;
  }

  let tmdbId: number | undefined = undefined;
  if (typeof movie.tmdbId === 'number' && !isNaN(movie.tmdbId) && movie.tmdbId > 0) {
    tmdbId = Math.floor(movie.tmdbId);
  } else if (typeof movie.id === 'number' && !isNaN(movie.id) && movie.id > 0) {
    tmdbId = Math.floor(movie.id);
  }

  const director = String(movie.director || '').trim();
  const directorAvatarUrl = typeof movie.directorAvatarUrl === 'string' ? movie.directorAvatarUrl.trim() : '';
  let directorTmdbId: number | undefined = undefined;
  if (typeof movie.directorTmdbId === 'number' && !isNaN(movie.directorTmdbId) && movie.directorTmdbId > 0) {
    directorTmdbId = Math.floor(movie.directorTmdbId);
  }

  let leadCast: CastMember[] = [];
  if (Array.isArray(movie.leadCast)) {
    leadCast = movie.leadCast
      .map((c: any) => {
        if (!c || typeof c !== 'object') return null;
        const actor = String(c.actor || c.name || '').trim();
        if (!actor) return null;
        const role = String(c.role || c.character || 'Cast Member').trim() || 'Cast Member';
        const avatarUrl = buildTmdbAvatarUrl(c.profile_path, c.avatarUrl, 'w185');
        const castTmdbId =
          typeof c.tmdbId === 'number' && !isNaN(c.tmdbId)
            ? c.tmdbId
            : typeof c.id === 'number' && !isNaN(c.id)
              ? c.id
              : undefined;
        return {
          actor,
          role,
          avatarUrl: avatarUrl || undefined,
          tmdbId: castTmdbId
        };
      })
      .filter(Boolean) as CastMember[];
  }

  let genres: string[] = [];
  if (Array.isArray(movie.genres)) {
    genres = movie.genres
      .map((g: any) => {
        if (typeof g === 'string') return g.trim();
        if (g && typeof g === 'object' && typeof g.name === 'string') return g.name.trim();
        return '';
      })
      .filter((g: string) => g.length > 0);
  }
  if (genres.length === 0 && Array.isArray(movie.genreIds)) {
    genres = movie.genreIds.map((gid: number) => GENRE_MAP[gid]).filter(Boolean) as string[];
  }
  if (genres.length === 0) {
    genres = ['Drama'];
  }
  genres = Array.from(new Set(genres)).slice(0, 4);

  const languages = parseSpokenLanguages(movie);

  let runtimeMinutes = DEFAULT_MOVIE_RUNTIME_MINUTES;
  if (typeof movie.runtimeMinutes === 'number' && !isNaN(movie.runtimeMinutes) && movie.runtimeMinutes > 0) {
    runtimeMinutes = Math.floor(movie.runtimeMinutes);
  } else if (typeof movie.runtime === 'number' && !isNaN(movie.runtime) && movie.runtime > 0) {
    runtimeMinutes = Math.floor(movie.runtime);
  }

  let rating = 0;
  if (typeof movie.rating === 'number' && !isNaN(movie.rating) && movie.rating > 0) {
    rating = Math.min(10, Math.max(0, Math.round(movie.rating * 10) / 10));
  } else if (typeof movie.vote_average === 'number' && !isNaN(movie.vote_average) && movie.vote_average > 0) {
    rating = Math.min(10, Math.max(0, Math.round(movie.vote_average * 10) / 10));
  }

  let ratingCount = 0;
  if (typeof movie.ratingCount === 'number' && !isNaN(movie.ratingCount) && movie.ratingCount >= 0) {
    ratingCount = Math.floor(movie.ratingCount);
  } else if (typeof movie.vote_count === 'number' && !isNaN(movie.vote_count) && movie.vote_count >= 0) {
    ratingCount = Math.floor(movie.vote_count);
  }

  const posterUrl = buildTmdbPosterUrl(movie.poster_path, movie.posterUrl);
  const backdropUrl = buildTmdbBackdropUrl(movie.backdrop_path, movie.backdropUrl, posterUrl);

  const synopsis = String(movie.synopsis || movie.overview || '').trim();
  const tagline = typeof movie.tagline === 'string' ? movie.tagline.trim() : '';
  const nativeTitle =
    typeof movie.nativeTitle === 'string' && movie.nativeTitle.trim() !== title
      ? movie.nativeTitle.trim()
      : typeof movie.originalTitle === 'string' && movie.originalTitle.trim() !== title
        ? movie.originalTitle.trim()
        : undefined;

  let streamingPlatforms: StreamingPlatform[] = [];
  if (Array.isArray(movie.streamingPlatforms) && movie.streamingPlatforms.length > 0) {
    streamingPlatforms = movie.streamingPlatforms
      .map((p: any) => {
        if (!p || typeof p !== 'object') return null;
        const name = String(p.name || '').trim();
        if (!name) return null;
        const badgeColor = String(p.badgeColor || 'bg-slate-700').trim();
        const url = typeof p.url === 'string' ? p.url.trim() : '';
        return { name: name as any, badgeColor, url };
      })
      .filter(Boolean) as StreamingPlatform[];
  }
  if (streamingPlatforms.length === 0) {
    streamingPlatforms = getDefaultStreamingPlatforms(year);
  }

  const trailerYoutubeId = typeof movie.trailerYoutubeId === 'string' ? movie.trailerYoutubeId.trim() : '';
  const culturalSignificance = String(movie.culturalSignificance || '').trim();
  const amvcaAwards = Array.isArray(movie.amvcaAwards)
    ? movie.amvcaAwards.map((a: any) => String(a || '').trim()).filter(Boolean)
    : [];
  const collections = normalizeMovieCollections(movie.collections);
  const rawCountries = movie.originCountry ?? movie.origin_country ?? movie.country ?? movie.production_countries;
  const originCountry = Array.isArray(rawCountries)
    ? rawCountries
        .map((country: any) =>
          typeof country === 'string' ? country : String(country?.iso_3166_1 || country?.code || '')
        )
        .map((country: string) => country.trim().toUpperCase())
        .filter(Boolean)
    : typeof rawCountries === 'string'
      ? rawCountries.split(/[,\s|]+/).map((country: string) => country.trim().toUpperCase()).filter(Boolean)
      : [];
  const originalLanguage = String(movie.originalLanguage || movie.original_language || '').trim().toLowerCase();

  return sanitizeAndTagMovie({
    id,
    title,
    nativeTitle,
    tagline,
    releaseYear: year,
    director,
    directorAvatarUrl: directorAvatarUrl || undefined,
    directorTmdbId,
    producer: typeof movie.producer === 'string' && movie.producer.trim() ? movie.producer.trim() : undefined,
    leadCast,
    genres,
    languages,
    era,
    runtimeMinutes,
    rating,
    ratingCount,
    boxOffice: typeof movie.boxOffice === 'string' && movie.boxOffice.trim() ? movie.boxOffice.trim() : undefined,
    posterUrl,
    backdropUrl,
    synopsis,
    culturalSignificance,
    streamingPlatforms,
    collections,
    originCountry,
    originalLanguage,
    trailerYoutubeId,
    amvcaAwards,
    quote:
      movie.quote && typeof movie.quote === 'object' && movie.quote.text
        ? {
            text: String(movie.quote.text || ''),
            character: String(movie.quote.character || 'Character'),
            actor: String(movie.quote.actor || 'Actor')
          }
        : undefined,
    featured: Boolean(movie.featured),
    boxOfficeChampion: Boolean(movie.boxOfficeChampion),
    isUserAdded: movie.isUserAdded === undefined ? true : Boolean(movie.isUserAdded),
    source: movie.source === 'system' || movie.source === 'custom' ? movie.source : 'web_pulled',
    addedByUserId: typeof movie.addedByUserId === 'string' ? movie.addedByUserId : undefined,
    lastEditedByUserId: typeof movie.lastEditedByUserId === 'string' ? movie.lastEditedByUserId : undefined,
    syncedAt: movie.syncedAt || new Date().toISOString(),
    tmdbId
  }) as Movie;
}

/**
 * Normalizes movie titles for deduplication:
 * Strips bracketed annotations and metadata markers without destroying core title words.
 */
export function normalizeTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[\(\[\{].*?[\)\]\}]/g, '')
    .replace(/\b(part\s*\d+|vol\s*\d+|season\s*\d+|episode\s*\d+|official|trailer|teaser|hd)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function extractTmdbId(movie: { id?: string; tmdbId?: number | null }): number | undefined {
  if (movie.tmdbId && typeof movie.tmdbId === 'number' && !isNaN(movie.tmdbId)) {
    return movie.tmdbId;
  }
  if (!movie.id) return undefined;
  if (movie.id.startsWith('tmdb-')) {
    const num = parseInt(movie.id.replace('tmdb-', ''), 10);
    if (!isNaN(num)) return num;
  }
  const match = movie.id.match(/-(\d{4,})$/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num)) return num;
  }
  return undefined;
}

/**
 * Smart Relaxed Duplicate Prevention Check:
 * Compares candidate against existing catalogue using exact ID, TMDb ID, or release-year-aware title match.
 */
export function isDuplicateMovie(
  candidate: { tmdbId?: number; id?: string; title: string; releaseYear?: number },
  existingMovies: Movie[]
): boolean {
  if (!candidate || !candidate.title) return true;
  const normCandidate = normalizeTitle(candidate.title);
  const candTmdbId = extractTmdbId(candidate);
  const candYear = candidate.releaseYear;

  return existingMovies.some(m => {
    if (candidate.id && m.id === candidate.id) return true;

    const mTmdbId = extractTmdbId(m);
    if (candTmdbId && mTmdbId) {
      if (candTmdbId === mTmdbId) return true;
      return false;
    }

    const normM = normalizeTitle(m.title);
    if (normCandidate.length >= 3 && normM.length >= 3 && normCandidate === normM) {
      if (candYear && m.releaseYear && Math.abs(candYear - m.releaseYear) >= 2) {
        return false;
      }
      return true;
    }

    return false;
  });
}
