import { useState, useMemo, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type {
  Movie,
  UserReview,
  MovieWatchStatus,
  UserTrackedItem,
  AppUserProfile,
  UserRole,
  RecommendationItem
} from '../types';
import { testTmdbApiKey, getPersonalizedRecommendations } from '../utils/api';
import { subscribeToUserProfile } from '../lib/firestoreService';
import { isUserOwner, isUserAdminOrOwner } from '../lib/adminConfig';

export type ProfileTab =
  | 'all_tracked'
  | 'plan_to_watch'
  | 'watching'
  | 'completed'
  | 'on_hold'
  | 'dropped'
  | 'recommendations'
  | 'custom_lists'
  | 'reviews'
  | 'contributions'
  | 'api_settings';

export const PROFILE_BATCH_SIZE = 12;

export const TRACKING_TABS: ReadonlyArray<ProfileTab> = [
  'all_tracked',
  'plan_to_watch',
  'watching',
  'completed',
  'on_hold',
  'dropped'
];

interface UseUserProfileStateParams {
  currentUser: User | null;
  moviesList: Movie[];
  watchlist: string[];
  trackingList: UserTrackedItem[];
  customTmdbApiKey?: string;
  reviews: UserReview[];
  isAdmin?: boolean;
  userRole?: string;
  onSaveApiKey?: (apiKey: string) => Promise<void> | void;
  onRemoveApiKey?: () => Promise<void> | void;
  onDeleteReview: (reviewId: string) => Promise<void> | void;
}

export interface UserProfileState {
  activeTab: ProfileTab;
  setActiveTab: (tab: ProfileTab) => void;
  selectTab: (tab: ProfileTab) => void;
  searchFilter: string;
  setSearchFilter: (q: string) => void;
  copiedUid: boolean;
  handleCopyUid: () => void;
  deletingReviewId: string | null;
  handleDeleteReviewClick: (reviewId: string) => Promise<void>;
  isOwner: boolean;
  hasAdminAccess: boolean;
  inputApiKey: string;
  setInputApiKey: (val: string) => void;
  showApiKey: boolean;
  setShowApiKey: (val: boolean) => void;
  isTestingKey: boolean;
  testResult: { valid: boolean; message: string } | null;
  isSavingKey: boolean;
  keyNotice: string | null;
  notifyCopiedShareLink: (listTitle: string) => void;
  handleTestKey: () => Promise<void>;
  handleSaveApiKey: () => Promise<void>;
  handleRemoveApiKey: () => Promise<void>;
  effectiveTrackingList: UserTrackedItem[];
  statusCounts: Record<MovieWatchStatus, number>;
  filteredTracked: Array<{ item: UserTrackedItem; movie: Movie }>;
  visibleTracked: Array<{ item: UserTrackedItem; movie: Movie }>;
  hasMoreTracked: boolean;
  loadMoreTracked: () => void;
  watchTimeHours: string;
  personalizedRecommendations: RecommendationItem[];
  userReviews: UserReview[];
  visibleReviews: UserReview[];
  avgUserRating: string;
  visibleContributions: Movie[];
}

export function useUserProfileState({
  currentUser,
  moviesList,
  watchlist,
  trackingList,
  customTmdbApiKey,
  reviews,
  isAdmin,
  userRole,
  onSaveApiKey,
  onRemoveApiKey,
  onDeleteReview
}: UseUserProfileStateParams): UserProfileState {
  const [activeTab, setActiveTab] = useState<ProfileTab>('all_tracked');
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedUid, setCopiedUid] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<AppUserProfile | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setProfileData(null);
      return;
    }
    const unsub = subscribeToUserProfile(currentUser.uid, p => {
      setProfileData(p);
    });
    return () => unsub();
  }, [currentUser]);

  const isOwner = isUserOwner(currentUser);
  const hasAdminAccess = isUserAdminOrOwner(
    {
      role: profileData?.role || (userRole as UserRole | undefined),
      isAdmin: isAdmin || profileData?.isAdmin || (currentUser as any)?.isAdmin
    },
    currentUser
  );

  // API Key Form State
  const [inputApiKey, setInputApiKey] = useState(customTmdbApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keyNotice, setKeyNotice] = useState<string | null>(null);

  useEffect(() => {
    if (customTmdbApiKey !== undefined) {
      setInputApiKey(customTmdbApiKey || '');
    }
  }, [customTmdbApiKey]);

  // Pagination & Batching (Fixed batches of 12 items)
  const [trackedLimit, setTrackedLimit] = useState<number>(PROFILE_BATCH_SIZE);
  const [reviewsLimit, setReviewsLimit] = useState<number>(PROFILE_BATCH_SIZE);
  const [contributionsLimit, setContributionsLimit] = useState<number>(PROFILE_BATCH_SIZE);

  useEffect(() => {
    setTrackedLimit(PROFILE_BATCH_SIZE);
    setReviewsLimit(PROFILE_BATCH_SIZE);
    setContributionsLimit(PROFILE_BATCH_SIZE);
  }, [searchFilter, activeTab]);

  const selectTab = (tab: ProfileTab) => {
    setActiveTab(tab);
    setSearchFilter('');
  };

  // Normalize Tracking Items
  const effectiveTrackingList: UserTrackedItem[] = useMemo(() => {
    if (trackingList && trackingList.length > 0) {
      return trackingList;
    }
    return watchlist.map(id => ({
      movieId: id,
      status: 'plan_to_watch' as MovieWatchStatus,
      rewatchCount: 0,
      updatedAt: new Date().toISOString()
    }));
  }, [trackingList, watchlist]);

  const statusCounts = useMemo(() => {
    const counts: Record<MovieWatchStatus, number> = {
      plan_to_watch: 0,
      watching: 0,
      completed: 0,
      on_hold: 0,
      dropped: 0
    };
    effectiveTrackingList.forEach(t => {
      if (counts[t.status] !== undefined) {
        counts[t.status]++;
      }
    });
    return counts;
  }, [effectiveTrackingList]);

  const trackedMoviePairs = useMemo(() => {
    return effectiveTrackingList
      .map(item => {
        const movie = moviesList.find(m => m.id === item.movieId);
        return movie ? { item, movie } : null;
      })
      .filter(Boolean) as Array<{ item: UserTrackedItem; movie: Movie }>;
  }, [effectiveTrackingList, moviesList]);

  const currentTabTracked = useMemo(() => {
    if (activeTab === 'all_tracked') return trackedMoviePairs;
    return trackedMoviePairs.filter(p => p.item.status === activeTab);
  }, [trackedMoviePairs, activeTab]);

  const filteredTracked = useMemo(() => {
    if (!searchFilter.trim()) return currentTabTracked;
    const q = searchFilter.toLowerCase();
    return currentTabTracked.filter(
      ({ movie }) =>
        movie.title.toLowerCase().includes(q) ||
        movie.director.toLowerCase().includes(q) ||
        movie.genres.some(g => g.toLowerCase().includes(q))
    );
  }, [currentTabTracked, searchFilter]);

  const visibleTracked = useMemo(() => {
    return filteredTracked.slice(0, trackedLimit);
  }, [filteredTracked, trackedLimit]);

  const totalWatchMinutes = useMemo(() => {
    return trackedMoviePairs.reduce((acc, { movie, item }) => {
      const duration = movie.runtimeMinutes || 100;
      const rewatches = item.status === 'completed' ? item.rewatchCount || 0 : 0;
      return acc + duration * (1 + rewatches);
    }, 0);
  }, [trackedMoviePairs]);

  const watchTimeHours = (totalWatchMinutes / 60).toFixed(1);

  const personalizedRecommendations = useMemo(() => {
    return getPersonalizedRecommendations(effectiveTrackingList, moviesList);
  }, [effectiveTrackingList, moviesList]);

  const userReviews: UserReview[] = useMemo(() => {
    if (!currentUser) return [];
    return reviews.filter((r: UserReview) => {
      if (r.userId && r.userId === currentUser.uid) return true;
      if (
        r.userEmail &&
        currentUser.email &&
        r.userEmail.toLowerCase() === currentUser.email.toLowerCase()
      ) {
        return true;
      }
      if (
        !r.userId &&
        !r.userEmail &&
        currentUser.displayName &&
        r.userName.toLowerCase() === currentUser.displayName.toLowerCase()
      ) {
        return true;
      }
      return false;
    });
  }, [reviews, currentUser]);

  const filteredUserReviews: UserReview[] = useMemo(() => {
    if (!searchFilter.trim()) return userReviews;
    const q = searchFilter.toLowerCase();
    return userReviews.filter((r: UserReview) => {
      const movie = moviesList.find(m => m.id === r.movieId);
      const title = movie?.title.toLowerCase() || '';
      return title.includes(q) || r.comment.toLowerCase().includes(q);
    });
  }, [userReviews, moviesList, searchFilter]);

  const visibleReviews: UserReview[] = useMemo(() => {
    return filteredUserReviews.slice(0, reviewsLimit);
  }, [filteredUserReviews, reviewsLimit]);

  const avgUserRating = useMemo(() => {
    if (userReviews.length === 0) return '0.0';
    const sum = userReviews.reduce((acc: number, r: UserReview) => acc + r.rating, 0);
    return (sum / userReviews.length).toFixed(1);
  }, [userReviews]);

  const userContributions = useMemo(() => {
    if (!currentUser) return [];
    return moviesList.filter(m => {
      if (m.addedByUserId && m.addedByUserId === currentUser.uid) return true;
      if (m.lastEditedByUserId && m.lastEditedByUserId === currentUser.uid) return true;
      return false;
    });
  }, [moviesList, currentUser]);

  const filteredContributions = useMemo(() => {
    if (!searchFilter.trim()) return userContributions;
    const q = searchFilter.toLowerCase();
    return userContributions.filter(
      m =>
        m.title.toLowerCase().includes(q) ||
        m.director.toLowerCase().includes(q) ||
        m.genres.some(g => g.toLowerCase().includes(q))
    );
  }, [userContributions, searchFilter]);

  const visibleContributions = useMemo(() => {
    return filteredContributions.slice(0, contributionsLimit);
  }, [filteredContributions, contributionsLimit]);

  const handleCopyUid = () => {
    if (!currentUser) return;
    navigator.clipboard.writeText(currentUser.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleDeleteReviewClick = async (reviewId: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      setDeletingReviewId(reviewId);
      try {
        await onDeleteReview(reviewId);
      } finally {
        setDeletingReviewId(null);
      }
    }
  };

  const notifyCopiedShareLink = (listTitle: string) => {
    setKeyNotice(`Copied public link for "${listTitle}"!`);
    setTimeout(() => setKeyNotice(null), 3500);
  };

  const handleTestKey = async () => {
    if (!inputApiKey.trim()) {
      setTestResult({ valid: false, message: 'Please enter a TMDb API key to test.' });
      return;
    }
    setIsTestingKey(true);
    setTestResult(null);
    try {
      const res = await testTmdbApiKey(inputApiKey.trim());
      setTestResult(res);
    } catch {
      setTestResult({ valid: false, message: 'Connection test failed. Check internet access.' });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!onSaveApiKey) return;
    setIsSavingKey(true);
    setKeyNotice(null);
    try {
      await onSaveApiKey(inputApiKey.trim());
      setKeyNotice('Personal API key saved securely to your cloud profile!');
      setTimeout(() => setKeyNotice(null), 4000);
    } catch (e: any) {
      setKeyNotice(`Failed to save key: ${e.message || 'Firestore error'}`);
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleRemoveApiKey = async () => {
    if (!onRemoveApiKey) return;
    if (confirm('Revert to system default TMDb API key?')) {
      setIsSavingKey(true);
      try {
        await onRemoveApiKey();
        setInputApiKey('');
        setTestResult(null);
        setKeyNotice('Removed custom key. Reverted to shared default key.');
        setTimeout(() => setKeyNotice(null), 4000);
      } finally {
        setIsSavingKey(false);
      }
    }
  };

  return {
    activeTab,
    setActiveTab,
    selectTab,
    searchFilter,
    setSearchFilter,
    copiedUid,
    handleCopyUid,
    deletingReviewId,
    handleDeleteReviewClick,
    isOwner,
    hasAdminAccess,
    inputApiKey,
    setInputApiKey,
    showApiKey,
    setShowApiKey,
    isTestingKey,
    testResult,
    isSavingKey,
    keyNotice,
    notifyCopiedShareLink,
    handleTestKey,
    handleSaveApiKey,
    handleRemoveApiKey,
    effectiveTrackingList,
    statusCounts,
    filteredTracked,
    visibleTracked,
    hasMoreTracked: trackedLimit < filteredTracked.length,
    loadMoreTracked: () => setTrackedLimit(prev => prev + PROFILE_BATCH_SIZE),
    watchTimeHours,
    personalizedRecommendations,
    userReviews,
    visibleReviews,
    avgUserRating,
    visibleContributions
  };
}
