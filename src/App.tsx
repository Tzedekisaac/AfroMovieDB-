import React, { useState, useEffect, useMemo, useRef } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { 
  subscribeToUserWatchlist, 
  subscribeToUserData,
  saveUserTrackingList,
  saveUserWatchlist, 
  saveUserApiKey,
  removeUserApiKey,
  saveUserTheme,
  subscribeToUserCustomLists,
  getCustomListById,
  saveCustomList,
  deleteCustomList,
  subscribeToReviews, 
  addFirestoreReview, 
  deleteFirestoreReview,
  subscribeToCustomMovies, 
  initializeFirestoreMovieCatalog,
  saveFirestoreCustomMovie, 
  saveMultipleFirestoreMovies,
  updateFirestoreMovie 
} from './lib/firestoreService';
import { 
  bulkSyncNigerianNewReleases, 
  checkAndRunDailySync,
  runDeepHistoricalSweep,
  setCustomTmdbKey,
  pullMovieDetailsFromOnline,
  HistoricalSweepProgress,
  sanitizeMovie
} from './utils/api';
import { NIGERIAN_MOVIES, INITIAL_REVIEWS } from './data/movies';
import { Movie, FilterState, UserReview, UserTrackedItem, MovieWatchStatus, AppTheme, CustomUserList } from './types';
import { DEFAULT_MOVIE_COLLECTION } from './utils/movieCollections';
import { sanitizeAndTagMovie } from './utils/sanitizeAndTagMovie';
import { Navbar } from './components/Navbar';
import { HeroSpotlight } from './components/HeroSpotlight';
import { CatalogueFilters } from './components/CatalogueFilters';
import { MovieCard } from './components/MovieCard';
import { MovieDetailModal } from './components/MovieDetailModal';
import { EditMovieModal } from './components/EditMovieModal';
import { TrailerModal } from './components/TrailerModal';
import { WatchlistModal } from './components/WatchlistModal';
import { HeritageModal } from './components/HeritageModal';
import { AddMovieModal } from './components/AddMovieModal';
import { AuthModal } from './components/AuthModal';
import { UserProfilePage } from './components/UserProfilePage';
import { StandaloneListView } from './components/StandaloneListView';
import { CustomListModal } from './components/CustomListModal';
import { HistoricalSweepPill } from './components/HistoricalSweepPill';
import { Footer } from './components/Footer';
import { SiteInfoModal, type SiteInfoPage } from './components/SiteInfoModal';
import { 
  Sparkles, Flame, Award, Film, Bookmark, 
  RotateCcw, SlidersHorizontal, Search, Clapperboard, Plus, RefreshCw, CheckCircle2, ChevronDown 
} from 'lucide-react';

const WATCHLIST_STORAGE_KEY = 'afromoviedb_watchlist_ids_v1';
const TRACKING_STORAGE_KEY = 'afromoviedb_tracking_list_v1';
const REVIEWS_STORAGE_KEY = 'afromoviedb_user_reviews_v1';

export default function App() {
  // Navigation View State: 'catalogue' or dedicated 'profile'
  const [currentView, setCurrentView] = useState<'catalogue' | 'profile'>('catalogue');

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Catalog state is populated exclusively from the Firestore custom_movies snapshot.
  const [isCatalogReady, setIsCatalogReady] = useState(false);
  const [isCatalogInitializationComplete, setIsCatalogInitializationComplete] = useState(false);
  const [catalogLoadError, setCatalogLoadError] = useState<string | null>(null);

  // Bulk sync state
  const [isSyncingReleases, setIsSyncingReleases] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Master catalog: Firestore is the source of truth; the curated starter list is seeded there once.
  const [moviesList, setMoviesList] = useState<Movie[]>([]);

  // Filters State
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    selectedGenre: 'All',
    selectedLanguage: 'All',
    selectedEra: 'All',
    selectedPlatform: 'All',
    sortBy: 'rating',
    watchlistOnly: false
  });

  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  // Watchlist State (loaded from localStorage initially, synced to Firestore when user logs in)
  const [watchlistIds, setWatchlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY) || localStorage.getItem('naijareel_watchlist_ids_v1');
      return saved ? JSON.parse(saved) : ['a-tribe-called-judah', 'the-black-book', 'anikulapo'];
    } catch {
      return ['a-tribe-called-judah', 'the-black-book', 'anikulapo'];
    }
  });

  // Multi-Status Tracking System State (Plan to Watch, Watching, Completed, On Hold, Dropped)
  const [trackingList, setTrackingList] = useState<UserTrackedItem[]>(() => {
    try {
      const saved = localStorage.getItem(TRACKING_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Custom TMDb API key stored securely in Firestore
  const [customTmdbApiKey, setCustomTmdbApiKey] = useState<string | undefined>(undefined);

  // Theme & Accent Customization (Nigerian Emerald, Royal Gold, Deep Obsidian)
  const [activeTheme, setActiveTheme] = useState<AppTheme>(() => {
    try {
      const savedTheme = localStorage.getItem('afromoviedb_theme_v1') as AppTheme;
      return savedTheme && ['emerald', 'gold', 'obsidian'].includes(savedTheme) ? savedTheme : 'emerald';
    } catch {
      return 'emerald';
    }
  });

  // Custom Curated User Lists
  const [userCustomLists, setUserCustomLists] = useState<CustomUserList[]>([]);
  const [activeStandaloneList, setActiveStandaloneList] = useState<CustomUserList | null>(null);
  const [isCustomListModalOpen, setIsCustomListModalOpen] = useState(false);
  const [editingCustomList, setEditingCustomList] = useState<CustomUserList | null>(null);

  // Deep Historical Archive Sweep state
  const [isSweeping, setIsSweeping] = useState(false);
  const [isCancellingSweep, setIsCancellingSweep] = useState(false);
  const [sweepProgress, setSweepProgress] = useState<HistoricalSweepProgress | null>(null);
  const [showSweepPill, setShowSweepPill] = useState(true);
  const sweepAbortController = useRef<AbortController | null>(null);
  const dailySyncStarted = useRef(false);

  // User reviews state (seeded from INITIAL_REVIEWS + Firestore/localStorage)
  const [reviews, setReviews] = useState<UserReview[]>(() => {
    try {
      const saved = localStorage.getItem(REVIEWS_STORAGE_KEY) || localStorage.getItem('naijareel_user_reviews_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...INITIAL_REVIEWS, ...parsed];
      }
    } catch {
      // fallback
    }
    return INITIAL_REVIEWS;
  });

  // Modal states
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [trailerMovie, setTrailerMovie] = useState<Movie | null>(null);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isHeritageOpen, setIsHeritageOpen] = useState(false);
  const [isAutoPullOpen, setIsAutoPullOpen] = useState(false);
  const [activeSiteInfoPage, setActiveSiteInfoPage] = useState<SiteInfoPage | null>(null);

  // Quick collections shortcut selection
  const [activeCollection, setActiveCollection] = useState<string>('all');

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firestore real-time User Data (trackingList, watchlist, custom TMDb API key, theme)
  useEffect(() => {
    if (!currentUser) {
      setCustomTmdbApiKey(undefined);
      setCustomTmdbKey(null);
      return;
    }

    const unsubscribe = subscribeToUserData(currentUser.uid, (data) => {
      if (data.trackingList) {
        setTrackingList(data.trackingList);
      }
      if (data.watchlist && data.watchlist.length > 0) {
        setWatchlistIds(prev => Array.from(new Set([...data.watchlist, ...prev])));
      }
      if (data.customTmdbApiKey) {
        setCustomTmdbApiKey(data.customTmdbApiKey);
        setCustomTmdbKey(data.customTmdbApiKey);
      } else {
        setCustomTmdbApiKey(undefined);
        setCustomTmdbKey(null);
      }
      if (data.theme && ['emerald', 'gold', 'obsidian'].includes(data.theme)) {
        setActiveTheme(data.theme);
        try {
          localStorage.setItem('afromoviedb_theme_v1', data.theme);
        } catch {}
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Listen to user's custom created lists
  useEffect(() => {
    if (!currentUser) {
      setUserCustomLists([]);
      return;
    }

    const unsubscribe = subscribeToUserCustomLists(currentUser.uid, (lists) => {
      setUserCustomLists(lists);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Listen to Firestore Real-time Reviews
  useEffect(() => {
    const unsubscribe = subscribeToReviews((cloudReviews) => {
      if (cloudReviews.length > 0) {
        setReviews(prev => {
          const cloudIds = new Set(cloudReviews.map(r => r.id));
          const baseFiltered = INITIAL_REVIEWS.filter(r => !cloudIds.has(r.id));
          return [...cloudReviews, ...baseFiltered];
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firestore Real-time Custom Movies (the sole source for the displayed catalog).
  useEffect(() => {
    let isMounted = true;
    const snapshotTimeout = window.setTimeout(() => {
      if (!isMounted) return;
      setCatalogLoadError('Firestore has not returned a live catalog snapshot. Enable Cloud Firestore for the selected Firebase project and check its database access rules.');
      setIsCatalogReady(true);
    }, 15000);

    const unsubscribe = subscribeToCustomMovies((cloudMovies, fromCache) => {
      const sanitizedCloud = (cloudMovies || []).map((movie) => sanitizeAndTagMovie(sanitizeMovie(movie)) as Movie);
      setMoviesList(sanitizedCloud);
      if (!fromCache) {
        window.clearTimeout(snapshotTimeout);
        setIsCatalogReady(true);
        setCatalogLoadError(null);
      }
      setSelectedMovie(curr => {
        if (!curr) return null;
        const match = sanitizedCloud.find(m => m.id === curr.id);
        return match || curr;
      });
    }, (error) => {
      window.clearTimeout(snapshotTimeout);
      setCatalogLoadError(error.message || 'Could not connect to the Firestore movie catalog.');
      setIsCatalogReady(true);
    });

    initializeFirestoreMovieCatalog(NIGERIAN_MOVIES)
      .then(({ migratedCount, seededCount }) => {
        if (migratedCount > 0 || seededCount > 0) {
          console.info(`Firestore catalog initialized: ${migratedCount} movies tagged, ${seededCount} starter movies seeded.`);
        }
      })
      .catch((error) => {
        console.error('Could not initialize the Firestore movie catalog:', error);
        if (isMounted) {
          setCatalogLoadError(error instanceof Error ? error.message : 'Could not initialize the Firestore movie catalog.');
        }
      })
      .finally(() => {
        if (isMounted) setIsCatalogInitializationComplete(true);
      });

    return () => {
      isMounted = false;
      window.clearTimeout(snapshotTimeout);
      unsubscribe();
    };
  }, []);

  // Add auto-pulled or manually created movie handler - Direct Global Firestore Sync
  const handleMoviePulled = async (newMovie: Movie) => {
    const movieWithDefaultCollection = sanitizeAndTagMovie(newMovie) as Movie;
    // Direct real-time write to Firebase Firestore custom_movies collection
    try {
      await saveFirestoreCustomMovie(movieWithDefaultCollection, currentUser?.uid || 'community-contributor');
      setSyncNotice(`"${movieWithDefaultCollection.title}" published to global Nollywood catalogue!`);
      setTimeout(() => setSyncNotice(null), 4500);
    } catch (err) {
      console.error('Could not sync movie to Firestore:', err);
      setSyncNotice(`Failed to publish "${movieWithDefaultCollection.title}" to Firestore.`);
      setTimeout(() => setSyncNotice(null), 4500);
    }

    // Auto select the new movie to show details
    setSelectedMovie(movieWithDefaultCollection);
  };

  // Update movie details handler (saves directly to Firebase Firestore with real-time UI synchronization)
  const handleUpdateMovie = async (updatedMovie: Movie) => {
    const safeUpdatedMovie = sanitizeAndTagMovie(updatedMovie) as Movie;
    // Synchronize selected movie modal & trailer modal in real time
    if (selectedMovie?.id === safeUpdatedMovie.id) {
      setSelectedMovie(safeUpdatedMovie);
    }
    if (trailerMovie?.id === safeUpdatedMovie.id) {
      setTrailerMovie(safeUpdatedMovie);
    }

    // Direct write to Firebase Firestore custom_movies
    try {
      await updateFirestoreMovie(safeUpdatedMovie, currentUser?.uid || 'community-editor');
      setSyncNotice(`Updated "${safeUpdatedMovie.title}" and saved to Firebase Firestore!`);
      setTimeout(() => setSyncNotice(null), 4500);
    } catch (err) {
      console.error('Error saving movie updates to Firestore:', err);
      throw err;
    }
  };

  // Save watchlist to localStorage AND sync to Firebase Firestore if logged in
  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlistIds));
    } catch (e) {
      console.error('Failed to save watchlist', e);
    }

    if (currentUser) {
      saveUserWatchlist(currentUser.uid, watchlistIds).catch(err => {
        console.warn('Failed to sync watchlist to Firestore:', err);
      });
    }
  }, [watchlistIds, currentUser]);

  // Check URL query parameter (?movie=id) to auto-open shared film link
  useEffect(() => {
    let isCancelled = false;
    try {
      const params = new URLSearchParams(window.location.search);
      const sharedMovieId = params.get('movie');
      if (sharedMovieId) {
        const found = moviesList.find(m => m.id === sharedMovieId);
        if (found) {
          setSelectedMovie(found);
        } else {
          // If the shared link references an online TMDb ID, resolve it automatically
          const tmdbIdNum = parseInt(sharedMovieId.replace(/^tmdb-/, ''), 10);
          if (!isNaN(tmdbIdNum) && tmdbIdNum > 0) {
            pullMovieDetailsFromOnline({
              tmdbId: tmdbIdNum,
              title: 'Nollywood Film',
              releaseYear: new Date().getFullYear(),
              overview: '',
              posterUrl: '',
              backdropUrl: '',
              rating: 8.0,
              ratingCount: 10,
              genreIds: [],
              popularity: 1
            }).then(async loadedMovie => {
              if (!isCancelled && loadedMovie) {
                const safeMovie = sanitizeAndTagMovie(loadedMovie) as Movie;
                await saveFirestoreCustomMovie(safeMovie);
                if (!isCancelled) setSelectedMovie(safeMovie);
              }
            }).catch(e => console.warn('Could not auto-resolve shared online movie', e));
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse shared movie URL', e);
    }
    return () => {
      isCancelled = true;
    };
  }, [moviesList]);

  // Fast status lookup map for catalogue cards
  const trackingMap = useMemo(() => {
    const map = new Map<string, UserTrackedItem>();
    trackingList.forEach(item => map.set(item.movieId, item));
    return map;
  }, [trackingList]);

  // Update multi-status tracking (Plan to Watch, Watching, Completed, On Hold, Dropped, or un-track)
  const handleUpdateTrackingStatus = async (movieId: string, status: MovieWatchStatus | null) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    let updatedList: UserTrackedItem[];

    if (!status) {
      updatedList = trackingList.filter(t => t.movieId !== movieId);
      setWatchlistIds(prev => prev.filter(id => id !== movieId));
    } else {
      const existing = trackingList.find(t => t.movieId === movieId);
      if (existing) {
        updatedList = trackingList.map(t => 
          t.movieId === movieId 
            ? { ...t, status, updatedAt: new Date().toISOString() } 
            : t
        );
      } else {
        updatedList = [
          ...trackingList, 
          { 
            movieId, 
            status, 
            rewatchCount: 0, 
            updatedAt: new Date().toISOString() 
          }
        ];
      }
      // Keep watchlistIds synced for backward compatibility
      setWatchlistIds(prev => prev.includes(movieId) ? prev : [...prev, movieId]);
    }

    setTrackingList(updatedList);
    try {
      localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Failed to cache tracking list locally:', e);
    }

    if (currentUser) {
      try {
        await saveUserTrackingList(currentUser.uid, updatedList);
      } catch (err) {
        console.warn('Failed to sync tracking list to Firestore:', err);
      }
    }
  };

  // Rewatch counter updater for completed films
  const handleUpdateRewatchCount = async (movieId: string, count: number) => {
    const safeCount = Math.max(0, count);
    const updatedList = trackingList.map(t => 
      t.movieId === movieId 
        ? { ...t, rewatchCount: safeCount, updatedAt: new Date().toISOString() } 
        : t
    );

    setTrackingList(updatedList);
    try {
      localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Failed to cache tracking list locally:', e);
    }

    if (currentUser) {
      try {
        await saveUserTrackingList(currentUser.uid, updatedList);
      } catch (err) {
        console.warn('Failed to sync rewatch count to Firestore:', err);
      }
    }
  };

  // Save personal external API key (TMDb) to user profile in Firestore
  const handleSaveApiKey = async (apiKey: string) => {
    if (!currentUser) return;
    try {
      await saveUserApiKey(currentUser.uid, apiKey);
      setCustomTmdbApiKey(apiKey);
      setCustomTmdbKey(apiKey);
      setSyncNotice('Custom TMDb API Key saved securely to your profile!');
      setTimeout(() => setSyncNotice(null), 4500);
    } catch (err) {
      console.error('Failed to save API key to Firestore:', err);
      throw err;
    }
  };

  // Remove personal external API key from user profile in Firestore
  const handleRemoveApiKey = async () => {
    if (!currentUser) return;
    try {
      await removeUserApiKey(currentUser.uid);
      setCustomTmdbApiKey(undefined);
      setCustomTmdbKey(null);
      setSyncNotice('Custom TMDb API Key removed. Reverted to shared key.');
      setTimeout(() => setSyncNotice(null), 4500);
    } catch (err) {
      console.error('Failed to remove API key from Firestore:', err);
      throw err;
    }
  };

  // Theme switch handler with immediate UI persistence & Firestore sync
  const handleSelectTheme = async (newTheme: AppTheme) => {
    setActiveTheme(newTheme);
    try {
      localStorage.setItem('afromoviedb_theme_v1', newTheme);
    } catch (e) {}

    if (currentUser) {
      try {
        await saveUserTheme(currentUser.uid, newTheme);
      } catch (err) {
        console.warn('Failed to sync theme preference to Firestore:', err);
      }
    }

    const themeName = newTheme === 'emerald' ? 'Nigerian Emerald' : newTheme === 'gold' ? 'Royal Gold' : 'Deep Obsidian';
    setSyncNotice(`Switched theme to ${themeName}!`);
    setTimeout(() => setSyncNotice(null), 3000);
  };

  // Save / Update custom themed collection in Firestore
  const handleSaveCustomList = async (list: CustomUserList) => {
    if (!currentUser) return;
    try {
      await saveCustomList(list, currentUser.uid);
      setUserCustomLists(prev => {
        const filtered = prev.filter(l => l.id !== list.id);
        return [list, ...filtered];
      });
      setSyncNotice(`Collection "${list.title}" published successfully!`);
      setTimeout(() => setSyncNotice(null), 4500);
    } catch (err) {
      console.error('Failed to save custom collection:', err);
      throw err;
    }
  };

  // Delete custom collection from Firestore
  const handleDeleteCustomList = async (listId: string) => {
    try {
      await deleteCustomList(listId);
      setUserCustomLists(prev => prev.filter(l => l.id !== listId));
      if (activeStandaloneList?.id === listId) {
        setActiveStandaloneList(null);
      }
      setSyncNotice('Collection removed.');
      setTimeout(() => setSyncNotice(null), 3500);
    } catch (err) {
      console.error('Failed to delete custom collection:', err);
    }
  };

  // Handle closing standalone list and removing ?list from URL
  const handleCloseStandaloneList = () => {
    setActiveStandaloneList(null);
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('list')) {
        url.searchParams.delete('list');
        const cleanUrl = url.pathname + (url.search ? url.search : '') + url.hash;
        window.history.replaceState({}, '', cleanUrl);
      }
    } catch (e) {}
  };

  // Check URL query parameter (?list=id) to auto-open standalone collection view
  useEffect(() => {
    let isCancelled = false;
    try {
      const params = new URLSearchParams(window.location.search);
      const sharedListId = params.get('list');
      if (sharedListId) {
        const found = userCustomLists.find(l => l.id === sharedListId);
        if (found) {
          setActiveStandaloneList(found);
        } else {
          getCustomListById(sharedListId).then(loadedList => {
            if (!isCancelled && loadedList) {
              setActiveStandaloneList(loadedList);
            }
          }).catch(e => console.warn('Could not auto-resolve shared list', e));
        }
      }
    } catch (e) {
      console.error('Failed to parse shared list URL', e);
    }
    return () => {
      isCancelled = true;
    };
  }, [userCustomLists]);

  // Synchronize ?list=<id> in browser URL history when standalone list is active
  useEffect(() => {
    if (activeStandaloneList) {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get('list') !== activeStandaloneList.id) {
          url.searchParams.set('list', activeStandaloneList.id);
          window.history.pushState({ listId: activeStandaloneList.id }, '', url.toString());
        }
      } catch (e) {}
    }
  }, [activeStandaloneList?.id]);

  // Multi-decade historical import sweep (1990s to 2020s with direct Firestore batch writes)
  const handleTriggerHistoricalSweep = async () => {
    if (sweepAbortController.current) return;
    const controller = new AbortController();
    sweepAbortController.current = controller;
    setIsSweeping(true);
    setIsCancellingSweep(false);
    setSweepProgress(null);
    setShowSweepPill(true);

    try {
      const result = await runDeepHistoricalSweep(
        moviesList,
        setSweepProgress,
        20,
        controller.signal
      );

      if (result.cancelled || controller.signal.aborted) {
        if (controller.signal.aborted && !result.cancelled) {
          setSweepProgress((progress) => progress ? {
            ...progress,
            isComplete: false,
            isCancelled: true,
            statusText: `Historical sweep stopped. ${progress.importedCount} films were found; no Firestore save was started.`
          } : progress);
        }
        return;
      }

      if (result.newMovies.length > 0) {
        setSweepProgress((progress) => progress ? {
          ...progress,
          isSaving: true,
          firestoreSaveStarted: true,
          statusText: `Scan complete. Saving ${result.newMovies.length} classic films to Firestore…`
        } : progress);
        try {
          await saveMultipleFirestoreMovies(
            result.newMovies,
            currentUser?.uid || 'community-sweep',
            controller.signal
          );
        } catch (err) {
          if (controller.signal.aborted) {
            setSweepProgress((progress) => progress ? {
              ...progress,
              isComplete: false,
              isCancelled: true,
              isSaving: false,
              firestoreSaveStarted: true,
              statusText: `Scan stopped during the Firestore save. ${progress.importedCount} films were found; the current batch may have finished.`
            } : progress);
            return;
          }
          console.warn('Direct Firestore batch write for sweep encountered an issue:', err);
        }

        if (controller.signal.aborted) {
          setSweepProgress((progress) => progress ? {
            ...progress,
            isComplete: false,
            isCancelled: true,
            isSaving: false,
            firestoreSaveStarted: true,
            statusText: `Scan stopped during the Firestore save. ${progress.importedCount} films were found; completed batches may already be saved.`
          } : progress);
          return;
        }

        setSweepProgress((progress) => progress ? {
          ...progress,
          isSaving: false,
          firestoreSaveStarted: false
        } : progress);
        setSyncNotice(`Published ${result.newMovies.length} classic films directly to Cloud Firestore!`);
        setTimeout(() => setSyncNotice(null), 5000);
      }
    } catch (err) {
      if (controller.signal.aborted) {
        setSweepProgress((progress) => progress ? {
          ...progress,
          isComplete: false,
          isCancelled: true,
          isSaving: false,
          firestoreSaveStarted: false,
          statusText: `Historical sweep stopped. ${progress.importedCount} films were found.`
        } : progress);
      } else {
        console.error('Historical sweep error:', err);
      }
    } finally {
      if (sweepAbortController.current === controller) {
        sweepAbortController.current = null;
      }
      setIsSweeping(false);
      setIsCancellingSweep(false);
    }
  };

  const handleCancelHistoricalSweep = () => {
    const controller = sweepAbortController.current;
    if (!controller || controller.signal.aborted) return;
    setIsCancellingSweep(true);
    controller.abort();
  };

  useEffect(() => () => {
    sweepAbortController.current?.abort();
  }, []);

  // Toggle watchlist (Auth-gated)
  const handleToggleWatchlist = (movieId: string) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    const isCurrentlyTracked = watchlistIds.includes(movieId) || trackingMap.has(movieId);
    if (isCurrentlyTracked) {
      handleUpdateTrackingStatus(movieId, null);
    } else {
      handleUpdateTrackingStatus(movieId, 'plan_to_watch');
    }
  };

  const handleClearWatchlist = () => {
    setWatchlistIds([]);
  };

  // Add review handler (syncs securely to Firestore and falls back to local storage)
  const handleAddReview = async (newRev: Omit<UserReview, 'id' | 'createdAt'>) => {
    const fullReview: UserReview = {
      ...newRev,
      id: 'usr-rev-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0]
    };

    setReviews(prev => [fullReview, ...prev]);

    // Save to localStorage
    try {
      const saved = localStorage.getItem(REVIEWS_STORAGE_KEY);
      const userAdded = saved ? JSON.parse(saved) : [];
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify([fullReview, ...userAdded]));
    } catch (e) {
      console.error('Failed to save review locally', e);
    }

    // Sync to Firestore if logged in
    if (currentUser) {
      try {
        await addFirestoreReview({
          ...newRev,
          userId: currentUser.uid,
          userEmail: currentUser.email || undefined
        });
      } catch (err) {
        console.warn('Firestore review sync failed (saved locally):', err);
      }
    }
  };

  // Delete review handler (deletes from Firestore and local storage)
  const handleDeleteReview = async (reviewId: string) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId));

    try {
      const saved = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (saved) {
        const parsed: UserReview[] = JSON.parse(saved);
        localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(parsed.filter(r => r.id !== reviewId)));
      }
    } catch (e) {
      console.error('Failed to update local reviews', e);
    }

    if (currentUser) {
      try {
        await deleteFirestoreReview(reviewId);
      } catch (err) {
        console.warn('Failed to delete review from Firestore:', err);
      }
    }
  };

  // Automated daily background sync begins only after Firestore's initial read, seeding, and auth check.
  useEffect(() => {
    if (!isCatalogReady || !isCatalogInitializationComplete || !isAuthReady || catalogLoadError || dailySyncStarted.current) {
      return;
    }

    dailySyncStarted.current = true;
    let isMounted = true;

    const runAutomatedDailySync = async () => {
      try {
        const result = await checkAndRunDailySync(moviesList, (count: number, total: number) => {
          if (isMounted) {
            setIsSyncingReleases(true);
            setSyncNotice(`Auto-syncing NaijaReel with fresh Nigerian releases (${count}/${total})...`);
          }
        });

        if (!isMounted) return;

        if (result.isSyncPerformed && result.syncedMovies.length > 0) {
          // Direct real-time batch write to Firebase Firestore custom_movies collection
          try {
            await saveMultipleFirestoreMovies(result.syncedMovies, currentUser?.uid || 'community-sync');
          } catch (err) {
            console.warn('Direct Firestore batch write for auto-sync encountered an issue:', err);
          }

          setSyncNotice(`NaijaReel automatically updated with ${result.syncedMovies.length} fresh Nollywood releases!`);
          setTimeout(() => {
            if (isMounted) setSyncNotice(null);
          }, 4500);
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

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Watchlist movies objects
  const watchlistMovies = useMemo(() => {
    return moviesList.filter(m => watchlistIds.includes(m.id));
  }, [watchlistIds, moviesList]);

  // Quick Collections handler
  const handleCollectionSelect = (collId: string) => {
    setActiveCollection(collId);
    if (collId === 'all') {
      setFilterState(prev => ({
        ...prev,
        selectedGenre: 'All',
        selectedEra: 'All',
        selectedLanguage: 'All',
        selectedPlatform: 'All',
        watchlistOnly: false,
        sortBy: 'rating'
      }));
    } else if (collId === 'box-office') {
      setFilterState(prev => ({
        ...prev,
        selectedGenre: 'All',
        selectedEra: 'All',
        selectedLanguage: 'All',
        selectedPlatform: 'All',
        watchlistOnly: false,
        sortBy: 'box_office'
      }));
    } else if (collId === 'epics') {
      setFilterState(prev => ({
        ...prev,
        selectedGenre: 'Epic & Folklore',
        selectedEra: 'All',
        selectedLanguage: 'All',
        selectedPlatform: 'All',
        watchlistOnly: false,
        sortBy: 'rating'
      }));
    } else if (collId === 'golden-era') {
      setFilterState(prev => ({
        ...prev,
        selectedGenre: 'All',
        selectedEra: 'Golden Era (1992-2005)',
        selectedLanguage: 'All',
        selectedPlatform: 'All',
        watchlistOnly: false,
        sortBy: 'year_asc'
      }));
    } else if (collId === 'crime-heist') {
      setFilterState(prev => ({
        ...prev,
        selectedGenre: 'Crime & Thriller',
        selectedEra: 'All',
        selectedLanguage: 'All',
        selectedPlatform: 'All',
        watchlistOnly: false,
        sortBy: 'rating'
      }));
    } else if (collId === 'community') {
      setFilterState(prev => ({
        ...prev,
        selectedGenre: 'All',
        selectedEra: 'All',
        selectedLanguage: 'All',
        selectedPlatform: 'All',
        watchlistOnly: false,
        sortBy: 'year_desc'
      }));
    }
  };

  // Filter and sort movies
  const filteredMovies = useMemo(() => {
    return moviesList.filter(movie => {
      // "All" is intentionally not gated by collection tags or TMDb metadata:
      // every entry here came from the custom_movies Firestore snapshot.
      const selectedCollection = activeCollection.trim().toLowerCase();
      const allTitlesSelected = selectedCollection === 'all' ||
        selectedCollection === DEFAULT_MOVIE_COLLECTION.toLowerCase();

      // Community filter
      if (!allTitlesSelected && activeCollection === 'community' && !movie.isUserAdded) {
        return false;
      }

      // Watchlist filter
      if (filterState.watchlistOnly && !watchlistIds.includes(movie.id)) {
        return false;
      }

      // Search Query
      if (filterState.searchQuery) {
        const query = filterState.searchQuery.toLowerCase();
        const matchesTitle = movie.title.toLowerCase().includes(query);
        const matchesNative = movie.nativeTitle?.toLowerCase().includes(query) || false;
        const matchesDirector = movie.director.toLowerCase().includes(query);
        const matchesCast = movie.leadCast.some(c => c.actor.toLowerCase().includes(query));
        const matchesSynopsis = movie.synopsis.toLowerCase().includes(query);
        const matchesTagline = movie.tagline.toLowerCase().includes(query);

        if (!matchesTitle && !matchesNative && !matchesDirector && !matchesCast && !matchesSynopsis && !matchesTagline) {
          return false;
        }
      }

      // Genre
      if (filterState.selectedGenre !== 'All' && !movie.genres.includes(filterState.selectedGenre)) {
        return false;
      }

      // Language
      if (filterState.selectedLanguage !== 'All' && !movie.languages.includes(filterState.selectedLanguage)) {
        return false;
      }

      // Era
      if (filterState.selectedEra !== 'All' && movie.era !== filterState.selectedEra) {
        return false;
      }

      // Platform
      if (filterState.selectedPlatform !== 'All') {
        const hasPlatform = movie.streamingPlatforms.some(p => p.name === filterState.selectedPlatform);
        if (!hasPlatform) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filterState.sortBy === 'rating') {
        const aReviews = reviews.filter(r => r.movieId === a.id);
        const bReviews = reviews.filter(r => r.movieId === b.id);
        const aScore = aReviews.length > 0 
          ? (a.rating + (aReviews.reduce((sum, r) => sum + r.rating, 0) / aReviews.length)) / 2
          : a.rating;
        const bScore = bReviews.length > 0 
          ? (b.rating + (bReviews.reduce((sum, r) => sum + r.rating, 0) / bReviews.length)) / 2
          : b.rating;
        return bScore - aScore;
      }
      if (filterState.sortBy === 'year_desc') {
        return b.releaseYear - a.releaseYear;
      }
      if (filterState.sortBy === 'year_asc') {
        return a.releaseYear - b.releaseYear;
      }
      if (filterState.sortBy === 'runtime_desc') {
        return (b.runtimeMinutes || 105) - (a.runtimeMinutes || 105);
      }
      if (filterState.sortBy === 'runtime_asc') {
        return (a.runtimeMinutes || 105) - (b.runtimeMinutes || 105);
      }
      if (filterState.sortBy === 'rewatch_desc') {
        const aCount = trackingMap.get(a.id)?.rewatchCount || 0;
        const bCount = trackingMap.get(b.id)?.rewatchCount || 0;
        if (bCount !== aCount) return bCount - aCount;
        return b.rating - a.rating;
      }
      if (filterState.sortBy === 'box_office') {
        const aScore = a.boxOfficeChampion ? 2 : (a.boxOffice ? 1 : 0);
        const bScore = b.boxOfficeChampion ? 2 : (b.boxOffice ? 1 : 0);
        if (aScore !== bScore) return bScore - aScore;
        return b.rating - a.rating;
      }
      if (filterState.sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [filterState, watchlistIds, moviesList, activeCollection, trackingMap, reviews]);

  // Batch display & Load More for Movie Catalogue (Fixed batches of 12 items, no infinite scroll)
  const MOVIES_BATCH_SIZE = 12;
  const [displayedMoviesCount, setDisplayedMoviesCount] = useState<number>(MOVIES_BATCH_SIZE);

  // Reset pagination whenever filters or active collection change
  useEffect(() => {
    setDisplayedMoviesCount(MOVIES_BATCH_SIZE);
  }, [filterState, activeCollection]);

  const displayedMovies = useMemo(() => {
    return filteredMovies.slice(0, displayedMoviesCount);
  }, [filteredMovies, displayedMoviesCount]);

  const featuredMovies = useMemo(() => {
    return moviesList.filter(m => m.featured);
  }, [moviesList]);

  const appThemeClasses = 
    activeTheme === 'gold'
      ? 'bg-[#0e0a04] selection:bg-amber-600 selection:text-white'
      : activeTheme === 'obsidian'
        ? 'bg-[#080612] selection:bg-purple-600 selection:text-white'
        : 'bg-[#07100b] selection:bg-emerald-600 selection:text-white';

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden ${appThemeClasses} text-slate-100 flex flex-col transition-colors duration-300`}>
      
      {/* Navigation */}
      <Navbar
        filterState={filterState}
        setFilterState={setFilterState}
        watchlistCount={watchlistIds.length}
        onOpenWatchlist={() => setIsWatchlistOpen(true)}
        onOpenTrivia={() => setIsHeritageOpen(true)}
        onOpenAutoPull={() => setIsAutoPullOpen(true)}
        totalMoviesCount={moviesList.length}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        currentView={currentView}
        onNavigateView={setCurrentView}
        activeTheme={activeTheme}
      />

      {/* Sync Status Banner */}
      {syncNotice && (
        <div className={`border-b text-xs py-2 px-4 flex items-center justify-center gap-2 animate-fadeIn sticky top-16 sm:top-20 z-30 backdrop-blur-md ${
          activeTheme === 'gold'
            ? 'bg-amber-950/80 border-amber-500/40 text-amber-200'
            : activeTheme === 'obsidian'
              ? 'bg-purple-950/80 border-purple-500/40 text-purple-200'
              : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
        }`}>
          {isSyncingReleases ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}
          <span className="font-medium">{syncNotice}</span>
        </div>
      )}

      {/* Standalone Curated Collection Mode */}
      {activeStandaloneList ? (
        <StandaloneListView
          list={activeStandaloneList}
          allMovies={moviesList}
          currentUser={currentUser}
          onClose={handleCloseStandaloneList}
          onSelectMovie={setSelectedMovie}
          onOpenTrailer={setTrailerMovie}
          onEditList={(list) => {
            setEditingCustomList(list);
            setIsCustomListModalOpen(true);
          }}
          watchlist={watchlistIds}
          onToggleWatchlist={handleToggleWatchlist}
          trackingMap={trackingMap}
          onUpdateStatus={handleUpdateTrackingStatus}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      ) : currentView === 'profile' ? (
        <UserProfilePage
          currentUser={currentUser}
          moviesList={moviesList}
          watchlist={watchlistIds}
          trackingList={trackingList}
          customTmdbApiKey={customTmdbApiKey}
          reviews={reviews}
          activeTheme={activeTheme}
          onSelectTheme={handleSelectTheme}
          userCustomLists={userCustomLists}
          onOpenCreateList={() => {
            setEditingCustomList(null);
            setIsCustomListModalOpen(true);
          }}
          onOpenEditList={(list) => {
            setEditingCustomList(list);
            setIsCustomListModalOpen(true);
          }}
          onDeleteCustomList={handleDeleteCustomList}
          onViewStandaloneList={(list) => setActiveStandaloneList(list)}
          onUpdateStatus={handleUpdateTrackingStatus}
          onUpdateRewatchCount={handleUpdateRewatchCount}
          onSaveApiKey={handleSaveApiKey}
          onRemoveApiKey={handleRemoveApiKey}
          onToggleWatchlist={handleToggleWatchlist}
          onClearWatchlist={handleClearWatchlist}
          onSelectMovie={setSelectedMovie}
          onOpenTrailer={setTrailerMovie}
          onDeleteReview={handleDeleteReview}
          onOpenAddMovie={() => setIsAutoPullOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onSignOut={handleSignOut}
          onBackToCatalogue={() => setCurrentView('catalogue')}
          onOpenEdit={(movie) => setEditingMovie(movie)}
        />
      ) : (
        <>
          {/* Hero Spotlight (Hidden if user is actively searching or filtering by watchlist) */}
          {!filterState.searchQuery && !filterState.watchlistOnly && (
            <HeroSpotlight
              featuredMovies={featuredMovies}
              onSelectMovie={setSelectedMovie}
              onOpenTrailer={setTrailerMovie}
              isWatchlisted={(id) => watchlistIds.includes(id)}
              onToggleWatchlist={handleToggleWatchlist}
              currentUser={currentUser}
              onOpenEdit={(movie) => setEditingMovie(movie)}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          )}

          {/* Main Catalogue Section */}
          <main className="flex-1 w-full max-w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
            
            {/* Curated Spotlight Collections Tabs */}
            <div className="w-full max-w-full flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <span className="text-xs font-bold text-slate-400 shrink-0 uppercase tracking-wider pl-1">
                Collections:
              </span>
              {[
                { id: 'all', label: 'All Nigerian Titles', icon: Film },
                { id: 'box-office', label: '₦1B+ Box Office Kings', icon: Flame },
                { id: 'epics', label: 'Yoruba & Igbo Epics', icon: Award },
                { id: 'golden-era', label: '90s VHS Nostalgia Classics', icon: Clapperboard },
                { id: 'crime-heist', label: 'Lagos Crime & Thrillers', icon: Sparkles },
                { 
                  id: 'community', 
                  label: `Added Movies (${moviesList.filter(m => m.isUserAdded).length})`, 
                  icon: Plus 
                }
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeCollection === item.id;
                return (
                  <button
                    key={item.id}
                    id={`collection-tab-${item.id}`}
                    onClick={() => handleCollectionSelect(item.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-950/40'
                        : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Filters Bar */}
            <CatalogueFilters
              filterState={filterState}
              setFilterState={setFilterState}
              totalMatches={filteredMovies.length}
              viewMode={viewMode}
              setViewMode={setViewMode}
              activeTheme={activeTheme}
            />

            {/* Movie Results Grid or List */}
            {!isCatalogReady ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-slate-800 bg-slate-900/40 p-8 text-center">
                <Film className="h-10 w-10 animate-pulse text-emerald-400" />
                <p className="text-sm text-slate-300">Loading the movie catalog from Firestore…</p>
              </div>
            ) : catalogLoadError && moviesList.length === 0 ? (
              <div className="rounded-3xl border border-rose-900/60 bg-rose-950/20 p-8 text-center">
                <h3 className="font-bold text-white">Could not load the movie catalog</h3>
                <p className="mt-2 text-sm text-slate-400">{catalogLoadError}</p>
              </div>
            ) : filteredMovies.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Film className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">No Nollywood titles found</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    No Nigerian movies matched your active filter settings. Try clearing filters, searching another actor or director, or click "Sync New Releases".
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setFilterState({
                      searchQuery: '',
                      selectedGenre: 'All',
                      selectedLanguage: 'All',
                      selectedEra: 'All',
                      selectedPlatform: 'All',
                      sortBy: 'rating',
                      watchlistOnly: false
                    })}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                  {currentUser ? (
                    <button
                      onClick={() => setIsAutoPullOpen(true)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-amber-600 hover:brightness-110 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Auto-Pull from Online Registry</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsAuthOpen(true)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                    >
                      <span>Sign In to Add Titles</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div 
                    id="movies-grid"
                    className="w-full max-w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-7"
                  >
                    {displayedMovies.map((movie) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        onSelect={setSelectedMovie}
                        onOpenTrailer={setTrailerMovie}
                        isWatchlisted={watchlistIds.includes(movie.id)}
                        onToggleWatchlist={handleToggleWatchlist}
                        watchStatus={trackingMap.get(movie.id)?.status || (watchlistIds.includes(movie.id) ? 'plan_to_watch' : null)}
                        onUpdateStatus={handleUpdateTrackingStatus}
                        viewMode="grid"
                        currentUser={currentUser}
                        onOpenEdit={(m) => setEditingMovie(m)}
                        onOpenAuth={() => setIsAuthOpen(true)}
                      />
                    ))}
                  </div>
                ) : (
                  <div 
                    id="movies-list"
                    className="w-full max-w-full space-y-3"
                  >
                    {displayedMovies.map((movie) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        onSelect={setSelectedMovie}
                        onOpenTrailer={setTrailerMovie}
                        isWatchlisted={watchlistIds.includes(movie.id)}
                        onToggleWatchlist={handleToggleWatchlist}
                        watchStatus={trackingMap.get(movie.id)?.status || (watchlistIds.includes(movie.id) ? 'plan_to_watch' : null)}
                        onUpdateStatus={handleUpdateTrackingStatus}
                        viewMode="compact"
                        currentUser={currentUser}
                        onOpenEdit={(m) => setEditingMovie(m)}
                        onOpenAuth={() => setIsAuthOpen(true)}
                      />
                    ))}
                  </div>
                )}

                {/* Clean Load More Button (Fixed Batches of 12) */}
                {displayedMoviesCount < filteredMovies.length && (
                  <div className="py-8 flex flex-col items-center justify-center gap-3">
                    <div className="text-xs text-slate-400 font-medium">
                      Showing <strong className="text-white">{displayedMovies.length}</strong> of <strong className="text-white">{filteredMovies.length}</strong> Nollywood titles
                    </div>
                    <button
                      id="load-more-catalogue-btn"
                      onClick={() => setDisplayedMoviesCount(prev => prev + MOVIES_BATCH_SIZE)}
                      className="px-8 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-xs sm:text-sm font-bold shadow-xl shadow-black/50 hover:scale-102 active:scale-98 transition-all cursor-pointer flex items-center gap-2.5 group"
                    >
                      <ChevronDown className="w-4 h-4 text-amber-400 group-hover:translate-y-0.5 transition-transform" />
                      <span>Load More Titles ({Math.min(MOVIES_BATCH_SIZE, filteredMovies.length - displayedMoviesCount)} remaining)</span>
                    </button>
                  </div>
                )}

                {filteredMovies.length > MOVIES_BATCH_SIZE && displayedMoviesCount >= filteredMovies.length && (
                  <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <span className="w-12 h-px bg-slate-800" />
                    <span>All {filteredMovies.length} Nollywood titles displayed</span>
                    <span className="w-12 h-px bg-slate-800" />
                  </div>
                )}
              </>
            )}

          </main>
        </>
      )}

      {/* Footer */}
      <Footer
        onQuickFilter={(key, val) => {
          if (currentView === 'profile') setCurrentView('catalogue');
          setFilterState(prev => ({ ...prev, [key]: val }));
        }}
        onOpenHeritage={() => setIsHeritageOpen(true)}
        onOpenSiteInfo={setActiveSiteInfoPage}
      />

      {/* Footer information overlays */}
      <SiteInfoModal
        page={activeSiteInfoPage}
        onClose={() => setActiveSiteInfoPage(null)}
        onOpenAddFilm={() => {
          setActiveSiteInfoPage(null);
          if (!currentUser) {
            setIsAuthOpen(true);
          } else {
            setIsAutoPullOpen(true);
          }
        }}
      />

      {/* Movie Details Modal */}
      {selectedMovie && (
        <MovieDetailModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onOpenTrailer={setTrailerMovie}
          isWatchlisted={watchlistIds.includes(selectedMovie.id)}
          onToggleWatchlist={handleToggleWatchlist}
          watchStatus={trackingMap.get(selectedMovie.id)?.status || (watchlistIds.includes(selectedMovie.id) ? 'plan_to_watch' : null)}
          onUpdateStatus={handleUpdateTrackingStatus}
          rewatchCount={trackingMap.get(selectedMovie.id)?.rewatchCount || 0}
          onUpdateRewatchCount={handleUpdateRewatchCount}
          allMovies={moviesList}
          onSelectMovie={setSelectedMovie}
          reviews={reviews}
          onAddReview={handleAddReview}
          currentUser={currentUser}
          onOpenEdit={(m) => setEditingMovie(m)}
          onUpdateMovie={handleUpdateMovie}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      )}

      {/* Dedicated Edit Movie Modal (Exclusively for Authenticated Firebase Users) */}
      <EditMovieModal
        isOpen={Boolean(editingMovie)}
        movie={editingMovie}
        onClose={() => setEditingMovie(null)}
        onSaveMovie={handleUpdateMovie}
        currentUser={currentUser}
      />

      {/* Video Trailer Modal */}
      <TrailerModal
        movie={trailerMovie}
        onClose={() => setTrailerMovie(null)}
      />

      {/* Watchlist Modal */}
      <WatchlistModal
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        watchlistMovies={watchlistMovies}
        onRemoveFromWatchlist={handleToggleWatchlist}
        onClearWatchlist={handleClearWatchlist}
        onSelectMovie={setSelectedMovie}
        onOpenTrailer={setTrailerMovie}
      />

      {/* Nollywood Heritage Modal */}
      <HeritageModal
        isOpen={isHeritageOpen}
        onClose={() => setIsHeritageOpen(false)}
      />

      {/* Add Movie & Auto-Pull Modal */}
      <AddMovieModal
        isOpen={isAutoPullOpen}
        onClose={() => setIsAutoPullOpen(false)}
        onAddMovie={handleMoviePulled}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onOpenProfile={() => setCurrentView('profile')}
      />

      {/* Custom Curated Collection Modal */}
      <CustomListModal
        isOpen={isCustomListModalOpen}
        onClose={() => {
          setIsCustomListModalOpen(false);
          setEditingCustomList(null);
        }}
        onSaveList={handleSaveCustomList}
        allMovies={moviesList}
        currentUser={currentUser}
        editingList={editingCustomList}
      />

      {/* Unobtrusive Floating Multi-Decade Historical Sweep Status Pill */}
      {showSweepPill && (
        <HistoricalSweepPill
          progress={sweepProgress}
          isRunning={isSweeping}
          isCancelling={isCancellingSweep}
          onTriggerSweep={handleTriggerHistoricalSweep}
          onCancelSweep={handleCancelHistoricalSweep}
          onDismiss={() => setShowSweepPill(false)}
        />
      )}

    </div>
  );
}
