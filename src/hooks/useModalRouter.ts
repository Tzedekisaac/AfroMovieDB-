import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getCustomListById, saveFirestoreCustomMovie } from '../lib/firestoreService';
import { pullMovieDetailsFromOnline } from '../utils/api';
import { sanitizeAndTagMovie } from '../utils/sanitizeAndTagMovie';
import {
  ActiveModalType,
  buildListDeepLinkUrl,
  findListById,
  findMovieById,
  parseDeepLinkParams,
  parseTmdbIdFromMovieParam,
  removeQueryParamFromUrl,
} from '../utils/modalRouterHelpers';
import type { SiteInfoPage } from '../components/SiteInfoModal';
import type { CustomUserList, Movie } from '../types';

export type { ActiveModalType };

export interface UseModalRouterOptions {
  movies?: Movie[];
  userCustomLists?: CustomUserList[];
}

export interface UseModalRouterResult {
  // Active modal summary & setter
  activeModal: ActiveModalType;
  setActiveModal: (modal: ActiveModalType) => void;

  // MovieDetailModal
  selectedMovie: Movie | null;
  setSelectedMovie: React.Dispatch<React.SetStateAction<Movie | null>>;
  openMovie: (movieOrId: Movie | string) => void;
  closeMovie: () => void;

  // TrailerModal
  trailerMovie: Movie | null;
  setTrailerMovie: React.Dispatch<React.SetStateAction<Movie | null>>;
  openTrailer: (movie: Movie) => void;
  closeTrailer: () => void;

  // EditMovieModal
  editingMovie: Movie | null;
  setEditingMovie: React.Dispatch<React.SetStateAction<Movie | null>>;
  openEditMovie: (movie: Movie) => void;
  closeEditMovie: () => void;

  // WatchlistModal
  isWatchlistOpen: boolean;
  setIsWatchlistOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openWatchlist: () => void;
  closeWatchlist: () => void;

  // HeritageModal
  isHeritageOpen: boolean;
  setIsHeritageOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openHeritage: () => void;
  closeHeritage: () => void;

  // AddMovieModal
  isAutoPullOpen: boolean;
  setIsAutoPullOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openAddMovie: () => void;
  closeAddMovie: () => void;

  // AuthModal
  isAuthOpen: boolean;
  setIsAuthOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openAuth: () => void;
  closeAuth: () => void;

  // StandaloneListView & CustomListModal
  activeStandaloneList: CustomUserList | null;
  setActiveStandaloneList: React.Dispatch<React.SetStateAction<CustomUserList | null>>;
  openList: (listOrId: CustomUserList | string) => void;
  closeList: () => void;

  isCustomListModalOpen: boolean;
  setIsCustomListModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingCustomList: CustomUserList | null;
  setEditingCustomList: React.Dispatch<React.SetStateAction<CustomUserList | null>>;
  openCustomList: (list?: CustomUserList | null) => void;
  closeCustomList: () => void;

  // SiteInfoModal
  activeSiteInfoPage: SiteInfoPage | null;
  setActiveSiteInfoPage: React.Dispatch<React.SetStateAction<SiteInfoPage | null>>;
  openSiteInfo: (page: SiteInfoPage) => void;
  closeSiteInfo: () => void;
}

const EMPTY_MOVIES: Movie[] = [];
const EMPTY_LISTS: CustomUserList[] = [];

export function useModalRouter(options: UseModalRouterOptions = {}): UseModalRouterResult {
  const { movies = EMPTY_MOVIES, userCustomLists = EMPTY_LISTS } = options;

  // Modal & standalone view states
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [trailerMovie, setTrailerMovie] = useState<Movie | null>(null);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isHeritageOpen, setIsHeritageOpen] = useState(false);
  const [isAutoPullOpen, setIsAutoPullOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeSiteInfoPage, setActiveSiteInfoPage] = useState<SiteInfoPage | null>(null);
  const [activeStandaloneList, setActiveStandaloneList] = useState<CustomUserList | null>(null);
  const [isCustomListModalOpen, setIsCustomListModalOpen] = useState(false);
  const [editingCustomList, setEditingCustomList] = useState<CustomUserList | null>(null);

  const moviesRef = useRef(movies);
  moviesRef.current = movies;

  const listsRef = useRef(userCustomLists);
  listsRef.current = userCustomLists;

  // Propagate real-time Firestore movie updates to any open movie modals
  useEffect(() => {
    setSelectedMovie((curr) => {
      if (!curr) return null;
      return movies.find((m) => m.id === curr.id) || curr;
    });

    setEditingMovie((curr) => {
      if (!curr) return null;
      return movies.find((m) => m.id === curr.id) || curr;
    });

    setTrailerMovie((curr) => {
      if (!curr) return null;
      return movies.find((m) => m.id === curr.id) || curr;
    });
  }, [movies]);

  // Resolve a shared TMDb movie ID online if not yet in the Firestore snapshot
  const resolveAndOpenTmdbMovie = useCallback(
    async (tmdbIdNum: number, isCancelled: () => boolean = () => false) => {
      try {
        const loadedMovie = await pullMovieDetailsFromOnline({
          tmdbId: tmdbIdNum,
          title: 'Nollywood Film',
          releaseYear: new Date().getFullYear(),
          overview: '',
          posterUrl: '',
          backdropUrl: '',
          rating: 8.0,
          ratingCount: 10,
          genreIds: [],
          popularity: 1,
        });
        if (!isCancelled() && loadedMovie) {
          const safeMovie = sanitizeAndTagMovie(loadedMovie) as Movie;
          await saveFirestoreCustomMovie(safeMovie);
          if (!isCancelled()) {
            setSelectedMovie(safeMovie);
          }
        }
      } catch (e) {
        console.warn('Could not auto-resolve shared online movie', e);
      }
    },
    []
  );

  // Check URL query parameter (?movie=id) to auto-open shared film link
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let isCancelled = false;

    const { movieId: sharedMovieId } = parseDeepLinkParams(window.location.search);
    if (sharedMovieId) {
      const found = findMovieById(movies, sharedMovieId);
      if (found) {
        setSelectedMovie(found);
      } else {
        const tmdbIdNum = parseTmdbIdFromMovieParam(sharedMovieId);
        if (tmdbIdNum !== null) {
          resolveAndOpenTmdbMovie(tmdbIdNum, () => isCancelled);
        }
      }
    }

    return () => {
      isCancelled = true;
    };
  }, [movies, resolveAndOpenTmdbMovie]);

  // Check URL query parameter (?list=id) to auto-open standalone collection view
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let isCancelled = false;

    const { listId: sharedListId } = parseDeepLinkParams(window.location.search);
    if (sharedListId) {
      const found = findListById(userCustomLists, sharedListId);
      if (found) {
        setActiveStandaloneList(found);
      } else {
        getCustomListById(sharedListId)
          .then((loadedList) => {
            if (!isCancelled && loadedList) {
              setActiveStandaloneList(loadedList);
            }
          })
          .catch((e) => console.warn('Could not auto-resolve shared list', e));
      }
    }

    return () => {
      isCancelled = true;
    };
  }, [userCustomLists]);

  // Synchronize ?list=<id> in browser URL history when standalone list is active
  useEffect(() => {
    if (typeof window === 'undefined' || !activeStandaloneList) return;
    try {
      const updatedUrl = buildListDeepLinkUrl(window.location.href, activeStandaloneList.id);
      if (updatedUrl) {
        window.history.pushState({ listId: activeStandaloneList.id }, '', updatedUrl);
      }
    } catch {}
  }, [activeStandaloneList?.id]);

  // Clean opener & closer handlers
  const openMovie = useCallback(
    (movieOrId: Movie | string) => {
      if (typeof movieOrId === 'string') {
        const found = findMovieById(moviesRef.current, movieOrId);
        if (found) {
          setSelectedMovie(found);
          return;
        }
        const tmdbIdNum = parseTmdbIdFromMovieParam(movieOrId);
        if (tmdbIdNum !== null) {
          resolveAndOpenTmdbMovie(tmdbIdNum);
        }
        return;
      }
      setSelectedMovie(movieOrId);
    },
    [resolveAndOpenTmdbMovie]
  );

  const closeMovie = useCallback(() => {
    setSelectedMovie(null);
    if (typeof window !== 'undefined') {
      const cleanUrl = removeQueryParamFromUrl(window.location.href, 'movie');
      if (cleanUrl) {
        try {
          window.history.replaceState({}, '', cleanUrl);
        } catch {}
      }
    }
  }, []);

  const openTrailer = useCallback((movie: Movie) => {
    setTrailerMovie(movie);
  }, []);

  const closeTrailer = useCallback(() => {
    setTrailerMovie(null);
  }, []);

  const openEditMovie = useCallback((movie: Movie) => {
    setEditingMovie(movie);
  }, []);

  const closeEditMovie = useCallback(() => {
    setEditingMovie(null);
  }, []);

  const openWatchlist = useCallback(() => {
    setIsWatchlistOpen(true);
  }, []);

  const closeWatchlist = useCallback(() => {
    setIsWatchlistOpen(false);
  }, []);

  const openHeritage = useCallback(() => {
    setIsHeritageOpen(true);
  }, []);

  const closeHeritage = useCallback(() => {
    setIsHeritageOpen(false);
  }, []);

  const openAddMovie = useCallback(() => {
    setIsAutoPullOpen(true);
  }, []);

  const closeAddMovie = useCallback(() => {
    setIsAutoPullOpen(false);
  }, []);

  const openAuth = useCallback(() => {
    setIsAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setIsAuthOpen(false);
  }, []);

  const openList = useCallback((listOrId: CustomUserList | string) => {
    if (typeof listOrId === 'string') {
      const found = findListById(listsRef.current, listOrId);
      if (found) {
        setActiveStandaloneList(found);
        return;
      }
      getCustomListById(listOrId)
        .then((loadedList) => {
          if (loadedList) {
            setActiveStandaloneList(loadedList);
          }
        })
        .catch((e) => console.warn('Could not load requested list', e));
      return;
    }
    setActiveStandaloneList(listOrId);
  }, []);

  const closeList = useCallback(() => {
    setActiveStandaloneList(null);
    if (typeof window !== 'undefined') {
      const cleanUrl = removeQueryParamFromUrl(window.location.href, 'list');
      if (cleanUrl) {
        try {
          window.history.replaceState({}, '', cleanUrl);
        } catch {}
      }
    }
  }, []);

  const openCustomList = useCallback((list: CustomUserList | null = null) => {
    setEditingCustomList(list);
    setIsCustomListModalOpen(true);
  }, []);

  const closeCustomList = useCallback(() => {
    setIsCustomListModalOpen(false);
    setEditingCustomList(null);
  }, []);

  const openSiteInfo = useCallback((page: SiteInfoPage) => {
    setActiveSiteInfoPage(page);
  }, []);

  const closeSiteInfo = useCallback(() => {
    setActiveSiteInfoPage(null);
  }, []);

  const activeModal: ActiveModalType = useMemo(() => {
    if (isAuthOpen) return 'auth';
    if (editingMovie) return 'edit';
    if (trailerMovie) return 'trailer';
    if (isCustomListModalOpen) return 'customList';
    if (isAutoPullOpen) return 'addMovie';
    if (isWatchlistOpen) return 'watchlist';
    if (isHeritageOpen) return 'heritage';
    if (activeSiteInfoPage) return 'siteInfo';
    if (selectedMovie) return 'movie';
    return null;
  }, [
    isAuthOpen,
    editingMovie,
    trailerMovie,
    isCustomListModalOpen,
    isAutoPullOpen,
    isWatchlistOpen,
    isHeritageOpen,
    activeSiteInfoPage,
    selectedMovie,
  ]);

  const setActiveModal = useCallback(
    (modal: ActiveModalType) => {
      if (modal === null) {
        closeMovie();
        closeTrailer();
        closeEditMovie();
        closeWatchlist();
        closeHeritage();
        closeAddMovie();
        closeAuth();
        closeCustomList();
        closeSiteInfo();
        return;
      }

      switch (modal) {
        case 'auth':
          setIsAuthOpen(true);
          break;
        case 'watchlist':
          setIsWatchlistOpen(true);
          break;
        case 'heritage':
          setIsHeritageOpen(true);
          break;
        case 'addMovie':
          setIsAutoPullOpen(true);
          break;
        case 'customList':
          setIsCustomListModalOpen(true);
          break;
        default:
          break;
      }
    },
    [
      closeMovie,
      closeTrailer,
      closeEditMovie,
      closeWatchlist,
      closeHeritage,
      closeAddMovie,
      closeAuth,
      closeCustomList,
      closeSiteInfo,
    ]
  );

  return {
    activeModal,
    setActiveModal,
    selectedMovie,
    setSelectedMovie,
    openMovie,
    closeMovie,
    trailerMovie,
    setTrailerMovie,
    openTrailer,
    closeTrailer,
    editingMovie,
    setEditingMovie,
    openEditMovie,
    closeEditMovie,
    isWatchlistOpen,
    setIsWatchlistOpen,
    openWatchlist,
    closeWatchlist,
    isHeritageOpen,
    setIsHeritageOpen,
    openHeritage,
    closeHeritage,
    isAutoPullOpen,
    setIsAutoPullOpen,
    openAddMovie,
    closeAddMovie,
    isAuthOpen,
    setIsAuthOpen,
    openAuth,
    closeAuth,
    activeStandaloneList,
    setActiveStandaloneList,
    openList,
    closeList,
    isCustomListModalOpen,
    setIsCustomListModalOpen,
    editingCustomList,
    setEditingCustomList,
    openCustomList,
    closeCustomList,
    activeSiteInfoPage,
    setActiveSiteInfoPage,
    openSiteInfo,
    closeSiteInfo,
  };
}
