import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  subscribeToUserData,
  saveUserWatchlist,
  saveUserTrackingList,
  saveUserApiKey,
  removeUserApiKey,
  saveUserTheme,
  saveCustomList,
  deleteCustomList,
  subscribeToUserCustomLists,
  purgeNonNigerianMoviesFromFirestore,
  syncUserProfileOnLogin,
  subscribeToUserProfile,
  isUserAdminOrOwner
} from '../lib/firestoreService';
import { setCustomTmdbKey } from '../utils/api';
import type {
  UserTrackedItem,
  MovieWatchStatus,
  AppTheme,
  CustomUserList,
  AppUserProfile
} from '../types';

const WATCHLIST_STORAGE_KEY = 'afromoviedb_watchlist_ids_v1';
const TRACKING_STORAGE_KEY = 'afromoviedb_tracking_list_v1';

export interface UseUserSessionOptions {
  onSyncNotice?: (message: string | null, durationMs?: number) => void;
  onRequireAuth?: () => void;
}

export interface UseUserSessionResult {
  user: User | null;
  userProfile: AppUserProfile | null;
  isAdmin: boolean;
  loadingAuth: boolean;
  watchlistIds: string[];
  setWatchlistIds: React.Dispatch<React.SetStateAction<string[]>>;
  trackingList: UserTrackedItem[];
  setTrackingList: React.Dispatch<React.SetStateAction<UserTrackedItem[]>>;
  trackingMap: Map<string, UserTrackedItem>;
  customTmdbApiKey: string | undefined;
  setCustomTmdbApiKey: React.Dispatch<React.SetStateAction<string | undefined>>;
  activeTheme: AppTheme;
  setActiveTheme: React.Dispatch<React.SetStateAction<AppTheme>>;
  userCustomLists: CustomUserList[];
  setUserCustomLists: React.Dispatch<React.SetStateAction<CustomUserList[]>>;
  signOutUser: () => Promise<void>;
  updateTrackingStatus: (movieId: string, status: MovieWatchStatus | null) => Promise<void>;
  updateRewatchCount: (movieId: string, count: number) => Promise<void>;
  toggleWatchlist: (movieId: string) => void;
  clearWatchlist: () => void;
  saveApiKey: (apiKey: string) => Promise<void>;
  removeApiKey: () => Promise<void>;
  selectTheme: (newTheme: AppTheme) => Promise<void>;
  saveUserCustomList: (list: CustomUserList) => Promise<void>;
  deleteUserCustomList: (listId: string, onDeleted?: () => void) => Promise<void>;
}

export function useUserSession(options: UseUserSessionOptions = {}): UseUserSessionResult {
  const { onSyncNotice, onRequireAuth } = options;

  // Auth & profile state
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  // Watchlist State (loaded from localStorage initially, synced to Firestore when user logs in)
  const [watchlistIds, setWatchlistIds] = useState<string[]>(() => {
    try {
      const saved =
        localStorage.getItem(WATCHLIST_STORAGE_KEY) ||
        localStorage.getItem('naijareel_watchlist_ids_v1');
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
      return savedTheme && ['emerald', 'gold', 'obsidian'].includes(savedTheme)
        ? savedTheme
        : 'emerald';
    } catch {
      return 'emerald';
    }
  });

  // Custom Curated User Lists
  const [userCustomLists, setUserCustomLists] = useState<CustomUserList[]>([]);

  const onSyncNoticeRef = useRef(onSyncNotice);
  onSyncNoticeRef.current = onSyncNotice;
  const onRequireAuthRef = useRef(onRequireAuth);
  onRequireAuthRef.current = onRequireAuth;
  const userRef = useRef(user);
  userRef.current = user;
  const trackingListRef = useRef(trackingList);
  trackingListRef.current = trackingList;
  const watchlistIdsRef = useRef(watchlistIds);
  watchlistIdsRef.current = watchlistIds;

  // Listen to Firebase Auth state & sync profile / role
  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoadingAuth(false);

      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (firebaseUser) {
        // Sync profile into Firestore users collection
        syncUserProfileOnLogin(firebaseUser).catch((err) => {
          console.warn('Profile sync on auth notice:', err);
        });

        // Listen for live role and profile changes
        profileUnsub = subscribeToUserProfile(firebaseUser.uid, (profile) => {
          setUserProfile(profile);
        });
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      unsubscribe();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  // Listen to Firestore real-time User Data (trackingList, watchlist, custom TMDb API key, theme)
  useEffect(() => {
    if (!user) {
      setCustomTmdbApiKey(undefined);
      setCustomTmdbKey(null);
      return;
    }

    const unsubscribe = subscribeToUserData(user.uid, (data) => {
      if (data.trackingList) {
        setTrackingList(data.trackingList);
      }
      if (data.watchlist && data.watchlist.length > 0) {
        setWatchlistIds((prev) => Array.from(new Set([...data.watchlist, ...prev])));
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
  }, [user]);

  // Listen to user's custom created lists
  useEffect(() => {
    if (!user) {
      setUserCustomLists([]);
      return;
    }

    const unsubscribe = subscribeToUserCustomLists(user.uid, (lists) => {
      setUserCustomLists(lists);
    });

    // Run auto-cleanup pass on Cloud Firestore in the background
    purgeNonNigerianMoviesFromFirestore().catch((err) => {
      console.info('Auto-cleanup pass notice:', err?.message || err);
    });

    return () => unsubscribe();
  }, [user]);

  // Save watchlist to localStorage AND sync to Firebase Firestore if logged in
  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlistIds));
    } catch (e) {
      console.error('Failed to save watchlist', e);
    }

    if (user) {
      saveUserWatchlist(user.uid, watchlistIds).catch((err) => {
        console.warn('Failed to sync watchlist to Firestore:', err);
      });
    }
  }, [watchlistIds, user]);

  // Fast status lookup map for catalogue cards
  const trackingMap = useMemo(() => {
    const map = new Map<string, UserTrackedItem>();
    trackingList.forEach((item) => map.set(item.movieId, item));
    return map;
  }, [trackingList]);

  const trackingMapRef = useRef(trackingMap);
  trackingMapRef.current = trackingMap;

  const isAdmin = useMemo(
    () => isUserAdminOrOwner(userProfile, user),
    [userProfile, user]
  );

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  }, []);

  // Update multi-status tracking (Plan to Watch, Watching, Completed, On Hold, Dropped, or un-track)
  const updateTrackingStatus = useCallback(
    async (movieId: string, status: MovieWatchStatus | null) => {
      const currentUser = userRef.current;
      if (!currentUser) {
        onRequireAuthRef.current?.();
        return;
      }

      const currentTracking = trackingListRef.current;
      let updatedList: UserTrackedItem[];

      if (!status) {
        updatedList = currentTracking.filter((t) => t.movieId !== movieId);
        setWatchlistIds((prev) => prev.filter((id) => id !== movieId));
      } else {
        const existing = currentTracking.find((t) => t.movieId === movieId);
        if (existing) {
          updatedList = currentTracking.map((t) =>
            t.movieId === movieId
              ? { ...t, status, updatedAt: new Date().toISOString() }
              : t
          );
        } else {
          updatedList = [
            ...currentTracking,
            {
              movieId,
              status,
              rewatchCount: 0,
              updatedAt: new Date().toISOString(),
            },
          ];
        }
        // Keep watchlistIds synced for backward compatibility
        setWatchlistIds((prev) => (prev.includes(movieId) ? prev : [...prev, movieId]));
      }

      setTrackingList(updatedList);
      try {
        localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(updatedList));
      } catch (e) {
        console.warn('Failed to cache tracking list locally:', e);
      }

      try {
        await saveUserTrackingList(currentUser.uid, updatedList);
      } catch (err) {
        console.warn('Failed to sync tracking list to Firestore:', err);
      }
    },
    []
  );

  // Rewatch counter updater for completed films
  const updateRewatchCount = useCallback(async (movieId: string, count: number) => {
    const safeCount = Math.max(0, count);
    const updatedList = trackingListRef.current.map((t) =>
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

    const currentUser = userRef.current;
    if (currentUser) {
      try {
        await saveUserTrackingList(currentUser.uid, updatedList);
      } catch (err) {
        console.warn('Failed to sync rewatch count to Firestore:', err);
      }
    }
  }, []);

  // Toggle watchlist (Auth-gated)
  const toggleWatchlist = useCallback(
    (movieId: string) => {
      if (!userRef.current) {
        onRequireAuthRef.current?.();
        return;
      }
      const isCurrentlyTracked =
        watchlistIdsRef.current.includes(movieId) || trackingMapRef.current.has(movieId);
      if (isCurrentlyTracked) {
        updateTrackingStatus(movieId, null);
      } else {
        updateTrackingStatus(movieId, 'plan_to_watch');
      }
    },
    [updateTrackingStatus]
  );

  const clearWatchlist = useCallback(() => {
    setWatchlistIds([]);
  }, []);

  // Save personal external API key (TMDb) to user profile in Firestore
  const saveApiKey = useCallback(async (apiKey: string) => {
    const currentUser = userRef.current;
    if (!currentUser) return;
    try {
      await saveUserApiKey(currentUser.uid, apiKey);
      setCustomTmdbApiKey(apiKey);
      setCustomTmdbKey(apiKey);
      onSyncNoticeRef.current?.('Custom TMDb API Key saved securely to your profile!', 4500);
    } catch (err) {
      console.error('Failed to save API key to Firestore:', err);
      throw err;
    }
  }, []);

  // Remove personal external API key from user profile in Firestore
  const removeApiKey = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;
    try {
      await removeUserApiKey(currentUser.uid);
      setCustomTmdbApiKey(undefined);
      setCustomTmdbKey(null);
      onSyncNoticeRef.current?.('Custom TMDb API Key removed. Reverted to shared key.', 4500);
    } catch (err) {
      console.error('Failed to remove API key from Firestore:', err);
      throw err;
    }
  }, []);

  // Theme switch handler with immediate UI persistence & Firestore sync
  const selectTheme = useCallback(async (newTheme: AppTheme) => {
    setActiveTheme(newTheme);
    try {
      localStorage.setItem('afromoviedb_theme_v1', newTheme);
    } catch {}

    const currentUser = userRef.current;
    if (currentUser) {
      try {
        await saveUserTheme(currentUser.uid, newTheme);
      } catch (err) {
        console.warn('Failed to sync theme preference to Firestore:', err);
      }
    }

    const themeName =
      newTheme === 'emerald'
        ? 'Nigerian Emerald'
        : newTheme === 'gold'
          ? 'Royal Gold'
          : 'Deep Obsidian';
    onSyncNoticeRef.current?.(`Switched theme to ${themeName}!`, 3000);
  }, []);

  // Save / Update custom themed collection in Firestore
  const saveUserCustomList = useCallback(async (list: CustomUserList) => {
    const currentUser = userRef.current;
    if (!currentUser) return;
    try {
      await saveCustomList(list, currentUser.uid);
      setUserCustomLists((prev) => {
        const filtered = prev.filter((l) => l.id !== list.id);
        return [list, ...filtered];
      });
      onSyncNoticeRef.current?.(`Collection "${list.title}" published successfully!`, 4500);
    } catch (err) {
      console.error('Failed to save custom collection:', err);
      throw err;
    }
  }, []);

  // Delete custom collection from Firestore
  const deleteUserCustomList = useCallback(async (listId: string, onDeleted?: () => void) => {
    try {
      await deleteCustomList(listId);
      setUserCustomLists((prev) => prev.filter((l) => l.id !== listId));
      onDeleted?.();
      onSyncNoticeRef.current?.('Collection removed.', 3500);
    } catch (err) {
      console.error('Failed to delete custom collection:', err);
    }
  }, []);

  return {
    user,
    userProfile,
    isAdmin,
    loadingAuth,
    watchlistIds,
    setWatchlistIds,
    trackingList,
    setTrackingList,
    trackingMap,
    customTmdbApiKey,
    setCustomTmdbApiKey,
    activeTheme,
    setActiveTheme,
    userCustomLists,
    setUserCustomLists,
    signOutUser,
    updateTrackingStatus,
    updateRewatchCount,
    toggleWatchlist,
    clearWatchlist,
    saveApiKey,
    removeApiKey,
    selectTheme,
    saveUserCustomList,
    deleteUserCustomList
  };
}

