/**
 * Public API facade for TMDb data fetching, artwork/person resolution,
 * sanitization, catalog ingestion/sync, and recommendations.
 *
 * Re-exports modular implementations under `src/utils/api/` and static
 * lookup data under `src/data/tmdbConfig.ts` so existing callers keep working.
 */

export {
  isNigerianMovie,
  isDiscoveryCandidateEligible,
  validateNigerianMovie,
  ValidationStatus,
  parseSpokenLanguages,
  extractOriginCountries,
  KNOWN_FOREIGN_TITLES_LOWER,
  NIGERIAN_ORIGIN_COUNTRY,
  NIGERIAN_LANGUAGES,
  NIGERIAN_INDIGENOUS_LANGUAGES
} from './nigerianMovieValidator.ts';

export {
  subscribeToCustomMovies,
  saveMultipleFirestoreMovies,
  purgeNonNigerianMoviesFromFirestore
} from '../lib/firestoreService.ts';

export {
  TMDB_API_KEY,
  TMDB_BASE_URL,
  TMDB_IMAGE_BASE,
  KNOWN_PERSON_HEADSHOTS,
  GENRE_MAP,
  PLATFORM_PRESETS,
  POPULAR_NIGERIAN_WEB_SUGGESTIONS,
  CLASSIC_QUERIES_BY_ERA,
  HISTORICAL_SWEEP_ERAS,
  CACHE_PREFIX,
  MOVIE_TTL_MS,
  PERSON_TTL_MS,
  SEARCH_TTL_MS,
  LAST_RELEASE_SYNC_KEY,
  RELEASE_SYNC_INTERVAL_MS
} from '../data/tmdbConfig.ts';

export type {
  WebMovieCandidate,
  CacheEnvelope,
  HistoricalSweepProgress
} from './api/types.ts';

export {
  getCachedItem,
  setCachedItem,
  removeCachedItem,
  pruneExpiredCache
} from './api/cache.ts';

export {
  setCustomTmdbKey,
  getCustomTmdbKey,
  getActiveTmdbApiKey,
  testTmdbApiKey,
  sleep,
  safeTmdbFetch
} from './api/tmdbClient.ts';

export {
  buildTmdbPosterUrl,
  buildTmdbBackdropUrl,
  buildTmdbAvatarUrl,
  normalizePersonName,
  resolveKnownPersonHeadshot,
  fetchPersonProfile,
  fetchPersonHeadshot
} from './api/artworkHelpers.ts';

export {
  determineEra,
  getDefaultStreamingPlatforms,
  hasExplicitNigerianOrigin,
  sanitizeCandidate,
  formatTmdbResult,
  sanitizeMovie,
  normalizeTitle,
  extractTmdbId,
  isDuplicateMovie
} from './api/sanitization.ts';

export {
  searchMoviesOnline,
  discoverNigerianMovies,
  fetchMovieCredits,
  pullMovieDetailsFromOnline
} from './api/tmdbMovies.ts';

export {
  bulkSyncNigerianNewReleases,
  runDeepHistoricalSweep,
  checkAndRunDailySync
} from './api/ingestion.ts';

export { getPersonalizedRecommendations } from './api/recommendations.ts';
