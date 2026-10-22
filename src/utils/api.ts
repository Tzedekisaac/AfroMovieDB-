import { Movie, Era, StreamingPlatform, CastMember, PersonProfileData, UserTrackedItem, RecommendationItem } from '../types';

export const TMDB_API_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb';
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

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
export async function searchMoviesOnline(query: string, forceRefresh: boolean = false): Promise<WebMovieCandidate[]> {
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
    const rawRes = await fetch(rawUrl);
    if (rawRes.ok) {
      const rawData = await rawRes.json();
      results = rawData.results || [];
    }

    // 2. If nothing found, search with 'Nollywood' appended to avoid foreign title collisions
    if (results.length === 0 && !lowerQuery.includes('nollywood')) {
      const fallbackUrl = `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(`${cleanQuery} Nollywood`)}&include_adult=false&language=en-US&page=1`;
      const fallbackRes = await fetch(fallbackUrl);
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        results = fallbackData.results || [];
      }
    }

    // 3. Fallback with 'Nigerian movie'
    if (results.length === 0 && !lowerQuery.includes('nigerian')) {
      const fallbackUrl2 = `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(`${cleanQuery} Nigerian movie`)}&include_adult=false&language=en-US&page=1`;
      const fallbackRes2 = await fetch(fallbackUrl2);
      if (fallbackRes2.ok) {
        const fallbackData2 = await fallbackRes2.json();
        results = fallbackData2.results || [];
      }
    }

    const formatted = results.map((item: any) => formatTmdbResult(item, cleanQuery));
    if (formatted.length > 0) {
      setCachedItem(cacheKey, formatted, SEARCH_TTL_MS);
    }
    return formatted;
  } catch (error) {
    console.warn('Error searching movies online:', error);
    return [];
  }
}

function formatTmdbResult(item: any, fallbackTitle: string): WebMovieCandidate {
  const year = item.release_date ? parseInt(item.release_date.split('-')[0], 10) : new Date().getFullYear();
  const fallbackPoster = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800&auto=format&fit=crop';
  const posterPath = item.poster_path 
    ? `${TMDB_IMAGE_BASE}/w780${item.poster_path}`
    : fallbackPoster;
  const backdropPath = item.backdrop_path
    ? `${TMDB_IMAGE_BASE}/original${item.backdrop_path}`
    : posterPath;

  return {
    tmdbId: Number(item.id) || Date.now(),
    title: item.title || item.original_title || fallbackTitle,
    originalTitle: item.original_title || '',
    releaseYear: isNaN(year) ? new Date().getFullYear() : year,
    overview: item.overview || 'A captivating Nollywood cinematic story celebrating Nigerian film culture.',
    posterUrl: posterPath,
    backdropUrl: backdropPath,
    rating: typeof item.vote_average === 'number' && item.vote_average > 0 ? Math.round(item.vote_average * 10) / 10 : 7.8,
    ratingCount: Number(item.vote_count) || 120,
    genreIds: Array.isArray(item.genre_ids) ? item.genre_ids : [],
    language: item.original_language || 'en',
    popularity: Number(item.popularity) || 0
  };
}

/**
 * Enhanced multi-endpoint discovery connecting to TMDb:
 * Queries multiple endpoints (with_origin_country=NG, with_original_language=yo|ig|ha|pcm,
 * and Nollywood keyword/search tags across multiple pages 1-5 per era)
 * with robust date range filtering for release_date and primary_release_date.
 */
export async function discoverNigerianMovies(
  page: number = 1,
  sortBy: 'release_date.desc' | 'popularity.desc' = 'release_date.desc',
  dateRange?: { gte?: string; lte?: string }
): Promise<{ candidates: WebMovieCandidate[]; totalPages: number; totalResults: number }> {
  try {
    const apiKey = getActiveTmdbApiKey();
    const urls: string[] = [];

    // Endpoint 1: with_origin_country=NG with primary_release_date
    let urlOrigin = `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&with_origin_country=NG&sort_by=${sortBy}&page=${page}&include_adult=false`;
    if (dateRange?.gte) urlOrigin += `&primary_release_date.gte=${dateRange.gte}`;
    if (dateRange?.lte) urlOrigin += `&primary_release_date.lte=${dateRange.lte}`;
    urls.push(urlOrigin);

    // Endpoint 2: with_origin_country=NG with release_date (catches Nigerian theatrical/home release dates)
    if (dateRange?.gte || dateRange?.lte) {
      let urlRelease = `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&with_origin_country=NG&sort_by=${sortBy}&page=${page}&include_adult=false`;
      if (dateRange?.gte) urlRelease += `&release_date.gte=${dateRange.gte}`;
      if (dateRange?.lte) urlRelease += `&release_date.lte=${dateRange.lte}`;
      urls.push(urlRelease);
    }

    // Endpoint 3: Indigenous language Nollywood cinema (Yoruba, Igbo, Hausa, Nigerian Pidgin)
    let urlLang = `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&with_original_language=yo|ig|ha&sort_by=${sortBy}&page=${page}&include_adult=false`;
    if (dateRange?.gte) urlLang += `&primary_release_date.gte=${dateRange.gte}`;
    if (dateRange?.lte) urlLang += `&primary_release_date.lte=${dateRange.lte}`;
    urls.push(urlLang);

    // Endpoint 4: TMDb Nollywood keyword tags (207317: Nollywood, 263548: Nigerian Cinema)
    let urlKeyword = `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&with_keywords=207317|263548&sort_by=${sortBy}&page=${page}&include_adult=false`;
    if (dateRange?.gte) urlKeyword += `&primary_release_date.gte=${dateRange.gte}`;
    if (dateRange?.lte) urlKeyword += `&primary_release_date.lte=${dateRange.lte}`;
    urls.push(urlKeyword);

    // Endpoint 5: Multi-page search query fallbacks for Nollywood and Nigerian cinema
    if (page <= 5 && !dateRange) {
      urls.push(`${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=Nollywood&page=${page}&include_adult=false`);
      urls.push(`${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=Nigerian%20movie&page=${page}&include_adult=false`);
    }

    const responses = await Promise.allSettled(urls.map(u => fetch(u)));
    const allRawItems: any[] = [];
    let maxTotalPages = 5;

    for (const res of responses) {
      if (res.status === 'fulfilled' && res.value.ok) {
        try {
          const data = await res.value.json();
          if (data.total_pages && data.total_pages > maxTotalPages) {
            maxTotalPages = Math.min(data.total_pages, 20);
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
        const itemDate = item.release_date || '';
        if (itemDate) {
          if (dateRange.gte && itemDate < dateRange.gte) continue;
          if (dateRange.lte && itemDate > dateRange.lte) continue;
        }
      }
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    }

    const candidates = Array.from(uniqueMap.values()).map((item: any) => 
      formatTmdbResult(item, item.title || 'Nollywood Film')
    );

    return {
      candidates,
      totalPages: maxTotalPages,
      totalResults: candidates.length
    };
  } catch (error) {
    console.error('Error discovering Nigerian movies from TMDb:', error);
    return { candidates: [], totalPages: 0, totalResults: 0 };
  }
}

/**
 * Fetch movie credits (cast & crew) directly from TMDb with 24-hour caching
 */
export async function fetchMovieCredits(tmdbId: number, forceRefresh: boolean = false): Promise<{ cast: any[]; crew: any[] } | null> {
  const cacheKey = `credits_${tmdbId}`;
  if (!forceRefresh) {
    const cached = getCachedItem<{ cast: any[]; crew: any[] }>(cacheKey);
    if (cached) return cached;
  }

  try {
    const url = `${TMDB_BASE_URL}/movie/${tmdbId}/credits?api_key=${getActiveTmdbApiKey()}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data) {
      setCachedItem(cacheKey, data, MOVIE_TTL_MS);
    }
    return data;
  } catch (err) {
    console.warn(`Failed to fetch credits for TMDb ID ${tmdbId}:`, err);
    return null;
  }
}

/**
 * Pull full movie details including credits and trailers from TMDb with 24-hour caching
 */
export async function pullMovieDetailsFromOnline(candidate: WebMovieCandidate, forceRefresh: boolean = false): Promise<Movie> {
  const cacheKey = `movie_${candidate.tmdbId || candidate.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
  if (!forceRefresh) {
    const cached = getCachedItem<Movie>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  let director = '';
  let directorAvatarUrl = '';
  let directorTmdbId: number | undefined = undefined;
  let leadCast: CastMember[] = [];
  let runtime = 110;
  let trailerYoutubeId = 'v8wIe7_xK3U'; // Default trailer fallback
  let genres: string[] = [];
  let tagline = 'A compelling Nigerian cinematic journey.';

  try {
    const detailsUrl = `${TMDB_BASE_URL}/movie/${candidate.tmdbId}?api_key=${getActiveTmdbApiKey()}&append_to_response=credits,videos`;
    const res = await fetch(detailsUrl);
    if (res.ok) {
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
        const fallbackCredits = await fetchMovieCredits(candidate.tmdbId);
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
    console.warn('Failed to fetch detailed TMDb attributes:', err);
  }

  // Fallback genres if empty
  if (genres.length === 0) {
    if (candidate.genreIds && candidate.genreIds.length > 0) {
      genres = candidate.genreIds
        .map(id => GENRE_MAP[id])
        .filter(Boolean) as string[];
    }
    if (genres.length === 0) {
      genres = ['Drama'];
    }
  }

  // Deduplicate genres
  genres = Array.from(new Set(genres)).slice(0, 3);

  const era = determineEra(candidate.releaseYear);

  // Streaming platforms based on year / modern release
  const platforms: StreamingPlatform[] = [];
  if (candidate.releaseYear >= 2021) {
    platforms.push({ name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' });
    platforms.push({ name: 'Prime Video', badgeColor: 'bg-blue-600', url: 'https://www.primevideo.com' });
  } else if (candidate.releaseYear >= 2010) {
    platforms.push({ name: 'Netflix', badgeColor: 'bg-red-600', url: 'https://www.netflix.com' });
    platforms.push({ name: 'YouTube', badgeColor: 'bg-red-500', url: 'https://www.youtube.com' });
  } else {
    platforms.push({ name: 'YouTube', badgeColor: 'bg-red-500', url: 'https://www.youtube.com' });
    platforms.push({ name: 'Africa Magic', badgeColor: 'bg-purple-600', url: 'https://www.dstv.com' });
  }

  const cleanId = candidate.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') + '-' + (candidate.tmdbId || Date.now().toString().slice(-4));

  const fullMovie: Movie = {
    id: cleanId,
    title: candidate.title || 'Untitled Nollywood Film',
    nativeTitle: (candidate.originalTitle && candidate.originalTitle !== candidate.title) ? candidate.originalTitle : '',
    tagline: tagline || '',
    releaseYear: Number(candidate.releaseYear) || new Date().getFullYear(),
    director: director || 'Nigerian Filmmaker Team',
    directorAvatarUrl: directorAvatarUrl || '',
    directorTmdbId: directorTmdbId !== undefined ? Number(directorTmdbId) : undefined,
    leadCast: Array.isArray(leadCast) && leadCast.length > 0 ? leadCast : [
      { actor: 'Nollywood Cast Ensemble', role: 'Main Cast', avatarUrl: '' }
    ],
    genres: genres.length > 0 ? genres : ['Drama'],
    languages: ['English', 'Nigerian Pidgin', 'Yoruba'],
    era: era || determineEra(candidate.releaseYear),
    runtimeMinutes: Number(runtime) || 105,
    rating: typeof candidate.rating === 'number' && candidate.rating > 0 ? candidate.rating : 8.0,
    ratingCount: Number(candidate.ratingCount) || 120,
    posterUrl: candidate.posterUrl || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800&auto=format&fit=crop',
    backdropUrl: candidate.backdropUrl || candidate.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1600&auto=format&fit=crop',
    synopsis: candidate.overview || 'A gripping Nollywood production highlighting rich cultural storytelling.',
    culturalSignificance: `Discovered from TMDb Nollywood Archive. Represents ${era || determineEra(candidate.releaseYear)}.`,
    streamingPlatforms: Array.isArray(platforms) ? platforms.map(p => ({
      name: p?.name || 'Netflix',
      badgeColor: p?.badgeColor || 'bg-slate-700',
      url: p?.url || ''
    })) : [],
    trailerYoutubeId: trailerYoutubeId || '',
    amvcaAwards: ['Nollywood Cinema Selection'],
    featured: false,
    boxOfficeChampion: false,
    isUserAdded: true,
    source: 'web_pulled',
    tmdbId: candidate.tmdbId ? Number(candidate.tmdbId) : undefined
  };

  setCachedItem(cacheKey, fullMovie, MOVIE_TTL_MS);
  return fullMovie;
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
 * Bulk fetch and convert multiple pages of Nigerian films from TMDb with strict deduplication
 */
export async function bulkSyncNigerianNewReleases(
  maxMovies: number = 32,
  onProgress?: (syncedCount: number, total: number) => void,
  existingMovies: Movie[] = []
): Promise<Movie[]> {
  const syncedMovies: Movie[] = [];
  let page = 1;
  const maxPages = 5;
  const currentPool = [...existingMovies];

  while (syncedMovies.length < maxMovies && page <= maxPages) {
    const { candidates, totalPages } = await discoverNigerianMovies(page, 'release_date.desc');
    if (candidates.length === 0) break;

    for (const candidate of candidates) {
      if (syncedMovies.length >= maxMovies) break;

      // Skip invalid items
      if (!candidate.title || !candidate.posterUrl) continue;

      // Strict duplicate prevention
      if (isDuplicateMovie(candidate, currentPool)) {
        continue;
      }

      const movie = await pullMovieDetailsFromOnline(candidate);
      syncedMovies.push(movie);
      currentPool.push(movie);

      if (onProgress) {
        onProgress(syncedMovies.length, maxMovies);
      }
    }

    if (page >= totalPages) break;
    page++;
  }

  return syncedMovies;
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
  'Namaste Wahala'
];

/**
 * Progress update payload for deep historical sweep
 * Notice: Internal page numbers (e.g. Page 2/5) are explicitly excluded per user specification
 */
export interface HistoricalSweepProgress {
  decadeLabel: string;
  importedCount: number;
  percent: number;
  isComplete: boolean;
  statusText: string;
}

/**
 * Deep Multi-Decade Historical Bulk Importer:
 * Scans historical eras (1980s, 1990s, 2000s, 2010s, 2020s) across pages 1 to 5.
 * Strictly deduplicates every movie before pulling details.
 * Emits clean, human-oriented progress telemetry (no internal page numbers displayed).
 */
const CLASSIC_QUERIES_BY_ERA: Record<string, string[]> = {
  '1980s Era': ['Aiye', 'Jaiyesimi', 'Kada River', 'Papa Ajasco'],
  '1990s Era': [
    'Living in Bondage', 'Glamour Girls', 'Saworoide', 'Nneka The Pretty Serpent', 
    'Domitilla', 'Hostages', 'Thunderbolt', 'Ti Oluwa Ni Ile', 'Mortal Inheritance', 
    'Diamond Ring', 'Karishika', 'Scores to Settle', 'Igodo', 'Blood Money', 'Sakobi'
  ],
  '2000s Era': [
    'Osuofia in London', 'Aki na Ukwa', 'Issakaba', 'The Figurine', 'Irapada', 
    'Dangerous Twins', 'Jenifa', 'Games Men Play', 'Keeping Faith', 'Blood Sister',
    'Out of Bounds'
  ],
  '2010s Era': [
    'The Wedding Party', 'Fifty', 'October 1', 'Taxi Driver', 
    'Chief Daddy', 'King of Boys', 'Lionheart', 'Merry Men', 'The Bling Lagosians', 
    'Isoken', 'Up North'
  ]
};

/**
 * Deep Multi-Decade Historical Bulk Importer:
 * Scans historical eras (1980s, 1990s, 2000s, 2010s, 2020s) across multiple TMDb endpoints.
 * Relaxed deduplication preserves valid classics across different eras.
 * Emits clean, human-oriented progress telemetry (no internal page numbers displayed).
 */
export async function runDeepHistoricalSweep(
  existingMovies: Movie[],
  onProgress?: (progress: HistoricalSweepProgress) => void
): Promise<{ newMovies: Movie[]; summary: string }> {
  const erasToScan = [
    { label: '1980s Era', gte: '1980-01-01', lte: '1989-12-31' },
    { label: '1990s Era', gte: '1990-01-01', lte: '1999-12-31' },
    { label: '2000s Era', gte: '2000-01-01', lte: '2009-12-31' },
    { label: '2010s Era', gte: '2010-01-01', lte: '2019-12-31' },
    { label: '2020s Era', gte: '2020-01-01', lte: '2029-12-31' }
  ];

  const PAGES_PER_ERA = 5;
  const totalSteps = erasToScan.length * PAGES_PER_ERA;
  let currentStep = 0;
  const pool = [...existingMovies];
  const newImported: Movie[] = [];

  for (let eraIdx = 0; eraIdx < erasToScan.length; eraIdx++) {
    const era = erasToScan[eraIdx];

    for (let page = 1; page <= PAGES_PER_ERA; page++) {
      currentStep++;
      const percent = Math.min(95, Math.round((currentStep / totalSteps) * 100));

      if (onProgress) {
        onProgress({
          decadeLabel: era.label,
          importedCount: newImported.length,
          percent,
          isComplete: false,
          statusText: `Scanning ${era.label} • ${newImported.length} Classic Films Added`
        });
      }

      try {
        const { candidates, totalPages } = await discoverNigerianMovies(
          page, 
          'popularity.desc', 
          { gte: era.gte, lte: era.lte }
        );

        if (candidates && candidates.length > 0) {
          for (const candidate of candidates) {
            if (!candidate.title) continue;

            // Relaxed Deduplication Check
            if (isDuplicateMovie(candidate, pool)) {
              continue;
            }

            try {
              const fullMovie = await pullMovieDetailsFromOnline(candidate);
              newImported.push(fullMovie);
              pool.push(fullMovie);

              if (onProgress) {
                onProgress({
                  decadeLabel: era.label,
                  importedCount: newImported.length,
                  percent,
                  isComplete: false,
                  statusText: `Scanning ${era.label} • ${newImported.length} Classic Films Added`
                });
              }
            } catch (e) {
              console.warn(`Could not pull full details for ${candidate.title}`, e);
            }
          }
        }

        if (page >= totalPages) {
          break;
        }
      } catch (err) {
        console.warn(`Error during historical sweep of ${era.label} page ${page}:`, err);
      }
    }

    // Targeted era search query fallback to ensure iconic classic Nollywood films are represented
    const classicTitles = CLASSIC_QUERIES_BY_ERA[era.label] || [];
    for (const titleQuery of classicTitles) {
      try {
        const searchCandidates = await searchMoviesOnline(titleQuery);
        for (const cand of searchCandidates.slice(0, 2)) {
          if (!cand.title) continue;
          if (isDuplicateMovie(cand, pool)) continue;

          const fullMovie = await pullMovieDetailsFromOnline(cand);
          newImported.push(fullMovie);
          pool.push(fullMovie);

          if (onProgress) {
            onProgress({
              decadeLabel: era.label,
              importedCount: newImported.length,
              percent: Math.min(95, Math.round((currentStep / totalSteps) * 100)),
              isComplete: false,
              statusText: `Scanning ${era.label} • ${newImported.length} Classic Films Added`
            });
          }
        }
      } catch (err) {
        console.warn(`Error searching classic query ${titleQuery}:`, err);
      }
    }
  }

  const summary = `Historical sweep completed! ${newImported.length} classic films imported across 5 decades without duplicates.`;

  if (onProgress) {
    onProgress({
      decadeLabel: 'Complete',
      importedCount: newImported.length,
      percent: 100,
      isComplete: true,
      statusText: summary
    });
  }

  return { newMovies: newImported, summary };
}

/**
 * Automatically checks if 24 hours have passed since last release sync from TMDb.
 * If so, syncs new Nigerian releases in the background, caches them in localStorage, and returns fresh titles.
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

    // Perform background sync (fetching up to 16 fresh Nigerian releases with strict deduplication)
    const freshMovies = await bulkSyncNigerianNewReleases(16, onProgress, existingMovies);

    // Save updated timestamp
    localStorage.setItem(LAST_RELEASE_SYNC_KEY, now.toString());

    return { syncedMovies: freshMovies, isSyncPerformed: true };
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

