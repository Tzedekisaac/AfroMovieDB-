import type { Movie } from '../../types.ts';
import {
  TMDB_RESULT_PAGE_LIMIT,
  CLASSIC_QUERIES_BY_ERA,
  HISTORICAL_SWEEP_ERAS,
  LAST_RELEASE_SYNC_KEY,
  RELEASE_SYNC_INTERVAL_MS
} from '../../data/tmdbConfig.ts';
import {
  saveMultipleFirestoreMovies,
  purgeNonNigerianMoviesFromFirestore
} from '../../lib/firestoreService.ts';
import { isNigerianMovie, isDiscoveryCandidateEligible } from '../nigerianMovieValidator.ts';
import { sanitizeAndTagMovie } from '../sanitizeAndTagMovie.ts';
import { sleep, throwIfAborted } from './tmdbClient.ts';
import { sanitizeCandidate, sanitizeMovie, isDuplicateMovie } from './sanitization.ts';
import {
  searchMoviesOnline,
  discoverNigerianMovies,
  pullMovieDetailsFromOnline
} from './tmdbMovies.ts';
import type { HistoricalSweepProgress } from './types.ts';

/**
 * Bulk fetch and convert multiple pages of Nigerian films from TMDb with relaxed, ID-aware deduplication.
 */
export async function bulkSyncNigerianNewReleases(
  maxMovies: number = Infinity,
  onProgress?: (syncedCount: number, total: number) => void,
  existingMovies: Movie[] = [],
  maxPages: number = Infinity,
  userId?: string
): Promise<Movie[]> {
  const syncedMovies: Movie[] = [];
  let page = 1;
  const effectiveMaxPages = Number.isFinite(maxPages)
    ? Math.max(1, Math.min(TMDB_RESULT_PAGE_LIMIT, Math.floor(maxPages)))
    : TMDB_RESULT_PAGE_LIMIT;
  const currentPool = [...existingMovies];
  let totalAvailablePages = 1;

  while (syncedMovies.length < maxMovies && page <= effectiveMaxPages && page <= totalAvailablePages) {
    const { candidates, totalPages } = await discoverNigerianMovies(page, 'release_date.desc');
    if (typeof totalPages === 'number' && totalPages > 0) {
      totalAvailablePages = totalPages;
    }
    if (candidates.length === 0) break;

    for (const rawCandidate of candidates) {
      if (syncedMovies.length >= maxMovies) break;

      const candidate = sanitizeCandidate(rawCandidate);
      if (!candidate.title || !candidate.posterUrl || !isDiscoveryCandidateEligible(candidate)) continue;
      if (isDuplicateMovie(candidate, currentPool)) continue;

      try {
        const rawMovie = await pullMovieDetailsFromOnline(candidate);
        if (!isNigerianMovie(rawMovie)) continue;
        const movie = sanitizeAndTagMovie(sanitizeMovie(rawMovie)) as Movie;
        syncedMovies.push(movie);
        currentPool.push(movie);

        if (onProgress) {
          onProgress(syncedMovies.length, Number.isFinite(maxMovies) ? maxMovies : syncedMovies.length);
        }
      } catch (err) {
        console.warn(`Failed pulling details for ${candidate.title}:`, err);
      }
    }

    if (page >= totalAvailablePages) break;
    page++;
    await sleep(60);
  }

  const finalSynced = syncedMovies.map(movie => sanitizeAndTagMovie(sanitizeMovie(movie)) as Movie);
  if (finalSynced.length > 0 && userId) {
    try {
      await saveMultipleFirestoreMovies(finalSynced, userId);
    } catch (err) {
      console.warn('Real-time batch write of fresh releases to Firestore custom_movies encountered an issue:', err);
    }
  }

  return finalSynced;
}

/**
 * Deep Multi-Decade Historical Bulk Importer across 1980s–2020s Nollywood eras.
 */
export async function runDeepHistoricalSweep(
  existingMovies: Movie[],
  onProgress?: (progress: HistoricalSweepProgress) => void,
  pagesPerEra: number = Infinity,
  signal?: AbortSignal
): Promise<{ newMovies: Movie[]; summary: string; cancelled: boolean }> {
  const effectivePagesPerEra = Number.isFinite(pagesPerEra)
    ? Math.max(1, Math.min(TMDB_RESULT_PAGE_LIMIT, Math.floor(pagesPerEra)))
    : TMDB_RESULT_PAGE_LIMIT;

  let currentDecade = HISTORICAL_SWEEP_ERAS[0].label;
  let currentPage = 1;
  let currentTotalPages = 1;
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
    try {
      const purgeResult = await purgeNonNigerianMoviesFromFirestore();
      if (purgeResult.purgedCount > 0) {
        console.info(`[Sweep Routine] Automatically purged ${purgeResult.purgedCount} non-Nigerian movies.`);
      }
    } catch (purgeErr) {
      console.warn('Non-Nigerian movie purge before sweep warning:', purgeErr);
    }

    for (let eraIdx = 0; eraIdx < HISTORICAL_SWEEP_ERAS.length; eraIdx++) {
      const era = HISTORICAL_SWEEP_ERAS[eraIdx];
      throwIfAborted(signal);
      currentDecade = era.label;

      let page = 1;
      let eraTotalPages = 1;

      while (page <= eraTotalPages && page <= effectivePagesPerEra) {
        throwIfAborted(signal);
        currentPage = page;

        try {
          const { candidates, totalPages } = await discoverNigerianMovies(
            page,
            'popularity.desc',
            { gte: era.gte, lte: era.lte },
            signal
          );
          throwIfAborted(signal);
          if (typeof totalPages === 'number' && totalPages > 0) {
            eraTotalPages = Math.min(effectivePagesPerEra, totalPages);
          }
          currentTotalPages = eraTotalPages;
          currentPercent = Math.min(
            95,
            Math.round(((eraIdx + page / Math.max(1, eraTotalPages)) / HISTORICAL_SWEEP_ERAS.length) * 100)
          );
          publishProgress();

          for (const rawCandidate of candidates) {
            throwIfAborted(signal);
            const candidate = sanitizeCandidate(rawCandidate);
            if (!candidate.title || !isDiscoveryCandidateEligible(candidate) || isDuplicateMovie(candidate, pool)) {
              continue;
            }

            try {
              const rawMovie = await pullMovieDetailsFromOnline(candidate, false, signal);
              throwIfAborted(signal);
              if (!isNigerianMovie(rawMovie)) continue;
              const fullMovie = sanitizeAndTagMovie(sanitizeMovie(rawMovie)) as Movie;
              newImported.push(fullMovie);
              pool.push(fullMovie);
              publishProgress();
            } catch (error) {
              if (signal?.aborted) throw error;
              console.warn(`Could not pull full details for ${candidate.title}`, error);
            }
          }

          if (candidates.length === 0 || page >= eraTotalPages) break;

          await sleep(75);
          throwIfAborted(signal);
        } catch (error) {
          if (signal?.aborted) throw error;
          console.warn(`Error during historical sweep of ${era.label} page ${page}:`, error);
          break;
        }

        page++;
      }

      for (const titleQuery of CLASSIC_QUERIES_BY_ERA[era.label] || []) {
        throwIfAborted(signal);
        try {
          const searchCandidates = await searchMoviesOnline(titleQuery, false, signal);
          throwIfAborted(signal);
          for (const rawCand of searchCandidates.slice(0, 3)) {
            throwIfAborted(signal);
            const cand = sanitizeCandidate(rawCand);
            if (!cand.title || !isDiscoveryCandidateEligible(cand) || isDuplicateMovie(cand, pool)) continue;

            const rawMovie = await pullMovieDetailsFromOnline(cand, false, signal);
            throwIfAborted(signal);
            if (!isNigerianMovie(rawMovie)) continue;
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

  const finalSanitized = newImported
    .filter(isNigerianMovie)
    .map(movie => sanitizeAndTagMovie(sanitizeMovie(movie)) as Movie);
  if (signal?.aborted) {
    const summary = `Historical sweep finished early. ${finalSanitized.length} classic films preserved for Cloud Firestore export.`;
    onProgress?.({
      decadeLabel: currentDecade,
      page: currentPage,
      totalPages: currentTotalPages,
      importedCount: finalSanitized.length,
      percent: currentPercent,
      isComplete: false,
      isCancelled: false,
      isSaving: true,
      firestoreSaveStarted: true,
      statusText: summary
    });
    return { newMovies: finalSanitized, summary, cancelled: false };
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
 * Checks if 24 hours have passed since last release sync from TMDb and triggers background ingestion.
 */
export async function checkAndRunDailySync(
  existingMovies: Movie[] = [],
  onProgress?: (syncedCount: number, total: number) => void,
  userId?: string
): Promise<{ syncedMovies: Movie[]; isSyncPerformed: boolean }> {
  try {
    const lastSyncRaw = localStorage.getItem(LAST_RELEASE_SYNC_KEY);
    const now = Date.now();

    if (lastSyncRaw) {
      const lastSyncTime = parseInt(lastSyncRaw, 10);
      if (!isNaN(lastSyncTime) && now - lastSyncTime < RELEASE_SYNC_INTERVAL_MS) {
        return { syncedMovies: [], isSyncPerformed: false };
      }
    }

    if (userId) {
      try {
        await purgeNonNigerianMoviesFromFirestore();
      } catch {
        // Non-fatal cleanup failure
      }
    }

    const freshMovies = await bulkSyncNigerianNewReleases(undefined, onProgress, existingMovies, undefined, userId);
    const verifiedFresh = freshMovies.filter(isNigerianMovie);
    const sanitizedFresh = verifiedFresh.map(movie => sanitizeAndTagMovie(sanitizeMovie(movie)) as Movie);

    localStorage.setItem(LAST_RELEASE_SYNC_KEY, now.toString());

    return { syncedMovies: sanitizedFresh, isSyncPerformed: true };
  } catch (err) {
    console.warn('Automated daily sync encountered an issue:', err);
    return { syncedMovies: [], isSyncPerformed: false };
  }
}
