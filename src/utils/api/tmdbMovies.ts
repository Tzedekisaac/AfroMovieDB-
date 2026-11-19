import type { Movie, CastMember, StreamingPlatform } from '../../types.ts';
import {
  TMDB_BASE_URL,
  TMDB_RESULT_PAGE_LIMIT,
  TMDB_NOLLYWOOD_KEYWORD_IDS,
  NIGERIAN_INDIGENOUS_LANGUAGE_CODES,
  DEFAULT_MOVIE_RUNTIME_MINUTES,
  GENRE_MAP,
  MOVIE_TTL_MS,
  SEARCH_TTL_MS
} from '../../data/tmdbConfig.ts';
import {
  isDiscoveryCandidateEligible,
  parseSpokenLanguages,
  extractOriginCountries
} from '../nigerianMovieValidator.ts';
import { normalizeMovieCollections } from '../movieCollections.ts';
import { getCachedItem, setCachedItem, removeCachedItem } from './cache.ts';
import { getActiveTmdbApiKey, safeTmdbFetch, throwIfAborted } from './tmdbClient.ts';
import { buildTmdbAvatarUrl } from './artworkHelpers.ts';
import {
  determineEra,
  getDefaultStreamingPlatforms,
  hasExplicitNigerianOrigin,
  sanitizeCandidate,
  sanitizeMovie
} from './sanitization.ts';
import type { WebMovieCandidate } from './types.ts';

/**
 * Search movies from the internet (TMDb) with 2-hour tiered localStorage caching.
 * Enforces strict origin_country: ['NG'] filtering so only verified Nigerian films are returned.
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
      const verified = cached.filter(cand => hasExplicitNigerianOrigin(cand));
      if (verified.length > 0) {
        return verified;
      }
    }
  }

  const apiKey = getActiveTmdbApiKey();
  if (!apiKey) {
    console.warn('[TMDb] Missing VITE_TMDB_API_KEY: configure environment variable or set a personal TMDb key in your profile.');
    return [];
  }
  const lowerQuery = cleanQuery.toLowerCase();
  let results: any[] = [];

  try {
    // 1. Direct raw title query strictly with with_origin_country=NG
    const rawUrl = `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(cleanQuery)}&with_origin_country=NG&include_adult=false&language=en-US&page=1`;
    const rawRes = await safeTmdbFetch(rawUrl, 2, signal);
    if (rawRes && rawRes.ok) {
      const rawData = await rawRes.json();
      results = rawData.results || [];
    }

    // 2. If nothing found, search with 'Nollywood' appended with with_origin_country=NG
    if (results.length === 0 && !lowerQuery.includes('nollywood')) {
      const fallbackUrl = `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(`${cleanQuery} Nollywood`)}&with_origin_country=NG&include_adult=false&language=en-US&page=1`;
      const fallbackRes = await safeTmdbFetch(fallbackUrl, 2, signal);
      if (fallbackRes && fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        results = fallbackData.results || [];
      }
    }

    // 3. Fallback with 'Nigerian movie' with with_origin_country=NG
    if (results.length === 0 && !lowerQuery.includes('nigerian')) {
      const fallbackUrl2 = `${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(`${cleanQuery} Nigerian movie`)}&with_origin_country=NG&include_adult=false&language=en-US&page=1`;
      const fallbackRes2 = await safeTmdbFetch(fallbackUrl2, 2, signal);
      if (fallbackRes2 && fallbackRes2.ok) {
        const fallbackData2 = await fallbackRes2.json();
        results = fallbackData2.results || [];
      }
    }

    // Enrich top candidate results in parallel with origin_country and production_countries from details
    const candidateSlice = results.slice(0, 10);
    const enrichedResults = await Promise.all(
      candidateSlice.map(async (item: any) => {
        if (!item || !item.id) return item;
        try {
          const detailUrl = `${TMDB_BASE_URL}/movie/${item.id}?api_key=${apiKey}&with_origin_country=NG`;
          const detailRes = await safeTmdbFetch(detailUrl, 1, signal);
          if (detailRes && detailRes.ok) {
            const detailData = await detailRes.json();
            return {
              ...item,
              origin_country: detailData.origin_country,
              production_countries: detailData.production_countries,
              original_language: detailData.original_language || item.original_language,
              spoken_languages: detailData.spoken_languages
            };
          }
        } catch {
          // Continue with raw item if probe fails
        }
        return item;
      })
    );

    const filteredResults = enrichedResults.filter((item: any) => hasExplicitNigerianOrigin(item));
    const formatted = filteredResults.map((item: any) => sanitizeCandidate(item, cleanQuery));
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

/**
 * Enhanced multi-endpoint discovery connecting to TMDb:
 * Broad Nigerian origin parameters (with_origin_country=NG, with_original_language=yo|ig|ha|pcm,
 * and Nollywood keyword/search tags) with date range filtering.
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
    if (!apiKey) {
      console.warn('[TMDb] Missing VITE_TMDB_API_KEY: skipping online catalog discovery.');
      return { candidates: [], totalPages: 0, totalResults: 0 };
    }
    const requestedPage = Math.max(1, Math.min(TMDB_RESULT_PAGE_LIMIT, Math.floor(page) || 1));
    const urls: string[] = [];

    let urlOrigin = `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&with_origin_country=NG&sort_by=${sortBy}&page=${requestedPage}&include_adult=false`;
    if (dateRange?.gte) urlOrigin += `&primary_release_date.gte=${dateRange.gte}`;
    if (dateRange?.lte) urlOrigin += `&primary_release_date.lte=${dateRange.lte}`;
    urls.push(urlOrigin);

    if (dateRange?.gte || dateRange?.lte) {
      let urlRelease = `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&with_origin_country=NG&sort_by=${sortBy}&page=${requestedPage}&include_adult=false`;
      if (dateRange?.gte) urlRelease += `&release_date.gte=${dateRange.gte}`;
      if (dateRange?.lte) urlRelease += `&release_date.lte=${dateRange.lte}`;
      urls.push(urlRelease);
    }

    let urlLang = `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&with_origin_country=NG&with_original_language=${NIGERIAN_INDIGENOUS_LANGUAGE_CODES}&sort_by=${sortBy}&page=${requestedPage}&include_adult=false`;
    if (dateRange?.gte) urlLang += `&primary_release_date.gte=${dateRange.gte}`;
    if (dateRange?.lte) urlLang += `&primary_release_date.lte=${dateRange.lte}`;
    urls.push(urlLang);

    let urlNigerianEnglish = `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&with_origin_country=NG&with_original_language=en&sort_by=${sortBy}&page=${requestedPage}&include_adult=false`;
    if (dateRange?.gte) urlNigerianEnglish += `&primary_release_date.gte=${dateRange.gte}`;
    if (dateRange?.lte) urlNigerianEnglish += `&primary_release_date.lte=${dateRange.lte}`;
    urls.push(urlNigerianEnglish);

    let urlKeyword = `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&with_origin_country=NG&with_keywords=${TMDB_NOLLYWOOD_KEYWORD_IDS}&sort_by=${sortBy}&page=${requestedPage}&include_adult=false`;
    if (dateRange?.gte) urlKeyword += `&primary_release_date.gte=${dateRange.gte}`;
    if (dateRange?.lte) urlKeyword += `&primary_release_date.lte=${dateRange.lte}`;
    urls.push(urlKeyword);

    if (requestedPage <= 5) {
      urls.push(`${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=Nollywood&page=${requestedPage}&include_adult=false&with_origin_country=NG`);
      urls.push(`${TMDB_BASE_URL}/search/movie?api_key=${apiKey}&query=Nigerian%20movie&page=${requestedPage}&include_adult=false&with_origin_country=NG`);
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
        } catch {
          // Skip malformed response payload
        }
      }
    }

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

    const verifiedItems = Array.from(uniqueMap.values()).filter((item: any) => isDiscoveryCandidateEligible(item));
    const candidates = verifiedItems.map((item: any) =>
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
 * Fetch movie credits (cast & crew) directly from TMDb with 24-hour caching.
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

  const apiKey = getActiveTmdbApiKey();
  if (!apiKey) return null;

  try {
    const url = `${TMDB_BASE_URL}/movie/${tmdbId}/credits?api_key=${apiKey}&with_origin_country=NG`;
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
      if (hasExplicitNigerianOrigin(cached)) {
        return sanitizeMovie(cached);
      } else {
        removeCachedItem(cacheKey);
      }
    }
  }

  if (!cleanCand.tmdbId || cleanCand.tmdbId <= 0) {
    throw new Error(`No verified Nigerian film found: missing valid TMDb database ID for "${cleanCand.title || 'query'}".`);
  }

  let director = '';
  let directorAvatarUrl = '';
  let directorTmdbId: number | undefined = undefined;
  let leadCast: CastMember[] = [];
  let runtime = DEFAULT_MOVIE_RUNTIME_MINUTES;
  let trailerYoutubeId = '';
  let genres: string[] = [];
  let tagline = '';
  let detailsData: any = null;

  const apiKey = getActiveTmdbApiKey();
  try {
    if (apiKey) {
      const detailsUrl = `${TMDB_BASE_URL}/movie/${cleanCand.tmdbId}?api_key=${apiKey}&with_origin_country=NG&append_to_response=credits,videos`;
      const res = await safeTmdbFetch(detailsUrl, 2, signal);
      if (res && res.ok) {
        detailsData = await res.json();
        const d = detailsData;

        if (d.runtime) {
          runtime = Number(d.runtime) || DEFAULT_MOVIE_RUNTIME_MINUTES;
        }
        if (d.tagline && d.tagline.trim()) {
          tagline = d.tagline.trim();
        }

        if (Array.isArray(d.genres) && d.genres.length > 0) {
          const rawGenres = d.genres
            .map((g: any) => {
              if (!g?.name) return null;
              if (g.name === 'Romance') return 'Romantic Comedy';
              if (g.name === 'Thriller') return 'Crime & Thriller';
              if (g.name === 'History') return 'Historical Drama';
              if (['Action', 'Comedy', 'Drama'].includes(g.name)) return g.name;
              return g.name;
            })
            .filter(Boolean);
          genres = Array.from(new Set(rawGenres));
        }

        let credits = d.credits;
        if (!credits || (!credits.crew?.length && !credits.cast?.length)) {
          const fallbackCredits = await fetchMovieCredits(cleanCand.tmdbId, false, signal);
          if (fallbackCredits) {
            credits = fallbackCredits;
          }
        }

        const crew: any[] = credits?.crew || [];
        const directors = crew.filter((c: any) => c.job === 'Director');
        if (directors.length > 0) {
          director = directors.map((dir: any) => dir.name).join(' & ');
          directorAvatarUrl = buildTmdbAvatarUrl(directors[0].profile_path, undefined, 'w342');
          directorTmdbId = directors[0].id ? Number(directors[0].id) : undefined;
        } else {
          const directingMember = crew.find((c: any) => c.department === 'Directing');
          if (directingMember) {
            director = directingMember.name;
            directorAvatarUrl = buildTmdbAvatarUrl(directingMember.profile_path, undefined, 'w342');
            directorTmdbId = directingMember.id ? Number(directingMember.id) : undefined;
          } else {
            const writerOrProducer = crew.find(
              (c: any) => c.job === 'Writer' || c.job === 'Screenplay' || c.job === 'Producer'
            );
            if (writerOrProducer) {
              director = writerOrProducer.name;
              directorAvatarUrl = buildTmdbAvatarUrl(writerOrProducer.profile_path, undefined, 'w342');
              directorTmdbId = writerOrProducer.id ? Number(writerOrProducer.id) : undefined;
            }
          }
        }

        const castList: any[] = credits?.cast || [];
        if (castList.length > 0) {
          leadCast = castList.slice(0, 8).map((c: any) => ({
            actor: c.name || 'Cast Member',
            role: c.character?.trim() || 'Cast Member',
            avatarUrl: buildTmdbAvatarUrl(c.profile_path, undefined, 'w185'),
            tmdbId: c.id ? Number(c.id) : undefined
          }));
        }

        const videos = d.videos?.results || [];
        const ytTrailer = videos.find(
          (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
        );
        if (ytTrailer && ytTrailer.key) {
          trailerYoutubeId = ytTrailer.key;
        }
      }
    } else {
      console.warn('[TMDb] Missing VITE_TMDB_API_KEY: skipping live movie details enrichment.');
    }
  } catch (err) {
    if (signal?.aborted) throw err;
    console.warn('Failed to fetch detailed TMDb attributes:', err);
  }

  throwIfAborted(signal);

  const candidateHasNg = hasExplicitNigerianOrigin(cleanCand);
  const detailsHasNg = detailsData ? hasExplicitNigerianOrigin(detailsData) : false;
  if (detailsData ? !detailsHasNg : !candidateHasNg) {
    throw new Error(
      `No verified Nigerian film found: "${cleanCand.title}" does not meet strict origin_country: ['NG'] requirements.`
    );
  }

  const parsedLanguages = detailsData
    ? parseSpokenLanguages(detailsData)
    : parseSpokenLanguages(cleanCand);

  const originCountry = detailsData
    ? extractOriginCountries(detailsData)
    : extractOriginCountries(cleanCand);
  const originalLanguage = String(detailsData?.original_language || cleanCand.language || 'en')
    .trim()
    .toLowerCase();

  if (genres.length === 0) {
    if (cleanCand.genreIds && cleanCand.genreIds.length > 0) {
      genres = cleanCand.genreIds.map(id => GENRE_MAP[id]).filter(Boolean) as string[];
    }
    if (genres.length === 0) {
      genres = ['Drama'];
    }
  }

  genres = Array.from(new Set(genres)).slice(0, 3);
  const era = determineEra(cleanCand.releaseYear);
  const platforms: StreamingPlatform[] = getDefaultStreamingPlatforms(cleanCand.releaseYear);

  const resolvedTitle = String(detailsData?.title || cleanCand.title || '').trim();
  const cleanId =
    resolvedTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') +
    '-' +
    (cleanCand.tmdbId || Date.now().toString().slice(-4));

  const realSynopsis =
    typeof detailsData?.overview === 'string' && detailsData.overview.trim()
      ? detailsData.overview.trim()
      : cleanCand.overview || '';

  const rawFullMovie = {
    id: cleanId,
    title: resolvedTitle,
    nativeTitle:
      cleanCand.originalTitle && cleanCand.originalTitle !== resolvedTitle ? cleanCand.originalTitle : '',
    tagline: tagline || '',
    releaseYear: cleanCand.releaseYear || new Date().getFullYear(),
    director: director || '',
    directorAvatarUrl: directorAvatarUrl || '',
    directorTmdbId,
    leadCast,
    genres: genres.length > 0 ? genres : ['Drama'],
    languages: parsedLanguages,
    originCountry,
    originalLanguage,
    era: era || determineEra(cleanCand.releaseYear),
    runtimeMinutes: Number(runtime) || DEFAULT_MOVIE_RUNTIME_MINUTES,
    rating: typeof cleanCand.rating === 'number' && cleanCand.rating > 0 ? cleanCand.rating : 0,
    ratingCount: Number(cleanCand.ratingCount) || 0,
    posterUrl: cleanCand.posterUrl || '',
    backdropUrl: cleanCand.backdropUrl || cleanCand.posterUrl || '',
    synopsis: realSynopsis,
    culturalSignificance: '',
    streamingPlatforms: platforms,
    collections: normalizeMovieCollections([]),
    trailerYoutubeId: trailerYoutubeId || '',
    amvcaAwards: [],
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
