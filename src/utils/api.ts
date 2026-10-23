import { Movie, Era, StreamingPlatform, CastMember, PersonProfileData, UserTrackedItem, RecommendationItem } from '../types';
import { saveMultipleFirestoreMovies } from '../lib/firestoreService';
import { normalizeMovieCollections } from './movieCollections';
import { sanitizeAndTagMovie } from './sanitizeAndTagMovie';

export const TMDB_API_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb';
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
const TMDB_RESULT_PAGE_LIMIT = 20;

// In-memory reference for the logged-in user's custom TMDb API key
let userCustomTmdbApiKey: string | null = null;

export function setCustomTmdbKey(key: string | null) {
  userCustomTmdbApiKey = key && key.trim().length > 0 ? key.trim() : null;
}

export function getCustomTmdbKey(): string | null {
  return userCustomTmdbApiKey;
}

export function getActiveTmdbApiKey(): string {
  return userCustomTmdbApiKey || TMDB_API_KEY;
}

export async function testTmdbApiKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { valid: false, message: 'Please enter a valid TMDb API key.' };
  }
  try {
    const url = `${TMDB_BASE_URL}/configuration?api_key=${apiKey.trim()}`;
    const res = await fetch(url);
    if (res.ok) {
      return { valid: true, message: 'TMDb API key is valid and connected!' };
    }
    if (res.status === 401) {
      return { valid: false, message: 'Invalid API key: TMDb returned 401 Unauthorized.' };
    }
    return { valid: false, message: `TMDb responded with status ${res.status}.` };
  } catch (err) {
    return { valid: false, message: 'Network error communicating with TMDb.' };
  }
}


// Curated verified high-resolution TMDb profile headshots for renowned Nollywood directors & actors
export const KNOWN_PERSON_HEADSHOTS: Record<string, string> = {
  'funke akindele': 'https://image.tmdb.org/t/p/w500/cjV3OUS14Mkbg6GILTZBSO2ovtD.jpg',
  'richard mofe-damijo': 'https://image.tmdb.org/t/p/w500/ycEuQzNuKwTNiCniVR2X8YbPUWP.jpg',
  'richard mofe-damijo (rmd)': 'https://image.tmdb.org/t/p/w500/ycEuQzNuKwTNiCniVR2X8YbPUWP.jpg',
  'editi effiong': 'https://image.tmdb.org/t/p/w500/vjFRJEb2chBzwaA2tYeDCujuxmq.jpg',
  'kemi adetiba': 'https://image.tmdb.org/t/p/w500/tiqrAogVqMTu3TC6lqIQhfTKseS.jpg',
  'kunle afolayan': 'https://image.tmdb.org/t/p/w500/1pDeg5kVulTBLqrJuw2LkvfDJ5i.jpg',
  'genevieve nnaji': 'https://image.tmdb.org/t/p/w500/hok4307uT1KoRAkPAyAukZjxCZJ.jpg',
  'ramsey nouah': 'https://image.tmdb.org/t/p/w500/yHA9WfTrv70pQL1aWLegLFz7U6I.jpg',
  'timini egbuson': 'https://image.tmdb.org/t/p/w500/cI1LWYIVu1CYVRkARjawktcFkL6.jpg',
  'bimbo ademoye': 'https://image.tmdb.org/t/p/w500/qRjPXsuTm0jDUOSeBnF1sdJ6g8H.jpg',
  'ade laoye': 'https://image.tmdb.org/t/p/w500/6oNvenBDraDXtsqRC2hJtUXpq9H.jpg',
  'sam dede': 'https://image.tmdb.org/t/p/w500/3wRHFT3elJdv2mCRnE5YFvGDA8s.jpg',
  'shaffy bello': 'https://image.tmdb.org/t/p/w500/lPZnFa19grkg9ijw22d11mZKvE0.jpg',
  'alex usifo': 'https://image.tmdb.org/t/p/w500/hHk1y2cD9IksH405MJHV0obRT7f.jpg',
  'alex usifo omiagbo': 'https://image.tmdb.org/t/p/w500/hHk1y2cD9IksH405MJHV0obRT7f.jpg',
  'kelechi udegbe': 'https://image.tmdb.org/t/p/w500/Atjpbfrs8g9SwtWBk0BHEO7gyzX.jpg',
  'taiwo ajai-lycett': 'https://image.tmdb.org/t/p/w500/wM0B2mfBZvc19BFVEnl9Od4Uxqd.jpg',
  'ireti doyle': 'https://image.tmdb.org/t/p/w500/hzBv9eiamRCOix7ImNQjUgyQOFc.jpg',
  'bimbo akintola': 'https://image.tmdb.org/t/p/w500/kHONQj6avaxannhDhEgJPKNm3m9.jpg',
  'femi branch': 'https://image.tmdb.org/t/p/w500/36StBYl9Ss4dLOCdCbywxZHvZQF.jpg',
  'bimbo manuel': 'https://image.tmdb.org/t/p/w500/fv5ou8VCz2cgm8W1nqAnAA6dsFC.jpg',
  'norbert young': 'https://image.tmdb.org/t/p/w500/7MfOeFrxdggkHXRMV6mnVlxuSPB.jpg',
  'ikechukwu onunaku': 'https://image.tmdb.org/t/p/w500/jQQtzvq2mFfuPtCAA0rF0l59Wcg.jpg',
  'kemi lala akindoju': 'https://image.tmdb.org/t/p/w500/8QOST78lqWueU0DDJpWWvEoj0z4.jpg',
  'sola sobowale': 'https://image.tmdb.org/t/p/w500/3nO3VboeVLVOwIHMkTRIwTrrKQP.jpg',
  'adesua etomi': 'https://image.tmdb.org/t/p/w500/qJpP0QJZE1Lcxswchana8opO9uW.jpg',
  'adesua etomi-wellington': 'https://image.tmdb.org/t/p/w500/qJpP0QJZE1Lcxswchana8opO9uW.jpg',
  'jide kene achufusi': 'https://image.tmdb.org/t/p/w500/jX7Mb37fa7JhB9c3acL1evERNwW.jpg'
};

export interface WebMovieCandidate {
  tmdbId: number;
  title: string;
  originalTitle?: string;
  releaseYear: number;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  rating: number;
  ratingCount: number;
  genreIds?: number[];
  language?: string;
  popularity?: number;
}

// TMDb Genre ID mapping
export const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Epic & Folklore',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime & Thriller',
  99: 'Historical Drama',
  18: 'Drama',
  10751: 'Drama',
  14: 'Epic & Folklore',
  36: 'Historical Drama',
  27: 'Crime & Thriller',
  10402: 'Drama',
  9648: 'Crime & Thriller',
  10749: 'Romantic Comedy',
  878: 'Action',
  10770: 'Drama',
  53: 'Crime & Thriller',
  10752: 'Historical Drama',
  37: 'Action'
};

/**
 * Determine the Nollywood era from the release year
 */
export function determineEra(year: number): 'Golden Era (1992-2005)' | 'New Nollywood (2006-2018)' | 'Modern Global Era (2019-Present)' {
  if (year <= 2005) return 'Golden Era (1992-2005)';
  if (year <= 2018) return 'New Nollywood (2006-2018)';
  return 'Modern Global Era (2019-Present)';
}

// ==========================================
// Tiered LocalStorage Caching Layer
// ==========================================
export const CACHE_PREFIX = 'afromoviedb_cache_';
export const MOVIE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours
export const PERSON_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours
export const SEARCH_TTL_MS = 2 * 60 * 60 * 1000; // 2 Hours
export const LAST_RELEASE_SYNC_KEY = 'afromoviedb_last_release_sync_time';
export const RELEASE_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 Hours (Daily)

export interface CacheEnvelope<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version: number;
}

export function getCachedItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const envelope: CacheEnvelope<T> = JSON.parse(raw);
    const now = Date.now();
    if (now - envelope.timestamp > envelope.ttl) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return envelope.data;
  } catch {
    return null;
  }
}

export function setCachedItem<T>(key: string, data: T, ttlMs: number): void {
  try {
    const envelope: CacheEnvelope<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
      version: 1
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(envelope));
  } catch (err: any) {
    try {
      pruneExpiredCache();
      const envelope: CacheEnvelope<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMs,
        version: 1
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(envelope));
    } catch {
      // Ignore if localStorage unavailable or persistently exceeded
    }
  }
}

export function removeCachedItem(key: string): void {
  try {
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch {}
}

export function pruneExpiredCache(): void {
  try {
    const now = Date.now();
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) {
        try {
          const val = localStorage.getItem(k);
          if (val) {
            const envelope = JSON.parse(val);
            if (envelope.timestamp && envelope.ttl && (now - envelope.timestamp > envelope.ttl)) {
              localStorage.removeItem(k);
            }
          }
        } catch {}
      }
    }
  } catch {}
}

/**
 * Search movies from the internet (TMDb) with 2-hour tiered localStorage caching.
 * CRITICAL REQUIREMENT: Automatically appends 'Nollywood' or 'Nigerian movie' to the query
 * if not already present, preventing name collisions with foreign films (e.g. 'King of Thieves Nollywood').
 */
export async function searchMoviesOnline(
  query: string,
  forceRefresh: boolean = false,
  signal?: AbortSignal
): Promise<WebMovieCandidate[]> {
  throwIfAborted(signal);
  if (!query.trim()) return [];

  const cleanQuery = query.trim();
  const cacheKey = `search_${cleanQuery.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
  if (!forceRefresh) {
    const cached = getCachedItem<WebMovieCandidate[]>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const apiKey = getActiveTmdbApiKey();
  const lowerQuery = cleanQuery.toLowerCase();
  let results: any[] = [];

  try {
    // 1. Direct raw title query first (essential for classic Nollywood titles like Saworoide, Domitilla, Karishika, Issakaba)
    const rawUrl = `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(cleanQuery)}&include_adult=false&language=en-US&page=1`;
    const rawRes = await safeTmdbFetch(rawUrl, 2, signal);
    if (rawRes && rawRes.ok) {
      const rawData = await rawRes.json();
      results = rawData.results || [];
    }

    // 2. If nothing found, search with 'Nollywood' appended to avoid foreign title collisions
    if (results.length === 0 && !lowerQuery.includes('nollywood')) {
      const fallbackUrl = `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(`${cleanQuery} Nollywood`)}&include_adult=false&language=en-US&page=1`;
      const fallbackRes = await safeTmdbFetch(fallbackUrl, 2, signal);
      if (fallbackRes && fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        results = fallbackData.results || [];
      }
    }

    // 3. Fallback with 'Nigerian movie'
    if (results.length === 0 && !lowerQuery.includes('nigerian')) {
      const fallbackUrl2 = `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(`${cleanQuery} Nigerian movie`)}&include_adult=false&language=en-US&page=1`;
      const fallbackRes2 = await safeTmdbFetch(fallbackUrl2, 2, signal);
      if (fallbackRes2 && fallbackRes2.ok) {
        const fallbackData2 = await fallbackRes2.json();
        results = fallbackData2.results || [];
      }
    }

    const formatted = results.map((item: any) => sanitizeCandidate(item, cleanQuery));
    if (formatted.length > 0) {
      setCachedItem(cacheKey, formatted, SEARCH_TTL_MS);
    }
    return formatted;
  } catch (error) {
    if (signal?.aborted) throw error;
    console.warn('Error searching movies online:', error);
    return [];
  }
}

export const FALLBACK_POSTER = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800&auto=format&fit=crop';
export const FALLBACK_BACKDROP = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1600&auto=format&fit=crop';

export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError');
  }
}

/**
 * Safe fetch helper with backoff for TMDb rate limits (HTTP 429) and network blips
 */
export async function safeTmdbFetch(
  url: string,
  retries: number = 2,
  signal?: AbortSignal
): Promise<Response | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    throwIfAborted(signal);
    try {
      const res = await fetch(url, { signal });
      if (res.status === 429) {
        await sleep(350 * (attempt + 1));
        continue;
      }
      return res;
    } catch (error) {
      if (signal?.aborted) throw error;
      if (attempt === retries) return null;
      await sleep(200);
    }
  }
  throwIfAborted(signal);
  return null;
}

/**
 * Rigorously sanitizes candidate movie data discovered from TMDb or search endpoints.
 * Strips out or defaults any undefined or null properties to prevent runtime crashes.
 */
export function sanitizeCandidate(item: any, fallbackTitle: string = 'Nollywood Film'): WebMovieCandidate {
  if (!item || typeof item !== 'object') {
    return {
      tmdbId: Date.now(),
      title: fallbackTitle,
      originalTitle: '',
      releaseYear: new Date().getFullYear(),
      overview: 'A captivating Nollywood cinematic story celebrating Nigerian film culture.',
      posterUrl: FALLBACK_POSTER,
      backdropUrl: FALLBACK_BACKDROP,
      rating: 7.8,
      ratingCount: 120,
      genreIds: [18],
      language: 'en',
      popularity: 10
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

  const posterPath = typeof item.poster_path === 'string' && item.poster_path.trim()
    ? `${TMDB_IMAGE_BASE}/w780${item.poster_path}`
    : typeof item.posterUrl === 'string' && item.posterUrl.trim().startsWith('http')
      ? item.posterUrl.trim()
      : FALLBACK_POSTER;

  const backdropPath = typeof item.backdrop_path === 'string' && item.backdrop_path.trim()
    ? `${TMDB_IMAGE_BASE}/original${item.backdrop_path}`
    : typeof item.backdropUrl === 'string' && item.backdropUrl.trim().startsWith('http')
      ? item.backdropUrl.trim()
      : posterPath;

  const rating = typeof item.vote_average === 'number' && !isNaN(item.vote_average) && item.vote_average > 0
    ? Math.min(10, Math.max(0, Math.round(item.vote_average * 10) / 10))
    : typeof item.rating === 'number' && !isNaN(item.rating) && item.rating > 0
      ? Math.min(10, Math.max(0, Math.round(item.rating * 10) / 10))
      : 7.8;

  const ratingCount = typeof item.vote_count === 'number' && !isNaN(item.vote_count) && item.vote_count >= 0
    ? Math.floor(item.vote_count)
    : typeof item.ratingCount === 'number' && !isNaN(item.ratingCount) && item.ratingCount >= 0
      ? Math.floor(item.ratingCount)
      : 120;

  const genreIds = Array.isArray(item.genre_ids)
    ? item.genre_ids.filter((g: any) => typeof g === 'number' && !isNaN(g))
    : Array.isArray(item.genreIds)
      ? item.genreIds.filter((g: any) => typeof g === 'number' && !isNaN(g))
      : [];

  const overview = typeof item.overview === 'string' && item.overview.trim()
    ? item.overview.trim()
    : 'A captivating Nollywood cinematic story celebrating Nigerian film culture.';

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
    popularity
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
    const fallbackId = `nollywood-classic-${Date.now()}`;
    return sanitizeAndTagMovie({
      id: fallbackId,
      title: 'Untitled Nollywood Film',
      nativeTitle: '',
      tagline: 'A compelling Nigerian cinematic story.',
      releaseYear: new Date().getFullYear(),
      director: 'Unknown Director',
      directorAvatarUrl: '',
      leadCast: [{ actor: 'Nollywood Cast Ensemble', role: 'Main Cast', avatarUrl: '' }],
      genres: ['Drama'],
      languages: ['English', 'Nigerian Pidgin'],
      era: 'Modern Global Era (2019-Present)',
      runtimeMinutes: 105,
      rating: 7.8,
      ratingCount: 120,
      posterUrl: FALLBACK_POSTER,
      backdropUrl: FALLBACK_BACKDROP,
      synopsis: 'A captivating Nollywood cinematic story celebrating Nigerian film culture.',
      culturalSignificance: 'Celebrated Nigerian film reflecting rich cultural narratives.',
      streamingPlatforms: [{ name: 'YouTube', badgeColor: 'bg-red-500', url: 'https://www.youtube.com' }],
      collections: [],
      trailerYoutubeId: '',
      amvcaAwards: ['Nollywood Cinema Selection'],
      featured: false,
      boxOfficeChampion: false,
      isUserAdded: true,
      source: 'web_pulled'
    }) as Movie;
  }

  // 1. Title
  const title = String(movie.title || '').trim() || 'Untitled Nollywood Film';

  // 2. Year & Era
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

  // 3. Unique identifier
  let id = typeof movie.id === 'string' && movie.id.trim() ? movie.id.trim() : '';
  if (!id) {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const numId = typeof movie.tmdbId === 'number' && !isNaN(movie.tmdbId) ? movie.tmdbId : Date.now();
    id = `${slug || 'nollywood'}-${numId}`;
  }

  // 4. TMDb numerical ID
  let tmdbId: number | undefined = undefined;
  if (typeof movie.tmdbId === 'number' && !isNaN(movie.tmdbId) && movie.tmdbId > 0) {
    tmdbId = Math.floor(movie.tmdbId);
  } else if (typeof movie.id === 'number' && !isNaN(movie.id) && movie.id > 0) {
    tmdbId = Math.floor(movie.id);
  }

  // 5. Director info
  const director = String(movie.director || '').trim() || 'Unknown Director';
  const directorAvatarUrl = typeof movie.directorAvatarUrl === 'string' ? movie.directorAvatarUrl.trim() : '';
  let directorTmdbId: number | undefined = undefined;
  if (typeof movie.directorTmdbId === 'number' && !isNaN(movie.directorTmdbId) && movie.directorTmdbId > 0) {
    directorTmdbId = Math.floor(movie.directorTmdbId);
  }

  // 6. Lead Cast
  let leadCast: CastMember[] = [];
  if (Array.isArray(movie.leadCast)) {
    leadCast = movie.leadCast
      .map((c: any) => {
        if (!c || typeof c !== 'object') return null;
        const actor = String(c.actor || c.name || '').trim();
        if (!actor) return null;
        const role = String(c.role || c.character || 'Main Cast').trim() || 'Main Cast';
        const avatarUrl = typeof c.avatarUrl === 'string' ? c.avatarUrl.trim() : (typeof c.profile_path === 'string' ? `${TMDB_IMAGE_BASE}/w185${c.profile_path}` : '');
        const castTmdbId = typeof c.tmdbId === 'number' && !isNaN(c.tmdbId) ? c.tmdbId : (typeof c.id === 'number' && !isNaN(c.id) ? c.id : undefined);
        return {
          actor,
          role,
          avatarUrl: avatarUrl || undefined,
          tmdbId: castTmdbId
        };
      })
      .filter(Boolean) as CastMember[];
  }
  if (leadCast.length === 0) {
    leadCast = [{ actor: 'Nollywood Cast Ensemble', role: 'Main Cast', avatarUrl: '' }];
  }

  // 7. Genres
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

  // 8. Languages
  let languages: string[] = ['English', 'Nigerian Pidgin'];
  if (Array.isArray(movie.languages) && movie.languages.length > 0) {
    const validLangs = movie.languages
      .map((l: any) => String(l || '').trim())
      .filter((l: string) => l.length > 0);
    if (validLangs.length > 0) {
      languages = Array.from(new Set(validLangs));
    }
  }

  // 9. Runtime
  let runtimeMinutes = 105;
  if (typeof movie.runtimeMinutes === 'number' && !isNaN(movie.runtimeMinutes) && movie.runtimeMinutes > 0) {
    runtimeMinutes = Math.floor(movie.runtimeMinutes);
  } else if (typeof movie.runtime === 'number' && !isNaN(movie.runtime) && movie.runtime > 0) {
    runtimeMinutes = Math.floor(movie.runtime);
  }

  // 10. Rating and rating count
  let rating = 7.8;
  if (typeof movie.rating === 'number' && !isNaN(movie.rating) && movie.rating > 0) {
    rating = Math.min(10, Math.max(0, Math.round(movie.rating * 10) / 10));
  } else if (typeof movie.vote_average === 'number' && !isNaN(movie.vote_average) && movie.vote_average > 0) {
    rating = Math.min(10, Math.max(0, Math.round(movie.vote_average * 10) / 10));
  }

  let ratingCount = 120;
  if (typeof movie.ratingCount === 'number' && !isNaN(movie.ratingCount) && movie.ratingCount >= 0) {
    ratingCount = Math.floor(movie.ratingCount);
  } else if (typeof movie.vote_count === 'number' && !isNaN(movie.vote_count) && movie.vote_count >= 0) {
    ratingCount = Math.floor(movie.vote_count);
  }

  // 11. Posters and Backdrops
  const posterUrl = typeof movie.posterUrl === 'string' && movie.posterUrl.trim().startsWith('http')
    ? movie.posterUrl.trim()
    : typeof movie.poster_path === 'string' && movie.poster_path.trim()
      ? `${TMDB_IMAGE_BASE}/w780${movie.poster_path}`
      : FALLBACK_POSTER;

  const backdropUrl = typeof movie.backdropUrl === 'string' && movie.backdropUrl.trim().startsWith('http')
    ? movie.backdropUrl.trim()
    : typeof movie.backdrop_path === 'string' && movie.backdrop_path.trim()
      ? `${TMDB_IMAGE_BASE}/original${movie.backdrop_path}`
      : (posterUrl || FALLBACK_BACKDROP);

  // 12. Synopsis & native title
  const synopsis = String(movie.synopsis || movie.overview || '').trim() ||
    'A captivating Nollywood cinematic story celebrating Nigerian film culture.';
  const tagline = typeof movie.tagline === 'string' ? movie.tagline.trim() : '';
  const nativeTitle = typeof movie.nativeTitle === 'string' && movie.nativeTitle.trim() !== title 
    ? movie.nativeTitle.trim() 
    : typeof movie.originalTitle === 'string' && movie.originalTitle.trim() !== title
      ? movie.originalTitle.trim()
      : undefined;

  // 13. Streaming Platforms
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
    if (year >= 2021) {
      streamingPlatforms = [
        { name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' },
        { name: 'Prime Video', badgeColor: 'bg-blue-600', url: 'https://www.primevideo.com' }
      ];
    } else if (year >= 2010) {
      streamingPlatforms = [
        { name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' },
        { name: 'YouTube', badgeColor: 'bg-red-500', url: 'https://www.youtube.com' }
      ];
    } else {
      streamingPlatforms = [
        { name: 'YouTube', badgeColor: 'bg-red-500', url: 'https://www.youtube.com' },
        { name: 'Africa Magic', badgeColor: 'bg-purple-600', url: 'https://www.dstv.com' }
      ];
    }
  }

  const trailerYoutubeId = typeof movie.trailerYoutubeId === 'string' ? movie.trailerYoutubeId.trim() : '';
  const culturalSignificance = String(movie.culturalSignificance || '').trim() ||
    `Discovered from TMDb Nollywood Archive. Key cultural representation of ${era}.`;
  const amvcaAwards = Array.isArray(movie.amvcaAwards)
    ? movie.amvcaAwards.map((a: any) => String(a || '').trim()).filter(Boolean)
    : ['Nollywood Cinema Selection'];
  const collections = normalizeMovieCollections(movie.collections);
  const rawCountries = movie.originCountry ?? movie.origin_country ?? movie.country ?? movie.production_countries;
  const originCountry = Array.isArray(rawCountries)
    ? rawCountries
        .map((country: any) => typeof country === 'string'
          ? country
          : String(country?.iso_3166_1 || country?.code || ''))
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
    quote: movie.quote && typeof movie.quote === 'object' && movie.quote.text
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
 * Enhanced multi-endpoint discovery connecting to TMDb:
 * Broad Nigerian origin parameters (with_origin_country=NG, with_original_language=yo|ig|ha|pcm,
 * and Nollywood keyword/search tags across 10-20 pages deep per era)
 * with robust date range filtering for release_date and primary_release_date.
 */
export async function discoverNigerianMovies(
  page: number = 1,
  sortBy: 'release_date.desc' | 'popularity.desc' = 'release_date.desc',
  dateRange?: { gte?: string; lte?: string },
  signal?: AbortSignal
): Promise<{ candidates: WebMovieCandidate[]; totalPages: number; totalResults: number }> {
  try {
    throwIfAborted(signal);
    const apiKey = getActiveTmdbApiKey();
    const requestedPage = Math.max(1, Math.min(TMDB_RESULT_PAGE_LIMIT, Math.floor(page) || 1));
    const urls: string[] = [];

    // Endpoint 1: with_origin_country=NG with primary_release_date
    let urlOrigin = `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&with_origin_country=NG&sort_by=${sortBy}&page=${requestedPage}&include_adult=false`;
    if (dateRange?.gte) urlOrigin += `&primary_release_date.gte=${dateRange.gte}`;
    if (dateRange?.lte) urlOrigin += `&primary_release_date.lte=${dateRange.lte}`;
    urls.push(urlOrigin);

    // Endpoint 2: with_origin_country=NG with release_date (catches Nigerian theatrical/home release dates)
    if (dateRange?.gte || dateRange?.lte) {
      let urlRelease = `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&with_origin_country=NG&sort_by=${sortBy}&page=${requestedPage}&include_adult=false`;
      if (dateRange?.gte) urlRelease += `&release_date.gte=${dateRange.gte}`;
      if (dateRange?.lte) urlRelease += `&release_date.lte=${dateRange.lte}`;
      urls.push(urlRelease);
    }

    // Endpoint 3: Indigenous language Nollywood cinema (Yoruba, Igbo, Hausa, Nigerian Pidgin)
    let urlLang = `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&with_original_language=yo|ig|ha|pcm&sort_by=${sortBy}&page=${requestedPage}&include_adult=false`;
    if (dateRange?.gte) urlLang += `&primary_release_date.gte=${dateRange.gte}`;
    if (dateRange?.lte) urlLang += `&primary_release_date.lte=${dateRange.lte}`;
    urls.push(urlLang);

    // Endpoint 4: English-language films explicitly associated with Nigeria.
    let urlNigerianEnglish = `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&with_origin_country=NG&with_original_language=en&sort_by=${sortBy}&page=${requestedPage}&include_adult=false`;
    if (dateRange?.gte) urlNigerianEnglish += `&primary_release_date.gte=${dateRange.gte}`;
    if (dateRange?.lte) urlNigerianEnglish += `&primary_release_date.lte=${dateRange.lte}`;
    urls.push(urlNigerianEnglish);

    // Endpoint 5: TMDb Nollywood keyword tags (207317: Nollywood, 263548: Nigerian Cinema)
    let urlKeyword = `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&with_keywords=207317|263548&sort_by=${sortBy}&page=${requestedPage}&include_adult=false`;
    if (dateRange?.gte) urlKeyword += `&primary_release_date.gte=${dateRange.gte}`;
    if (dateRange?.lte) urlKeyword += `&primary_release_date.lte=${dateRange.lte}`;
    urls.push(urlKeyword);

    // Search fallbacks also run during era sweeps; results are filtered to the requested dates below.
    if (requestedPage <= 5) {
      urls.push(`${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=Nollywood&page=${requestedPage}&include_adult=false`);
      urls.push(`${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=Nigerian%20movie&page=${requestedPage}&include_adult=false`);
    }

    const responses = await Promise.allSettled(urls.map(u => safeTmdbFetch(u, 2, signal)));
    throwIfAborted(signal);
    const allRawItems: any[] = [];
    let maxTotalPages = 1;

    for (const res of responses) {
      if (res.status === 'fulfilled' && res.value && res.value.ok) {
        try {
          const data = await res.value.json();
          if (typeof data.total_pages === 'number' && data.total_pages > 0) {
            maxTotalPages = Math.max(
              maxTotalPages,
              Math.min(TMDB_RESULT_PAGE_LIMIT, Math.floor(data.total_pages))
            );
          }
          if (Array.isArray(data.results)) {
            allRawItems.push(...data.results);
          }
        } catch {}
      }
    }

    // Deduplicate raw items by TMDb integer ID and apply date range filtering if specified
    const uniqueMap = new Map<number, any>();
    for (const item of allRawItems) {
      if (!item || !item.id) continue;
      if (dateRange?.gte || dateRange?.lte) {
        const itemDate = item.release_date || item.primary_release_date || '';
        if (!itemDate) continue;
        if (dateRange.gte && itemDate < dateRange.gte) continue;
        if (dateRange.lte && itemDate > dateRange.lte) continue;
      }
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    }

    const candidates = Array.from(uniqueMap.values()).map((item: any) => 
      sanitizeCandidate(item, item.title || 'Nollywood Film')
    );

    return {
      candidates,
      totalPages: maxTotalPages,
      totalResults: candidates.length
    };
  } catch (error) {
    if (signal?.aborted) throw error;
    console.error('Error discovering Nigerian movies from TMDb:', error);
    return { candidates: [], totalPages: 0, totalResults: 0 };
  }
}

/**
 * Fetch movie credits (cast & crew) directly from TMDb with 24-hour caching
 */
export async function fetchMovieCredits(
  tmdbId: number,
  forceRefresh: boolean = false,
  signal?: AbortSignal
): Promise<{ cast: any[]; crew: any[] } | null> {
  throwIfAborted(signal);
  const cacheKey = `credits_${tmdbId}`;
  if (!forceRefresh) {
    const cached = getCachedItem<{ cast: any[]; crew: any[] }>(cacheKey);
    if (cached) return cached;
  }

  try {
    const url = `${TMDB_BASE_URL}/movie/${tmdbId}/credits?api_key=${getActiveTmdbApiKey()}`;
    const res = await safeTmdbFetch(url, 2, signal);
    if (!res || !res.ok) return null;
    const data = await res.json();
    if (data) {
      setCachedItem(cacheKey, data, MOVIE_TTL_MS);
    }
    return data;
  } catch (err) {
    if (signal?.aborted) throw err;
    console.warn(`Failed to fetch credits for TMDb ID ${tmdbId}:`, err);
    return null;
  }
}

/**
 * Pull full movie details including credits and trailers from TMDb with 24-hour caching.
 * Ensures the returned movie object is 100% rigorously sanitized.
 */
export async function pullMovieDetailsFromOnline(
  candidate: WebMovieCandidate,
  forceRefresh: boolean = false,
  signal?: AbortSignal
): Promise<Movie> {
  throwIfAborted(signal);
  const cleanCand = sanitizeCandidate(candidate);
  const cacheKey = `movie_${cleanCand.tmdbId || cleanCand.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
  if (!forceRefresh) {
    const cached = getCachedItem<Movie>(cacheKey);
    if (cached) {
      return sanitizeMovie(cached);
    }
  }

  let director = '';
  let directorAvatarUrl = '';
  let directorTmdbId: number | undefined = undefined;
  let leadCast: CastMember[] = [];
  let runtime = 110;
  let trailerYoutubeId = 'v8wIe7_xK3U'; // Default trailer fallback
  let genres: string[] = [];
  let tagline = 'A compelling Nigerian cinematic story.';

  try {
    const detailsUrl = `${TMDB_BASE_URL}/movie/${cleanCand.tmdbId}?api_key=${getActiveTmdbApiKey()}&append_to_response=credits,videos`;
    const res = await safeTmdbFetch(detailsUrl, 2, signal);
    if (res && res.ok) {
      const d = await res.json();
      
      if (d.runtime) {
        runtime = Number(d.runtime) || 110;
      }
      if (d.tagline && d.tagline.trim()) {
        tagline = d.tagline.trim();
      }

      // Map genres
      if (Array.isArray(d.genres) && d.genres.length > 0) {
        const rawGenres = d.genres.map((g: any) => {
          if (!g?.name) return null;
          if (g.name === 'Romance') return 'Romantic Comedy';
          if (g.name === 'Thriller') return 'Crime & Thriller';
          if (g.name === 'History') return 'Historical Drama';
          if (['Action', 'Comedy', 'Drama'].includes(g.name)) return g.name;
          return g.name;
        }).filter(Boolean);
        genres = Array.from(new Set(rawGenres));
      }

      // Credits: inspect appended credits or query movie credits endpoint
      let credits = d.credits;
      if (!credits || (!credits.crew?.length && !credits.cast?.length)) {
        const fallbackCredits = await fetchMovieCredits(cleanCand.tmdbId, false, signal);
        if (fallbackCredits) {
          credits = fallbackCredits;
        }
      }

      // Crew -> Extract actual director's name where job === 'Director'
      const crew: any[] = credits?.crew || [];
      const directors = crew.filter((c: any) => c.job === 'Director');
      if (directors.length > 0) {
        director = directors.map((d: any) => d.name).join(' & ');
        if (directors[0].profile_path) {
          directorAvatarUrl = `${TMDB_IMAGE_BASE}/w342${directors[0].profile_path}`;
        }
        directorTmdbId = directors[0].id ? Number(directors[0].id) : undefined;
      } else {
        // Look in Directing department if job === 'Director' not found
        const directingMember = crew.find((c: any) => c.department === 'Directing');
        if (directingMember) {
          director = directingMember.name;
          if (directingMember.profile_path) {
            directorAvatarUrl = `${TMDB_IMAGE_BASE}/w342${directingMember.profile_path}`;
          }
          directorTmdbId = directingMember.id ? Number(directingMember.id) : undefined;
        } else {
          // Check for writer or producer
          const writerOrProducer = crew.find((c: any) => c.job === 'Writer' || c.job === 'Screenplay' || c.job === 'Producer');
          if (writerOrProducer) {
            director = writerOrProducer.name;
            if (writerOrProducer.profile_path) {
              directorAvatarUrl = `${TMDB_IMAGE_BASE}/w342${writerOrProducer.profile_path}`;
            }
            directorTmdbId = writerOrProducer.id ? Number(writerOrProducer.id) : undefined;
          }
        }
      }

      // Cast -> Map top cast members' real names, roles, and headshots from TMDb
      const castList: any[] = credits?.cast || [];
      if (castList.length > 0) {
        leadCast = castList.slice(0, 8).map((c: any) => ({
          actor: c.name || 'Cast Member',
          role: c.character?.trim() || 'Cast Member',
          avatarUrl: c.profile_path ? `${TMDB_IMAGE_BASE}/w185${c.profile_path}` : '',
          tmdbId: c.id ? Number(c.id) : undefined
        }));
      }

      // YouTube Trailer
      const videos = d.videos?.results || [];
      const ytTrailer = videos.find((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
      if (ytTrailer && ytTrailer.key) {
        trailerYoutubeId = ytTrailer.key;
      }
    }
  } catch (err) {
    if (signal?.aborted) throw err;
    console.warn('Failed to fetch detailed TMDb attributes:', err);
  }

  throwIfAborted(signal);
  // Fallback genres if empty
  if (genres.length === 0) {
    if (cleanCand.genreIds && cleanCand.genreIds.length > 0) {
      genres = cleanCand.genreIds
        .map(id => GENRE_MAP[id])
        .filter(Boolean) as string[];
    }
    if (genres.length === 0) {
      genres = ['Drama'];
    }
  }

  genres = Array.from(new Set(genres)).slice(0, 3);
  const era = determineEra(cleanCand.releaseYear);

  // Streaming platforms based on year / modern release
  const platforms: StreamingPlatform[] = [];
  if (cleanCand.releaseYear >= 2021) {
    platforms.push({ name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' });
    platforms.push({ name: 'Prime Video', badgeColor: 'bg-blue-600', url: 'https://www.primevideo.com' });
  } else if (cleanCand.releaseYear >= 2010) {
    platforms.push({ name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' });
    platforms.push({ name: 'YouTube', badgeColor: 'bg-red-500', url: 'https://www.youtube.com' });
  } else {
    platforms.push({ name: 'YouTube', badgeColor: 'bg-red-500', url: 'https://www.youtube.com' });
    platforms.push({ name: 'Africa Magic', badgeColor: 'bg-purple-600', url: 'https://www.dstv.com' });
  }

  const cleanId = cleanCand.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') + '-' + (cleanCand.tmdbId || Date.now().toString().slice(-4));

  const rawFullMovie = {
    id: cleanId,
    title: cleanCand.title || 'Untitled Nollywood Film',
    nativeTitle: (cleanCand.originalTitle && cleanCand.originalTitle !== cleanCand.title) ? cleanCand.originalTitle : '',
    tagline: tagline || '',
    releaseYear: cleanCand.releaseYear || new Date().getFullYear(),
    director: director || 'Nigerian Filmmaker Team',
    directorAvatarUrl: directorAvatarUrl || '',
    directorTmdbId: directorTmdbId,
    leadCast: leadCast.length > 0 ? leadCast : [
      { actor: 'Nollywood Cast Ensemble', role: 'Main Cast', avatarUrl: '' }
    ],
    genres: genres.length > 0 ? genres : ['Drama'],
    languages: ['English', 'Nigerian Pidgin', 'Yoruba'],
    era: era || determineEra(cleanCand.releaseYear),
    runtimeMinutes: Number(runtime) || 105,
    rating: typeof cleanCand.rating === 'number' && cleanCand.rating > 0 ? cleanCand.rating : 8.0,
    ratingCount: Number(cleanCand.ratingCount) || 120,
    posterUrl: cleanCand.posterUrl || FALLBACK_POSTER,
    backdropUrl: cleanCand.backdropUrl || cleanCand.posterUrl || FALLBACK_BACKDROP,
    synopsis: cleanCand.overview || 'A gripping Nollywood production highlighting rich cultural storytelling.',
    culturalSignificance: `Discovered from TMDb Nollywood Archive. Represents ${era || determineEra(cleanCand.releaseYear)}.`,
    streamingPlatforms: platforms,
    collections: normalizeMovieCollections([]),
    trailerYoutubeId: trailerYoutubeId || '',
    amvcaAwards: ['Nollywood Cinema Selection'],
    featured: false,
    boxOfficeChampion: false,
    isUserAdded: true,
    source: 'web_pulled',
    tmdbId: cleanCand.tmdbId ? Number(cleanCand.tmdbId) : undefined
  };

  const sanitized = sanitizeMovie(rawFullMovie);
  setCachedItem(cacheKey, sanitized, MOVIE_TTL_MS);
  return sanitized;
}

// In-memory cache for fast repeated person profile views
const personProfileCache = new Map<string, PersonProfileData>();

export function normalizePersonName(name: string): string {
  return name
    .replace(/\(.*?\)/g, '')
    .replace(/&.*$/, '')
    .replace(/\b(dir|director|starring|featuring)\b/gi, '')
    .trim();
}

/**
 * Fetches official profile data, biography, and TMDb headshot image for actors & directors
 * with 24-hour tiered localStorage caching and on-demand forceRefresh support.
 */
export async function fetchPersonProfile(
  personName: string, 
  tmdbId?: number, 
  forceRefresh: boolean = false
): Promise<PersonProfileData> {
  const trimmedName = personName.trim();
  const cacheKey = tmdbId ? `person_id_${tmdbId}` : `person_name_${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

  if (!forceRefresh) {
    if (personProfileCache.has(cacheKey)) {
      return personProfileCache.get(cacheKey)!;
    }
    const localCached = getCachedItem<PersonProfileData>(cacheKey);
    if (localCached) {
      personProfileCache.set(cacheKey, localCached);
      return localCached;
    }
  }

  const normalized = normalizePersonName(trimmedName);
  let resolvedId = tmdbId;
  let initialResult: any = null;

  try {
    if (!resolvedId) {
      const searchUrl = `${TMDB_BASE_URL}/search/person?api_key=${getActiveTmdbApiKey()}&query=${encodeURIComponent(normalized)}`;
      const sRes = await fetch(searchUrl);
      if (sRes.ok) {
        const sData = await sRes.json();
        const results: any[] = sData.results || [];
        if (results.length > 0) {
          // Prioritize match with profile_path, else highest popularity
          const matchWithPhoto = results.find(r => !!r.profile_path);
          initialResult = matchWithPhoto || results[0];
          resolvedId = initialResult.id;
        }
      }
    }

    if (resolvedId) {
      const detailUrl = `${TMDB_BASE_URL}/person/${resolvedId}?api_key=${getActiveTmdbApiKey()}&append_to_response=combined_credits`;
      const pRes = await fetch(detailUrl);
      if (pRes.ok) {
        const pData = await pRes.json();
        const rawCredits = pData.combined_credits?.cast || [];
        const rawCrew = pData.combined_credits?.crew || [];
        const allKnown = [...rawCredits, ...rawCrew].slice(0, 12).map((k: any) => ({
          id: k.id,
          title: k.title || k.name,
          name: k.name || k.title,
          posterPath: k.poster_path ? `${TMDB_IMAGE_BASE}/w342${k.poster_path}` : undefined,
          releaseDate: k.release_date || k.first_air_date,
          character: k.character || k.job,
          mediaType: k.media_type || 'movie'
        }));

        // Determine official headshot image
        let avatarUrl: string | undefined = undefined;
        if (pData.profile_path) {
          avatarUrl = `${TMDB_IMAGE_BASE}/h632${pData.profile_path}`;
        } else if (KNOWN_PERSON_HEADSHOTS[trimmedName.toLowerCase()]) {
          avatarUrl = KNOWN_PERSON_HEADSHOTS[trimmedName.toLowerCase()];
        } else if (KNOWN_PERSON_HEADSHOTS[normalized.toLowerCase()]) {
          avatarUrl = KNOWN_PERSON_HEADSHOTS[normalized.toLowerCase()];
        }

        const profile: PersonProfileData = {
          id: resolvedId,
          name: pData.name || trimmedName,
          biography: pData.biography?.trim() ? pData.biography.trim() : undefined,
          birthday: pData.birthday || undefined,
          deathday: pData.deathday || null,
          placeOfBirth: pData.place_of_birth || undefined,
          department: pData.known_for_department || (rawCrew.some((c: any) => c.department === 'Directing') ? 'Directing' : 'Acting'),
          avatarUrl: avatarUrl,
          imdbId: pData.imdb_id || undefined,
          knownFor: allKnown
        };

        personProfileCache.set(cacheKey, profile);
        setCachedItem(cacheKey, profile, PERSON_TTL_MS);
        return profile;
      }
    }
  } catch (err) {
    console.warn(`Failed to fetch person profile for ${trimmedName}:`, err);
  }

  // Fallback if network issue or person not in TMDb
  const fallbackAvatar = 
    KNOWN_PERSON_HEADSHOTS[trimmedName.toLowerCase()] || 
    KNOWN_PERSON_HEADSHOTS[normalized.toLowerCase()] ||
    (initialResult?.profile_path ? `${TMDB_IMAGE_BASE}/h632${initialResult.profile_path}` : undefined);

  const fallbackProfile: PersonProfileData = {
    id: resolvedId,
    name: trimmedName,
    avatarUrl: fallbackAvatar,
    department: 'Acting & Directing'
  };
  personProfileCache.set(cacheKey, fallbackProfile);
  setCachedItem(cacheKey, fallbackProfile, PERSON_TTL_MS);
  return fallbackProfile;
}

/**
 * Quick helper to resolve an actor or director's official profile headshot URL from TMDb
 */
export async function fetchPersonHeadshot(personName: string, tmdbId?: number, forceRefresh: boolean = false): Promise<string | null> {
  const clean = personName.toLowerCase().trim();
  if (KNOWN_PERSON_HEADSHOTS[clean]) {
    return KNOWN_PERSON_HEADSHOTS[clean];
  }
  const normalized = normalizePersonName(personName).toLowerCase();
  if (KNOWN_PERSON_HEADSHOTS[normalized]) {
    return KNOWN_PERSON_HEADSHOTS[normalized];
  }
  try {
    const profile = await fetchPersonProfile(personName, tmdbId, forceRefresh);
    return profile.avatarUrl || null;
  } catch {
    return null;
  }
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
 * Compares candidate against existing catalogue using:
 * 1. Exact unique ID match
 * 2. TMDb numerical ID match
 * 3. Relaxed normalized title match (preserves legitimate remakes/classics if release years differ)
 */
export function isDuplicateMovie(
  candidate: { tmdbId?: number; id?: string; title: string; releaseYear?: number },
  existingMovies: Movie[]
): boolean {
  if (!candidate || !candidate.title) return true;
  const normCandidate = normalizeTitle(candidate.title);
  const candTmdbId = extractTmdbId(candidate);
  const candYear = candidate.releaseYear;

  return existingMovies.some((m) => {
    // 1. Direct ID match
    if (candidate.id && m.id === candidate.id) return true;

    // 2. TMDb integer ID match
    const mTmdbId = extractTmdbId(m);
    if (candTmdbId && mTmdbId) {
      if (candTmdbId === mTmdbId) return true;
      // If TMDb IDs exist and differ, they are verified distinct records on TMDb
      return false;
    }

    // 3. Relaxed normalized title match:
    const normM = normalizeTitle(m.title);
    if (normCandidate.length >= 3 && normM.length >= 3 && normCandidate === normM) {
      // If release years differ by 2+ years, they are distinct films (e.g. 1994 classic vs 2022 remake)
      if (candYear && m.releaseYear && Math.abs(candYear - m.releaseYear) >= 2) {
        return false;
      }
      return true;
    }

    return false;
  });
}

/**
 * Bulk fetch and convert multiple pages of Nigerian films from TMDb with relaxed, ID-aware deduplication.
 * Queries up to 15-20 pages deep across new releases.
 */
export async function bulkSyncNigerianNewReleases(
  maxMovies: number = 32,
  onProgress?: (syncedCount: number, total: number) => void,
  existingMovies: Movie[] = [],
  maxPages: number = 15
): Promise<Movie[]> {
  const syncedMovies: Movie[] = [];
  let page = 1;
  const effectiveMaxPages = Math.max(1, Math.min(TMDB_RESULT_PAGE_LIMIT, Math.floor(maxPages) || 1));
  const currentPool = [...existingMovies];

  while (syncedMovies.length < maxMovies && page <= effectiveMaxPages) {
    const { candidates, totalPages } = await discoverNigerianMovies(page, 'release_date.desc');
    if (candidates.length === 0) break;

    for (const rawCandidate of candidates) {
      if (syncedMovies.length >= maxMovies) break;

      const candidate = sanitizeCandidate(rawCandidate);
      // Skip invalid items
      if (!candidate.title || !candidate.posterUrl) continue;

      // Skip existing films while allowing distinct remakes and alternate TMDb records.
      if (isDuplicateMovie(candidate, currentPool)) {
        continue;
      }

      try {
        const rawMovie = await pullMovieDetailsFromOnline(candidate);
        const movie = sanitizeAndTagMovie(sanitizeMovie(rawMovie)) as Movie;
        syncedMovies.push(movie);
        currentPool.push(movie);

        if (onProgress) {
          onProgress(syncedMovies.length, maxMovies);
        }
      } catch (err) {
        console.warn(`Failed pulling details for ${candidate.title}:`, err);
      }
    }

    if (page >= totalPages) break;
    page++;
    await sleep(60);
  }

  const finalSynced = syncedMovies.map(movie => sanitizeAndTagMovie(sanitizeMovie(movie)) as Movie);
  if (finalSynced.length > 0) {
    try {
      await saveMultipleFirestoreMovies(finalSynced);
    } catch (err) {
      console.warn('Real-time batch write of fresh releases to Firestore custom_movies encountered an issue:', err);
    }
  }

  return finalSynced;
}

export const POPULAR_NIGERIAN_WEB_SUGGESTIONS = [
  'Gangs of Lagos',
  'Shanty Town',
  'King of Thieves',
  'Sugar Rush',
  'Lisabi: The Uprising',
  'House of Ga\'a',
  'Merry Men',
  'Omo Ghetto: The Saga',
  'Far From Home',
  'Ijakumo',
  'A Sunday Affair',
  'Namaste Wahala',
  'A Tribe Called Judah',
  'Anikulapo',
  'The Black Book',
  'Jagun Jagun'
];

/**
 * Progress update payload for deep historical sweep
 * Notice: Internal page numbers (e.g. Page 2/15) are explicitly excluded per user specification
 */
export interface HistoricalSweepProgress {
  decadeLabel: string;
  page: number;
  totalPages: number;
  importedCount: number;
  percent: number;
  isComplete: boolean;
  isCancelled: boolean;
  isSaving: boolean;
  firestoreSaveStarted: boolean;
  statusText: string;
}

/**
 * Curated iconic Nollywood milestone queries spanning multi-decade historical eras:
 * 1990s, 2000s, 2010s, 2020s (and 1980s legacy roots).
 */
const CLASSIC_QUERIES_BY_ERA: Record<string, string[]> = {
  '1980s Era': ['Aiye', 'Jaiyesimi', 'Kada River', 'Papa Ajasco', 'Mosebolatan', 'Kannakanna'],
  '1990s Era': [
    'Living in Bondage', 'Glamour Girls', 'Saworoide', 'Nneka The Pretty Serpent', 
    'Domitilla', 'Hostages', 'Thunderbolt', 'Ti Oluwa Ni Ile', 'Mortal Inheritance', 
    'Diamond Ring', 'Karishika', 'Scores to Settle', 'Igodo', 'Blood Money', 'Sakobi',
    'Owo Blow', 'Rattle Snake', 'Silent Night', 'Most Wanted', 'Taboo', 'Died Wretched'
  ],
  '2000s Era': [
    'Osuofia in London', 'Aki na Ukwa', 'Issakaba', 'The Figurine', 'Irapada', 
    'Dangerous Twins', 'Jenifa', 'Games Men Play', 'Keeping Faith', 'Blood Sister',
    'Out of Bounds', 'Last Burial', 'State of Emergency', 'Oracle', 'Sharon Stone',
    'Egg of Life', 'Festival of Fire', 'Beyonce: The President\'s Daughter', 'Emotional Crack'
  ],
  '2010s Era': [
    'The Wedding Party', 'Fifty', 'October 1', 'Taxi Driver', 
    'Chief Daddy', 'King of Boys', 'Lionheart', 'Merry Men', 'The Bling Lagosians', 
    'Isoken', 'Up North', 'Sugar Rush', 'The Mirror Boy', 'Phone Swap', 'Anchor Baby',
    'Maami', 'Half of a Yellow Sun', 'Dry', 'Oloture'
  ],
  '2020s Era': [
    'Anikulapo', 'The Black Book', 'Jagun Jagun', 'King of Thieves', 'Gangs of Lagos',
    'Shanty Town', 'Lisabi: The Uprising', 'House of Ga\'a', 'Omo Ghetto: The Saga',
    'A Tribe Called Judah', 'Breath of Life', 'Mami Wata', 'Ijakumo', 'Battle on Buka Street',
    'Blood Sisters', 'Far From Home', 'Afamefuna'
  ]
};

/**
 * Deep Multi-Decade Historical Bulk Importer:
 * Queries up to 20 pages deep across historical eras:
 * 1990s Era, 2000s Era, 2010s Era, 2020s Era (and 1980s roots)
 * using broad Nigerian origin parameters (with_origin_country=NG, language tags, keyword fallbacks).
 * Directly commits all imported movies via real-time batch writes to Firebase Firestore (custom_movies collection).
 */
export async function runDeepHistoricalSweep(
  existingMovies: Movie[],
  onProgress?: (progress: HistoricalSweepProgress) => void,
  pagesPerEra: number = 20,
  signal?: AbortSignal
): Promise<{ newMovies: Movie[]; summary: string; cancelled: boolean }> {
  // Scan up to 20 result pages for each decade, respecting the available page count.
  const requestedPages = Number.isFinite(pagesPerEra) ? Math.floor(pagesPerEra) : 20;
  const effectivePagesPerEra = Math.max(1, Math.min(TMDB_RESULT_PAGE_LIMIT, requestedPages));

  const erasToScan = [
    { label: '1990s Era', gte: '1990-01-01', lte: '1999-12-31' },
    { label: '2000s Era', gte: '2000-01-01', lte: '2009-12-31' },
    { label: '2010s Era', gte: '2010-01-01', lte: '2019-12-31' },
    { label: '2020s Era', gte: '2020-01-01', lte: '2029-12-31' },
    { label: '1980s Era', gte: '1980-01-01', lte: '1989-12-31' }
  ];

  const totalSteps = erasToScan.length * effectivePagesPerEra;
  let currentStep = 0;
  let currentDecade = erasToScan[0].label;
  let currentPage = 1;
  let currentTotalPages = effectivePagesPerEra;
  let currentPercent = 0;
  const pool = [...existingMovies];
  const newImported: Movie[] = [];

  const publishProgress = () => {
    onProgress?.({
      decadeLabel: currentDecade,
      page: currentPage,
      totalPages: currentTotalPages,
      importedCount: newImported.length,
      percent: currentPercent,
      isComplete: false,
      isCancelled: false,
      isSaving: false,
      firestoreSaveStarted: false,
      statusText: `Scanning ${currentDecade} • Page ${currentPage}/${currentTotalPages} • ${newImported.length} Classic Films Added`
    });
  };

  try {
    for (const era of erasToScan) {
      throwIfAborted(signal);
      currentDecade = era.label;

      // Query multiple pages per era using broad Nigerian origin parameters.
      for (let page = 1; page <= effectivePagesPerEra; page++) {
        throwIfAborted(signal);
        currentPage = page;
        currentTotalPages = effectivePagesPerEra;
        currentStep++;
        currentPercent = Math.min(95, Math.round((currentStep / totalSteps) * 100));
        publishProgress();

        try {
          const { candidates, totalPages } = await discoverNigerianMovies(
            page,
            'popularity.desc',
            { gte: era.gte, lte: era.lte },
            signal
          );
          throwIfAborted(signal);
          currentTotalPages = Math.max(1, Math.min(effectivePagesPerEra, totalPages || 1));
          publishProgress();

          for (const rawCandidate of candidates) {
            throwIfAborted(signal);
            const candidate = sanitizeCandidate(rawCandidate);
            if (!candidate.title || isDuplicateMovie(candidate, pool)) continue;

            try {
              const rawMovie = await pullMovieDetailsFromOnline(candidate, false, signal);
              throwIfAborted(signal);
              const fullMovie = sanitizeAndTagMovie(sanitizeMovie(rawMovie)) as Movie;
              newImported.push(fullMovie);
              pool.push(fullMovie);
              publishProgress();
            } catch (error) {
              if (signal?.aborted) throw error;
              console.warn(`Could not pull full details for ${candidate.title}`, error);
            }
          }

          // Break if TMDb catalogue doesn't have any more pages for this date range.
          if (page >= currentTotalPages) break;

          await sleep(75);
          throwIfAborted(signal);
        } catch (error) {
          if (signal?.aborted) throw error;
          console.warn(`Error during historical sweep of ${era.label} page ${page}:`, error);
        }
      }

      // Targeted searches capture iconic classic Nollywood milestones not found by discovery.
      for (const titleQuery of CLASSIC_QUERIES_BY_ERA[era.label] || []) {
        throwIfAborted(signal);
        try {
          const searchCandidates = await searchMoviesOnline(titleQuery, false, signal);
          throwIfAborted(signal);
          for (const rawCand of searchCandidates.slice(0, 3)) {
            throwIfAborted(signal);
            const cand = sanitizeCandidate(rawCand);
            if (!cand.title || isDuplicateMovie(cand, pool)) continue;

            const rawMovie = await pullMovieDetailsFromOnline(cand, false, signal);
            throwIfAborted(signal);
            const fullMovie = sanitizeAndTagMovie(sanitizeMovie(rawMovie)) as Movie;
            newImported.push(fullMovie);
            pool.push(fullMovie);
            publishProgress();
          }
        } catch (error) {
          if (signal?.aborted) throw error;
          console.warn(`Error searching classic query ${titleQuery}:`, error);
        }
      }
    }
  } catch (error) {
    if (!signal?.aborted) throw error;
  }

  const finalSanitized = newImported.map(movie => sanitizeAndTagMovie(sanitizeMovie(movie)) as Movie);
  if (signal?.aborted) {
    const summary = `Historical sweep stopped. ${finalSanitized.length} classic films were found; no Firestore save was started.`;
    onProgress?.({
      decadeLabel: currentDecade,
      page: currentPage,
      totalPages: currentTotalPages,
      importedCount: finalSanitized.length,
      percent: currentPercent,
      isComplete: false,
      isCancelled: true,
      isSaving: false,
      firestoreSaveStarted: false,
      statusText: summary
    });
    return { newMovies: finalSanitized, summary, cancelled: true };
  }

  const summary = `Historical sweep completed! ${finalSanitized.length} classic films found across multiple eras.`;
  onProgress?.({
    decadeLabel: 'Complete',
    page: currentPage,
    totalPages: currentTotalPages,
    importedCount: finalSanitized.length,
    percent: 100,
    isComplete: true,
    isCancelled: false,
    isSaving: false,
    firestoreSaveStarted: false,
    statusText: summary
  });

  return { newMovies: finalSanitized, summary, cancelled: false };
}

/**
 * Automatically checks if 24 hours have passed since last release sync from TMDb.
 * If so, syncs new Nigerian releases in the background, writes directly to Firestore custom_movies in real time, and returns fresh titles.
 */
export async function checkAndRunDailySync(
  existingMovies: Movie[] = [],
  onProgress?: (syncedCount: number, total: number) => void
): Promise<{ syncedMovies: Movie[]; isSyncPerformed: boolean }> {
  try {
    const lastSyncRaw = localStorage.getItem(LAST_RELEASE_SYNC_KEY);
    const now = Date.now();

    if (lastSyncRaw) {
      const lastSyncTime = parseInt(lastSyncRaw, 10);
      if (!isNaN(lastSyncTime) && (now - lastSyncTime < RELEASE_SYNC_INTERVAL_MS)) {
        // Already synced within the last 24 hours
        return { syncedMovies: [], isSyncPerformed: false };
      }
    }

    // Perform background sync (fetching up to 24 fresh Nigerian releases with strict deduplication)
    const freshMovies = await bulkSyncNigerianNewReleases(24, onProgress, existingMovies, 15);
    const sanitizedFresh = freshMovies.map(movie => sanitizeAndTagMovie(sanitizeMovie(movie)) as Movie);

    // Direct real-time batch write to Firestore custom_movies collection
    if (sanitizedFresh.length > 0) {
      try {
        await saveMultipleFirestoreMovies(sanitizedFresh);
      } catch (err) {
        console.warn('Firestore batch write during daily sync encountered an issue:', err);
      }
    }

    // Save updated timestamp
    localStorage.setItem(LAST_RELEASE_SYNC_KEY, now.toString());

    return { syncedMovies: sanitizedFresh, isSyncPerformed: true };
  } catch (err) {
    console.warn('Automated daily sync encountered an issue:', err);
    return { syncedMovies: [], isSyncPerformed: false };
  }
}

/**
 * Personalized 'Recommended For You' Algorithm:
 * Analyzes shared genres, directors, and lead cast members from the user's tracking lists
 * (with weighted emphasis on Completed and Currently Watching films) and scores
 * untracked movies from the catalogue.
 */
export function getPersonalizedRecommendations(
  trackedItems: UserTrackedItem[],
  allMovies: Movie[]
): RecommendationItem[] {
  const trackedMovieIds = new Set(trackedItems.map(t => t.movieId));

  // Build a lookup map of tracked movies
  const trackedMoviesMap = new Map<string, { movie: Movie; item: UserTrackedItem }>();
  for (const item of trackedItems) {
    const m = allMovies.find(movie => movie.id === item.movieId);
    if (m) {
      trackedMoviesMap.set(item.movieId, { movie: m, item });
    }
  }

  // Frequency and weight dictionaries
  const genreWeights: Record<string, number> = {};
  const directorWeights: Record<string, number> = {};
  const actorWeights: Record<string, number> = {};

  trackedMoviesMap.forEach(({ movie, item }) => {
    // Multiplier based on status
    const multiplier = item.status === 'completed' 
      ? 3 + Math.min(item.rewatchCount || 0, 3) 
      : item.status === 'watching' 
        ? 2.5 
        : item.status === 'plan_to_watch' 
          ? 1.5 
          : 0.5;

    // Genres
    if (Array.isArray(movie.genres)) {
      movie.genres.forEach(g => {
        genreWeights[g] = (genreWeights[g] || 0) + (1 * multiplier);
      });
    }

    // Director
    if (movie.director && movie.director !== 'Unknown Director') {
      directorWeights[movie.director] = (directorWeights[movie.director] || 0) + (2 * multiplier);
    }

    // Lead Actors
    if (Array.isArray(movie.leadCast)) {
      movie.leadCast.slice(0, 3).forEach(c => {
        if (c.actor) {
          actorWeights[c.actor] = (actorWeights[c.actor] || 0) + (1.5 * multiplier);
        }
      });
    }
  });

  // Untracked movies pool
  const untracked = allMovies.filter(m => !trackedMovieIds.has(m.id));

  // If user hasn't tracked anything yet, recommend top-rated Nigerian classics & blockbusters
  if (trackedMoviesMap.size === 0) {
    return untracked
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 8)
      .map(movie => ({
        movie,
        score: movie.rating * 10,
        reason: 'Critically acclaimed Nollywood essential with stellar community ratings',
        matchingGenres: movie.genres?.slice(0, 2) || [],
        matchingActors: movie.leadCast?.slice(0, 2).map(c => c.actor) || []
      }));
  }

  // Score candidate untracked movies
  const scoredItems: RecommendationItem[] = [];

  for (const movie of untracked) {
    let score = 0;
    const matchingGenres: string[] = [];
    let matchingDirector: string | undefined = undefined;
    const matchingActors: string[] = [];

    // Genre scoring
    if (Array.isArray(movie.genres)) {
      for (const g of movie.genres) {
        if (genreWeights[g]) {
          score += genreWeights[g] * 3.5;
          matchingGenres.push(g);
        }
      }
    }

    // Director scoring
    if (movie.director && directorWeights[movie.director]) {
      score += directorWeights[movie.director] * 6.0;
      matchingDirector = movie.director;
    }

    // Actor scoring
    if (Array.isArray(movie.leadCast)) {
      for (const c of movie.leadCast) {
        if (c.actor && actorWeights[c.actor]) {
          score += actorWeights[c.actor] * 4.0;
          matchingActors.push(c.actor);
        }
      }
    }

    // Quality bonus
    score += (movie.rating || 7.0) * 0.8;

    if (score > 4) {
      // Formulate compelling, transparent explanation reason
      let reason = '';
      if (matchingDirector && matchingActors.length > 0) {
        reason = `Directed by ${matchingDirector} and starring ${matchingActors[0]}, matching your viewing preferences.`;
      } else if (matchingDirector) {
        reason = `Directed by ${matchingDirector}, who helmed films in your tracking list.`;
      } else if (matchingActors.length > 0 && matchingGenres.length > 0) {
        reason = `Features ${matchingActors.join(', ')} in a high-rated ${matchingGenres[0]} film.`;
      } else if (matchingActors.length > 0) {
        reason = `Starring ${matchingActors[0]}, an actor from your favorite Nollywood titles.`;
      } else if (matchingGenres.length > 0) {
        reason = `Matches your preference for ${matchingGenres.slice(0, 2).join(' & ')} African cinema.`;
      } else {
        reason = 'Popular Nollywood selection tailored for you.';
      }

      scoredItems.push({
        movie,
        score,
        reason,
        matchingGenres,
        matchingDirector,
        matchingActors
      });
    }
  }

  // Sort descending by calculated score
  return scoredItems.sort((a, b) => b.score - a.score).slice(0, 10);
}

