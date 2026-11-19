import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { User } from 'firebase/auth';
import {
  subscribeToCustomMovies,
  subscribeToReviews,
  addFirestoreReview,
  deleteFirestoreReview,
  saveFirestoreCustomMovie,
  saveMultipleFirestoreMovies,
  updateFirestoreMovie
} from '../lib/firestoreService';
import {
  checkAndRunDailySync,
  runDeepHistoricalSweep,
  HistoricalSweepProgress
} from '../utils/api';
import { sanitizeAndTagMovie } from '../utils/sanitizeAndTagMovie';
import { sanitizeAndAlignMovieMetadata } from '../utils/validation';
import {
  MOVIES_BATCH_SIZE,
  INITIAL_FILTER_STATE,
  normalizeCatalogMovies,
  applyCollectionFilterUpdate,
  filterAndSortCatalogMovies,
  paginateCatalogMovies,
} from '../utils/catalogHelpers';
import type { FilterState, Movie, UserReview, UserTrackedItem } from '../types';

export { INITIAL_FILTER_STATE, MOVIES_BATCH_SIZE };

const REVIEWS_STORAGE_KEY = 'afromoviedb_user_reviews_v1';
const EMPTY_WATCHLIST: string[] = [];
const EMPTY_TRACKING_MAP = new Map<string, UserTrackedItem>();

export interface UseMovieCatalogOptions {
  currentUser?: User | null;
  isAuthReady?: boolean;
  watchlistIds?: string[];
  trackingMap?: Map<string, UserTrackedItem>;
  reviews?: UserReview[];
  onSyncNotice?: (message: string | null, durationMs?: number) => void;
}

export interface UseMovieCatalogResult {
  movies: Movie[];
  loadingMovies: boolean;
  isCatalogReady: boolean;
  isCatalogInitializationComplete: boolean;
  catalogLoadError: string | null;
  filteredMovies: Movie[];
  displayedMovies: Movie[];
  featuredMovies: Movie[];
  hasMore: boolean;
  loadMore: () => void;
  remainingCount: number;
  batchSize: number;
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  activeCollection: string;
  setActiveCollection: React.Dispatch<React.SetStateAction<string>>;
  handleCollectionSelect: (collId: string) => void;
  isSyncingReleases: boolean;
  dailySyncNotice: string | null;
  reviews: UserReview[];
  addReview: (newRev: Omit<UserReview, 'id' | 'createdAt'>) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  publishMovie: (newMovie: Movie) => Promise<Movie>;
  updateMovie: (updatedMovie: Movie, onOptimisticMovie?: (safe: Movie) => void) => Promise<Movie>;
  isSweeping: boolean;
  isFinishingSweep: boolean;
  sweepProgress: HistoricalSweepProgress | null;
  triggerHistoricalSweep: () => Promise<void>;
  finishHistoricalSweep: () => void;
}

export function useMovieCatalog(options: UseMovieCatalogOptions = {}): UseMovieCatalogResult {
  const {
    currentUser = null,
    isAuthReady = false,
    watchlistIds = EMPTY_WATCHLIST,
    trackingMap = EMPTY_TRACKING_MAP,
    reviews: reviewsOverride,
    onSyncNotice,
  } = options;

  // Master catalog: Firestore custom_movies snapshot is the single source of truth
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isCatalogReady, setIsCatalogReady] = useState(false);
  const [isCatalogInitializationComplete, setIsCatalogInitializationComplete] = useState(false);
  const [catalogLoadError, setCatalogLoadError] = useState<string | null>(null);

  // User reviews state (loaded from Firestore/localStorage)
  const [internalReviews, setInternalReviews] = useState<UserReview[]>(() => {
    try {
      const saved =
        localStorage.getItem(REVIEWS_STORAGE_KEY) ||
        localStorage.getItem('naijareel_user_reviews_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  const reviews = reviewsOverride ?? internalReviews;

  // Filters & curated collections state
  const [filterState, setFilterState] = useState<FilterState>(INITIAL_FILTER_STATE);
  const [activeCollection, setActiveCollection] = useState<string>('all');

  // Batch pagination state (Fixed batches of 12 items, no infinite scroll)
  const [displayedMoviesCount, setDisplayedMoviesCount] = useState<number>(MOVIES_BATCH_SIZE);

  // Background daily sync state
  const [isSyncingReleases, setIsSyncingReleases] = useState(false);
  const [dailySyncNotice, setDailySyncNotice] = useState<string | null>(null);
  const dailySyncStarted = useRef(false);

  // Deep Historical Archive Sweep state
  const [isSweeping, setIsSweeping] = useState(false);
  const [isFinishingSweep, setIsFinishingSweep] = useState(false);
  const [sweepProgress, setSweepProgress] = useState<HistoricalSweepProgress | null>(null);
  const sweepAbortController = useRef<AbortController | null>(null);

  const moviesRef = useRef<Movie[]>(movies);
  const currentUserRef = useRef<User | null>(currentUser);
  const onSyncNoticeRef = useRef(onSyncNotice);

  useEffect(() => {
    moviesRef.current = movies;
  }, [movies]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    onSyncNoticeRef.current = onSyncNotice;
  }, [onSyncNotice]);

  // Listen to Firestore Real-time Custom Movies (the exclusive single source of truth for the displayed catalog)
  useEffect(() => {
    let isMounted = true;
    const snapshotTimeout = window.setTimeout(() => {
      if (!isMounted) return;
      setMovies((curr) => {
        if (curr.length === 0) {
          setCatalogLoadError(
            'Firestore has not returned a live catalog snapshot. Enable Cloud Firestore for the selected Firebase project and check its database access rules.'
          );
        }
        return curr;
      });
      setIsCatalogReady(true);
      setIsCatalogInitializationComplete(true);
    }, 15000);

    const unsubscribe = subscribeToCustomMovies(
      (cloudMovies, fromCache) => {
        const sanitizedCloud = normalizeCatalogMovies(cloudMovies);
        setMovies(sanitizedCloud);
        if (sanitizedCloud.length > 0 || !fromCache) {
          window.clearTimeout(snapshotTimeout);
          setIsCatalogReady(true);
          setIsCatalogInitializationComplete(true);
          setCatalogLoadError(null);
        }
      },
      (error) => {
        window.clearTimeout(snapshotTimeout);
        setMovies((curr) => {
          if (curr.length === 0) {
            setCatalogLoadError(error.message || 'Could not connect to the Firestore movie catalog.');
          }
          return curr;
        });
        setIsCatalogReady(true);
        setIsCatalogInitializationComplete(true);
      }
    );

    return () => {
      isMounted = false;
      window.clearTimeout(snapshotTimeout);
      unsubscribe();
    };
  }, []);

  // Listen to Firestore Real-time Reviews
  useEffect(() => {
    const unsubscribe = subscribeToReviews((cloudReviews) => {
      setInternalReviews(cloudReviews || []);
    });
    return () => unsubscribe();
  }, []);

  // Automated daily sync runs only for authenticated curators/users
  useEffect(() => {
    if (
      !currentUser ||
      !isCatalogReady ||
      !isCatalogInitializationComplete ||
      !isAuthReady ||
      catalogLoadError ||
      dailySyncStarted.current
    ) {
      return;
    }

    dailySyncStarted.current = true;
    let isMounted = true;

    const notify = (msg: string | null, durationMs?: number) => {
      setDailySyncNotice(msg);
      onSyncNoticeRef.current?.(msg, durationMs);
      if (msg && durationMs && !onSyncNoticeRef.current) {
        window.setTimeout(() => {
          if (isMounted) setDailySyncNotice((curr) => (curr === msg ? null : curr));
        }, durationMs);
      }
    };

    const runAutomatedDailySync = async () => {
      try {
        const result = await checkAndRunDailySync(
          moviesRef.current,
          (count: number, total: number) => {
            if (isMounted) {
              setIsSyncingReleases(true);
              notify(`Auto-syncing NaijaReel with fresh Nigerian releases (${count}/${total})...`);
            }
          },
          currentUser.uid
        );

        if (!isMounted) return;

        if (result.isSyncPerformed && result.syncedMovies.length > 0) {
          notify(
            `NaijaReel automatically updated with ${result.syncedMovies.length} fresh Nollywood releases!`,
            4500
          );
        }
      } catch (err) {
        console.warn('Background daily sync encountered an issue:', err);
      } finally {
        if (isMounted) {
          setIsSyncingReleases(false);
        }
      }
    };

    runAutomatedDailySync();

    return () => {
      isMounted = false;
    };
  }, [currentUser, isAuthReady, isCatalogReady, isCatalogInitializationComplete, catalogLoadError]);

  // Cleanup any in-flight historical sweep on unmount
  useEffect(() => () => {
    sweepAbortController.current?.abort();
  }, []);

  // Add auto-pulled or manually created movie handler - Direct Global Firestore Sync
  const publishMovie = useCallback(async (newMovie: Movie): Promise<Movie> => {
    const movieWithDefaultCollection = sanitizeAndAlignMovieMetadata(
      sanitizeAndTagMovie(newMovie) as Movie
    );
    try {
      await saveFirestoreCustomMovie(
        movieWithDefaultCollection,
        currentUserRef.current?.uid || 'community-contributor'
      );
      onSyncNoticeRef.current?.(
        `"${movieWithDefaultCollection.title}" published to global Nollywood catalogue!`,
        4500
      );
    } catch (err) {
      console.error('Could not sync movie to Firestore:', err);
      onSyncNoticeRef.current?.(
        `Failed to publish "${movieWithDefaultCollection.title}" to Firestore.`,
        4500
      );
    }
    return movieWithDefaultCollection;
  }, []);

  // Update movie details handler (saves directly to Firebase Firestore with real-time UI synchronization)
  const updateMovie = useCallback(
    async (
      updatedMovie: Movie,
      onOptimisticMovie?: (safeMovie: Movie) => void
    ): Promise<Movie> => {
      const safeUpdatedMovie = sanitizeAndAlignMovieMetadata(
        sanitizeAndTagMovie(updatedMovie) as Movie
      );
      onOptimisticMovie?.(safeUpdatedMovie);

      try {
        await updateFirestoreMovie(
          safeUpdatedMovie,
          currentUserRef.current?.uid || 'community-editor'
        );
        onSyncNoticeRef.current?.(
          `Updated "${safeUpdatedMovie.title}" and saved to Firebase Firestore!`,
          4500
        );
        return safeUpdatedMovie;
      } catch (err) {
        console.error('Error saving movie updates to Firestore:', err);
        throw err;
      }
    },
    []
  );

  // Add review handler (syncs securely to Firestore and falls back to local storage)
  const addReview = useCallback(async (newRev: Omit<UserReview, 'id' | 'createdAt'>) => {
    const fullReview: UserReview = {
      ...newRev,
      id: 'usr-rev-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };

    setInternalReviews((prev) => [fullReview, ...prev]);

    try {
      const saved = localStorage.getItem(REVIEWS_STORAGE_KEY);
      const userAdded = saved ? JSON.parse(saved) : [];
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify([fullReview, ...userAdded]));
    } catch (e) {
      console.error('Failed to save review locally', e);
    }

    const activeUser = currentUserRef.current;
    if (activeUser) {
      try {
        await addFirestoreReview({
          ...newRev,
          userId: activeUser.uid,
          userEmail: activeUser.email || undefined,
        });
      } catch (err) {
        console.warn('Firestore review sync failed (saved locally):', err);
      }
    }
  }, []);

  // Delete review handler (deletes from Firestore and local storage)
  const deleteReview = useCallback(async (reviewId: string) => {
    setInternalReviews((prev) => prev.filter((r) => r.id !== reviewId));

    try {
      const saved = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (saved) {
        const parsed: UserReview[] = JSON.parse(saved);
        localStorage.setItem(
          REVIEWS_STORAGE_KEY,
          JSON.stringify(parsed.filter((r) => r.id !== reviewId))
        );
      }
    } catch (e) {
      console.error('Failed to update local reviews', e);
    }

    if (currentUserRef.current) {
      try {
        await deleteFirestoreReview(reviewId);
      } catch (err) {
        console.warn('Failed to delete review from Firestore:', err);
      }
    }
  }, []);

  // Multi-decade historical import sweep (1990s to 2020s with direct Firestore batch writes)
  const triggerHistoricalSweep = useCallback(async () => {
    if (sweepAbortController.current) return;
    const controller = new AbortController();
    sweepAbortController.current = controller;
    setIsSweeping(true);
    setIsFinishingSweep(false);
    setSweepProgress(null);

    let collectedMovies: Movie[] = [];

    try {
      const result = await runDeepHistoricalSweep(
        moviesRef.current,
        (progress) => {
          setSweepProgress(progress);
        },
        undefined,
        controller.signal
      );

      collectedMovies = result.newMovies || [];
    } catch (err) {
      if (!controller.signal.aborted) {
        console.error('Historical sweep error:', err);
      }
    }

    if (collectedMovies.length > 0) {
      setSweepProgress((progress) => ({
        decadeLabel: 'Exporting',
        page: progress?.page || 1,
        totalPages: progress?.totalPages || 20,
        importedCount: collectedMovies.length,
        percent: 100,
        isComplete: false,
        isCancelled: false,
        isSaving: true,
        firestoreSaveStarted: true,
        statusText: `Exporting ${collectedMovies.length} swept classic films to Cloud Firestore…`,
      }));

      try {
        await saveMultipleFirestoreMovies(
          collectedMovies,
          currentUserRef.current?.uid || 'community-sweep'
        );
      } catch (err) {
        console.warn('Batch write of swept movies encountered an issue:', err);
      }

      setSweepProgress({
        decadeLabel: 'Complete',
        page: 20,
        totalPages: 20,
        importedCount: collectedMovies.length,
        percent: 100,
        isComplete: true,
        isCancelled: false,
        isSaving: false,
        firestoreSaveStarted: false,
        statusText: `Finished! Successfully saved ${collectedMovies.length} classic films to Cloud Firestore.`,
      });

      onSyncNoticeRef.current?.(
        `Published ${collectedMovies.length} classic films directly to Cloud Firestore!`,
        5000
      );
    } else {
      setSweepProgress({
        decadeLabel: 'Complete',
        page: 20,
        totalPages: 20,
        importedCount: 0,
        percent: 100,
        isComplete: true,
        isCancelled: false,
        isSaving: false,
        firestoreSaveStarted: false,
        statusText: 'Finished! No new unique Nigerian films were found to import.',
      });
    }

    if (sweepAbortController.current === controller) {
      sweepAbortController.current = null;
    }
    setIsSweeping(false);
    setIsFinishingSweep(false);
  }, []);

  const finishHistoricalSweep = useCallback(() => {
    const controller = sweepAbortController.current;
    if (!controller || controller.signal.aborted) return;
    setIsFinishingSweep(true);
    controller.abort();
  }, []);

  // Quick Collections handler
  const handleCollectionSelect = useCallback((collId: string) => {
    setActiveCollection(collId);
    setFilterState((prev) => applyCollectionFilterUpdate(prev, collId));
  }, []);

  const resetFilters = useCallback(() => {
    setFilterState(INITIAL_FILTER_STATE);
  }, []);

  // Filter and sort movies
  const filteredMovies = useMemo(
    () =>
      filterAndSortCatalogMovies(movies, {
        filterState,
        activeCollection,
        watchlistIds,
        trackingMap,
        reviews,
      }),
    [filterState, watchlistIds, movies, activeCollection, trackingMap, reviews]
  );

  // Reset pagination whenever filters or active collection change
  useEffect(() => {
    setDisplayedMoviesCount(MOVIES_BATCH_SIZE);
  }, [filterState, activeCollection]);

  const { displayedMovies, hasMore, remainingCount } = useMemo(
    () => paginateCatalogMovies(filteredMovies, displayedMoviesCount),
    [filteredMovies, displayedMoviesCount]
  );

  const loadMore = useCallback(() => {
    setDisplayedMoviesCount((prev) => prev + MOVIES_BATCH_SIZE);
  }, []);

  const featuredMovies = useMemo(() => {
    return movies.filter((m) => m.featured);
  }, [movies]);

  return {
    movies,
    loadingMovies: !isCatalogReady,
    isCatalogReady,
    isCatalogInitializationComplete,
    catalogLoadError,
    filteredMovies,
    displayedMovies,
    featuredMovies,
    hasMore,
    loadMore,
    remainingCount,
    batchSize: MOVIES_BATCH_SIZE,
    filterState,
    setFilterState,
    resetFilters,
    activeCollection,
    setActiveCollection,
    handleCollectionSelect,
    isSyncingReleases,
    dailySyncNotice,
    reviews,
    addReview,
    deleteReview,
    publishMovie,
    updateMovie,
    isSweeping,
    isFinishingSweep,
    sweepProgress,
    triggerHistoricalSweep,
    finishHistoricalSweep,
  };
}

