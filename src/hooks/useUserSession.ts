import { useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  subscribeToUserData,
  saveUserWatchlist,
  subscribeToUserCustomLists,
  purgeNonNigerianMoviesFromFirestore,
  syncUserProfileOnLogin,
  subscribeToUserProfile,
  isUserAdminOrOwner
} from '../lib/firestoreService';
import { setCustomTmdbKey } from '../utils/api';
import type { UserTrackedItem, AppTheme, CustomUserList, AppUserProfile } from '../types';

const WATCHLIST_STORAGE_KEY = 'afromoviedb_watchlist_ids_v1';
const TRACKING_STORAGE_KEY = 'afromoviedb_tracking_list_v1';

export interface UseUserSessionResult {
  user: User | null;
  userProfile: AppUserProfile | null;
  isAdmin: boolean;
  loadingAuth: boolean;
  watchlistIds: string[];
  setWatchlistIds: React.Dispatch<React.SetStateAction<string[]>>;
  trackingList: UserTrackedItem[];
  setTrackingList: React.Dispatch<React.SetStateAction<UserTrackedItem[]>>;
  customTmdbApiKey: string | undefined;
  setCustomTmdbApiKey: React.Dispatch<React.SetStateAction<string | undefined>>;
  activeTheme: AppTheme;
  setActiveTheme: React.Dispatch<React.SetStateAction<AppTheme>>;
  userCustomLists: CustomUserList[];
  setUserCustomLists: React.Dispatch<React.SetStateAction<CustomUserList[]>>;
  signOutUser: () => Promise<void>;
}

export function useUserSession(): UseUserSessionResult {
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

  return {
    user,
    userProfile,
    isAdmin,
    loadingAuth,
    watchlistIds,
    setWatchlistIds,
    trackingList,
    setTrackingList,
    customTmdbApiKey,
    setCustomTmdbApiKey,
    activeTheme,
    setActiveTheme,
    userCustomLists,
    setUserCustomLists,
    signOutUser
  };
}
