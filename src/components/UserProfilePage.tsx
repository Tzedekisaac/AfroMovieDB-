import React, { useState, useMemo, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  ArrowLeft, Bookmark, Star, Film, MessageSquare, Trash2, 
  Play, ExternalLink, Plus, CheckCircle2, Cloud, Search,
  Clock, ShieldCheck, LogOut, LogIn, Copy, Check, Sparkles,
  Info, Share2, Layers, Pencil, ChevronDown, RotateCcw, Minus,
  Key, KeyRound, Eye, EyeOff, AlertCircle, Compass, RefreshCw,
  Palette, Globe, Lock, ListFilter
} from 'lucide-react';
import { Movie, UserReview, MovieWatchStatus, UserTrackedItem, RecommendationItem, AppTheme, CustomUserList } from '../types';
import { TrackingStatusPicker, STATUS_CONFIG } from './TrackingStatusPicker';
import { testTmdbApiKey, getPersonalizedRecommendations } from '../utils/api';

interface UserProfilePageProps {
  currentUser: User | null;
  moviesList: Movie[];
  watchlist: string[];
  trackingList?: UserTrackedItem[];
  customTmdbApiKey?: string;
  reviews?: UserReview[];
  activeTheme?: AppTheme;
  onSelectTheme?: (theme: AppTheme) => void;
  userCustomLists?: CustomUserList[];
  onOpenCreateList?: () => void;
  onOpenEditList?: (list: CustomUserList) => void;
  onDeleteCustomList?: (listId: string) => void;
  onViewStandaloneList?: (list: CustomUserList) => void;
  onUpdateStatus?: (movieId: string, status: MovieWatchStatus | null) => void;
  onUpdateRewatchCount?: (movieId: string, count: number) => void;
  onSaveApiKey?: (apiKey: string) => Promise<void> | void;
  onRemoveApiKey?: () => Promise<void> | void;
  onToggleWatchlist: (movieId: string) => void;
  onClearWatchlist?: () => void;
  onSelectMovie: (movie: Movie) => void;
  onOpenTrailer: (movie: Movie) => void;
  onDeleteReview: (reviewId: string) => Promise<void> | void;
  onOpenAddMovie: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onBackToCatalogue: () => void;
  onOpenEdit?: (movie: Movie) => void;
}

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

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  currentUser,
  moviesList,
  watchlist,
  trackingList = [],
  customTmdbApiKey,
  reviews = [],
  activeTheme = 'emerald',
  onSelectTheme,
  userCustomLists = [],
  onOpenCreateList,
  onOpenEditList,
  onDeleteCustomList,
  onViewStandaloneList,
  onUpdateStatus,
  onUpdateRewatchCount,
  onSaveApiKey,
  onRemoveApiKey,
  onToggleWatchlist,
  onClearWatchlist,
  onSelectMovie,
  onOpenTrailer,
  onDeleteReview,
  onOpenAddMovie,
  onOpenAuth,
  onSignOut,
  onBackToCatalogue,
  onOpenEdit
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('all_tracked');
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedUid, setCopiedUid] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // API Key Form State
  const [inputApiKey, setInputApiKey] = useState(customTmdbApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keyNotice, setKeyNotice] = useState<string | null>(null);

  // Sync prop changes into local input
  useEffect(() => {
    if (customTmdbApiKey !== undefined) {
      setInputApiKey(customTmdbApiKey || '');
    }
  }, [customTmdbApiKey]);

  // Pagination & Batching (Fixed batches of 12 items)
  const BATCH_SIZE = 12;
  const [trackedLimit, setTrackedLimit] = useState<number>(BATCH_SIZE);
  const [reviewsLimit, setReviewsLimit] = useState<number>(BATCH_SIZE);
  const [contributionsLimit, setContributionsLimit] = useState<number>(BATCH_SIZE);

  // Reset pagination limit when search query or tab changes
  useEffect(() => {
    setTrackedLimit(BATCH_SIZE);
    setReviewsLimit(BATCH_SIZE);
    setContributionsLimit(BATCH_SIZE);
  }, [searchFilter, activeTab]);

  // Normalize Tracking Items
  const effectiveTrackingList: UserTrackedItem[] = useMemo(() => {
    if (trackingList && trackingList.length > 0) {
      return trackingList;
    }
    // Fallback: convert legacy watchlist to plan_to_watch
    return watchlist.map(id => ({
      movieId: id,
      status: 'plan_to_watch' as MovieWatchStatus,
      rewatchCount: 0,
      updatedAt: new Date().toISOString()
    }));
  }, [trackingList, watchlist]);

  // Lookup map for fast status check
  const trackingMap = useMemo(() => {
    const map = new Map<string, UserTrackedItem>();
    effectiveTrackingList.forEach(item => {
      map.set(item.movieId, item);
    });
    return map;
  }, [effectiveTrackingList]);

  // Group tracked films
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

  // Tracked movies with movie objects
  const trackedMoviePairs = useMemo(() => {
    return effectiveTrackingList.map(item => {
      const movie = moviesList.find(m => m.id === item.movieId);
      return movie ? { item, movie } : null;
    }).filter(Boolean) as Array<{ item: UserTrackedItem; movie: Movie }>;
  }, [effectiveTrackingList, moviesList]);

  // Filtered by current tab status
  const currentTabTracked = useMemo(() => {
    if (activeTab === 'all_tracked') return trackedMoviePairs;
    return trackedMoviePairs.filter(p => p.item.status === activeTab);
  }, [trackedMoviePairs, activeTab]);

  // Filtered by search query
  const filteredTracked = useMemo(() => {
    if (!searchFilter.trim()) return currentTabTracked;
    const q = searchFilter.toLowerCase();
    return currentTabTracked.filter(({ movie }) => 
      movie.title.toLowerCase().includes(q) ||
      movie.director.toLowerCase().includes(q) ||
      movie.genres.some(g => g.toLowerCase().includes(q))
    );
  }, [currentTabTracked, searchFilter]);

  const visibleTracked = useMemo(() => {
    return filteredTracked.slice(0, trackedLimit);
  }, [filteredTracked, trackedLimit]);

  // Total watchtime calculation
  const totalWatchMinutes = useMemo(() => {
    return trackedMoviePairs.reduce((acc, { movie, item }) => {
      const duration = movie.runtimeMinutes || 100;
      const rewatches = item.status === 'completed' ? (item.rewatchCount || 0) : 0;
      return acc + (duration * (1 + rewatches));
    }, 0);
  }, [trackedMoviePairs]);

  const watchTimeHours = (totalWatchMinutes / 60).toFixed(1);

  // Personalized Recommendations
  const personalizedRecommendations = useMemo(() => {
    return getPersonalizedRecommendations(effectiveTrackingList, moviesList);
  }, [effectiveTrackingList, moviesList]);

  // 2. Resolve User's Reviews
  const userReviews: UserReview[] = useMemo(() => {
    if (!currentUser) return [];
    return reviews.filter((r: UserReview) => {
      if (r.userId && r.userId === currentUser.uid) return true;
      if (r.userEmail && currentUser.email && r.userEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
      if (!r.userId && !r.userEmail && currentUser.displayName && r.userName.toLowerCase() === currentUser.displayName.toLowerCase()) return true;
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

  // 3. Resolve User's Custom Film Contributions
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
    return userContributions.filter(m => 
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


  // Test TMDb API Key connection
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

  // Save personal API Key to Firestore
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

  // Remove personal API Key
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

  // Unauthenticated Guest View
  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20 shadow-inner">
              <Bookmark className="w-8 h-8" />
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Track Your Nollywood Journey
            </h2>

            <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
              Sign in with Firebase to organize films into multi-status categories (*Plan to Watch*, *Watching*, *Completed*), record rewatches, and get personalized recommendations.
            </p>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                id="profile-guest-signin-btn"
                onClick={onOpenAuth}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98"
              >
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>Sign In or Create Account</span>
              </button>
              <button
                onClick={onBackToCatalogue}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-sm transition-colors border border-slate-700"
              >
                Browse as Guest
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Profile View
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
          <button
            id="profile-nav-back-btn"
            onClick={onBackToCatalogue}
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>AfroMovieDB Catalogue</span>
          </button>
          <span>/</span>
          <span className="text-white font-medium">User Profile & Activity</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="profile-add-film-shortcut"
            onClick={onOpenAddMovie}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Contribute Film</span>
          </button>

          <button
            id="profile-signout-btn"
            onClick={onSignOut}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-red-950/40 text-slate-300 hover:text-red-400 border border-slate-800 hover:border-red-800/40 text-xs font-semibold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* User Header Profile Card */}
      <div className="bg-gradient-to-br from-slate-900/95 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Avatar and Main Info */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-emerald-500 to-amber-500 p-1 shadow-lg shadow-emerald-950/40">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Profile'}
                    className="w-full h-full rounded-xl object-cover bg-slate-900"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center text-2xl sm:text-3xl font-extrabold text-emerald-400">
                    {(currentUser.displayName || currentUser.email || 'N')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div 
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-slate-950"
                title="Active Firebase Session"
              >
                <Cloud className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {currentUser.displayName || 'Nollywood Patron'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Firebase Verified</span>
                </span>
                {customTmdbApiKey && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                    <Key className="w-3 h-3 text-amber-400" />
                    <span>Custom API Key Active</span>
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-400 font-mono">
                {currentUser.email}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Film className="w-3.5 h-3.5 text-amber-400" />
                  <span>AfroMovieDB Cinephile Member</span>
                </span>
                <span>•</span>
                <button
                  onClick={handleCopyUid}
                  className="flex items-center gap-1 hover:text-slate-300 transition-colors font-mono text-[11px]"
                  title="Copy User UID"
                >
                  <span>UID: {currentUser.uid.slice(0, 8)}...</span>
                  {copiedUid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick sync status pill */}
          <div className="w-full md:w-auto p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex md:flex-col items-center md:items-end justify-between gap-2 text-right">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Cloud Sync Active</span>
            </div>
            <span className="text-[11px] text-slate-400">
              Firestore DB Connected
            </span>
          </div>
        </div>
      </div>

      {/* Metric Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tracked Metric */}
        <div 
          onClick={() => setActiveTab('all_tracked')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'all_tracked'
              ? 'bg-slate-900 border-amber-500/50 shadow-lg shadow-amber-950/20'
              : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tracked Movies
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {effectiveTrackingList.length}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-semibold">{statusCounts.completed} Completed</span>
            <span>•</span>
            <span className="text-sky-400 font-semibold">{statusCounts.watching} Watching</span>
          </div>
        </div>

        {/* Watch Time Metric */}
        <div className="p-5 rounded-2xl border bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Nigerian Cinema Watch Time
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            ~{watchTimeHours} <span className="text-sm font-normal text-slate-400">Hrs</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span>Includes logged film rewatches</span>
          </div>
        </div>

        {/* Reviews Metric */}
        <div 
          onClick={() => setActiveTab('reviews')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'reviews'
              ? 'bg-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
              : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              My Reviews
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {userReviews.length}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <Star className="w-3.5 h-3.5 text-emerald-400/80 fill-emerald-400/80" />
            <span>{userReviews.length > 0 ? `Avg. ${avgUserRating} / 10 rating given` : 'No reviews posted yet'}</span>
          </div>
        </div>

        {/* API Settings Metric */}
        <div 
          onClick={() => setActiveTab('api_settings')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'api_settings'
              ? 'bg-slate-900 border-teal-500/50 shadow-lg shadow-teal-950/20'
              : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              API Quota & Keys
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-white tracking-tight flex items-center gap-1.5 mt-1">
            {customTmdbApiKey ? (
              <span className="text-emerald-400 flex items-center gap-1 text-sm font-semibold">
                <Check className="w-4 h-4 stroke-[3]" /> Personal Key
              </span>
            ) : (
              <span className="text-slate-300 text-sm font-semibold">Shared Default</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span>Configure external TMDb key</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation & Search Controls */}
      <div className="border-b border-slate-800 pb-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Scrollable Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            
            {/* All Tracked */}
            <button
              onClick={() => { setActiveTab('all_tracked'); setSearchFilter(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'all_tracked'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>All Tracked</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-950/40">
                {effectiveTrackingList.length}
              </span>
            </button>

            {/* Individual Status Tabs */}
            {(Object.keys(STATUS_CONFIG) as MovieWatchStatus[]).map((statusKey) => {
              const cfg = STATUS_CONFIG[statusKey];
              const count = statusCounts[statusKey];
              const isSelected = activeTab === statusKey;
              const IconComp = cfg.icon;

              return (
                <button
                  key={statusKey}
                  onClick={() => { setActiveTab(statusKey); setSearchFilter(''); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? `${cfg.bgClass} ${cfg.colorClass} border border-current shadow-md`
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{cfg.shortLabel}</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-950/40">
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Recommendations Tab */}
            <button
              onClick={() => { setActiveTab('recommendations'); setSearchFilter(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'recommendations'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-extrabold'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Recommended For You</span>
            </button>

            {/* Curated Lists Tab */}
            <button
              id="profile-tab-custom-lists"
              onClick={() => { setActiveTab('custom_lists'); setSearchFilter(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'custom_lists'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Curated Collections</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-950/40">
                {userCustomLists.length}
              </span>
            </button>

            {/* Reviews Tab */}
            <button
              onClick={() => { setActiveTab('reviews'); setSearchFilter(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'reviews'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Reviews</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-950/40">
                {userReviews.length}
              </span>
            </button>

            {/* Theme & Settings Tab */}
            <button
              id="profile-tab-settings"
              onClick={() => { setActiveTab('api_settings'); setSearchFilter(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'api_settings'
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Theme & Settings</span>
            </button>
          </div>

          {/* Search within Profile */}
          {activeTab !== 'api_settings' && (
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter titles or genres..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          )}
        </div>
      </div>

      {/* TAB CONTENT: 1. Multi-Status Tracked Films */}
      {(['all_tracked', 'plan_to_watch', 'watching', 'completed', 'on_hold', 'dropped'].includes(activeTab)) && (
        <div className="space-y-6">
          {visibleTracked.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 space-y-3">
              <Film className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">
                No movies found in this list
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchFilter ? 'Try clearing your search filter.' : 'Browse the AfroMovieDB catalog and select a status on any movie.'}
              </p>
              <button
                onClick={onBackToCatalogue}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
              >
                Discover Nollywood Films
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7 lg:gap-8">
                {visibleTracked.map(({ item, movie }) => {
                  const statusCfg = STATUS_CONFIG[item.status];
                  const IconComp = statusCfg.icon;

                  return (
                    <div 
                      key={`${item.movieId}-${item.status}`}
                      className="group flex flex-col rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 overflow-hidden shadow-lg transition-all"
                    >
                      {/* Top Poster banner */}
                      <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden cursor-pointer" onClick={() => onSelectMovie(movie)}>
                        <img 
                          src={movie.backdropUrl || movie.posterUrl} 
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                        
                        {/* Status Badge */}
                        <div className="absolute top-2.5 left-2.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${statusCfg.bgClass} ${statusCfg.colorClass} ${statusCfg.borderClass}`}>
                            <IconComp className="w-3 h-3" />
                            <span>{statusCfg.label}</span>
                          </span>
                        </div>

                        {/* Rating */}
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/80 text-amber-400 text-xs font-bold border border-slate-800">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{movie.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                        <div>
                          <h4 
                            onClick={() => onSelectMovie(movie)}
                            className="text-base font-bold text-white hover:text-emerald-400 transition-colors cursor-pointer line-clamp-1"
                          >
                            {movie.title}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                            {movie.releaseYear} • Dir. {movie.director}
                          </p>

                          <div className="flex flex-wrap items-center gap-1 mt-2">
                            {Array.from(new Set(movie.genres)).slice(0, 2).map((g, idx) => (
                              <span key={`${g}-${idx}`} className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                {g}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Rewatch Counter for Completed Films */}
                        {item.status === 'completed' && onUpdateRewatchCount && (
                          <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                            <span className="flex items-center gap-1 font-medium">
                              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Rewatched:</span>
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => onUpdateRewatchCount(item.movieId, Math.max(0, (item.rewatchCount || 0) - 1))}
                                className="w-5 h-5 rounded flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-colors"
                                title="Decrease rewatches"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold text-white text-xs w-4 text-center">
                                {item.rewatchCount || 0}
                              </span>
                              <button
                                onClick={() => onUpdateRewatchCount(item.movieId, (item.rewatchCount || 0) + 1)}
                                className="w-5 h-5 rounded flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-colors"
                                title="Add rewatch"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Action Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                          {onUpdateStatus && (
                            <TrackingStatusPicker 
                              movieId={movie.id}
                              currentStatus={item.status}
                              onUpdateStatus={onUpdateStatus}
                              size="sm"
                            />
                          )}

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onOpenTrailer(movie)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Play Trailer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                            <button
                              onClick={() => onSelectMovie(movie)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More Button */}
              {trackedLimit < filteredTracked.length && (
                <div className="pt-6 flex flex-col items-center justify-center gap-2">
                  <span className="text-xs text-slate-400">
                    Showing <strong className="text-white">{visibleTracked.length}</strong> of <strong className="text-white">{filteredTracked.length}</strong> tracked films
                  </span>
                  <button
                    onClick={() => setTrackedLimit(prev => prev + BATCH_SIZE)}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700/80 hover:border-emerald-500/50 text-xs font-bold transition-all shadow-md flex items-center gap-2"
                  >
                    <ChevronDown className="w-4 h-4" />
                    <span>Load More</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB CONTENT: 2. Personalized 'Recommended For You' */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-amber-950/30 border border-emerald-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white tracking-tight">Personalized Nollywood Recommendations</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                Our algorithm analyzed the genres, directors, and lead actors from your tracking list to find untracked gems you'll love.
              </p>
            </div>
            <button
              onClick={onBackToCatalogue}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors shrink-0"
            >
              Explore Full Archive
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7 lg:gap-8">
            {personalizedRecommendations.map(({ movie, reason, matchingGenres, matchingDirector, matchingActors }) => (
              <div
                key={`rec-${movie.id}`}
                className="group flex flex-col rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 overflow-hidden shadow-lg transition-all"
              >
                {/* Poster */}
                <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden cursor-pointer" onClick={() => onSelectMovie(movie)}>
                  <img 
                    src={movie.backdropUrl || movie.posterUrl} 
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/90 text-slate-950 shadow-md">
                      Top Match
                    </span>
                  </div>

                  <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/80 text-amber-400 text-xs font-bold border border-slate-800">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{movie.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Body & Affinity Explanation */}
                <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                  <div>
                    <h4 
                      onClick={() => onSelectMovie(movie)}
                      className="text-base font-bold text-white hover:text-emerald-400 transition-colors cursor-pointer line-clamp-1"
                    >
                      {movie.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                      {movie.releaseYear} • Dir. {movie.director}
                    </p>

                    {/* Affinity Reason Badge */}
                    <div className="mt-2.5 p-2 rounded-xl bg-slate-950 border border-emerald-500/20 text-[11px] text-emerald-300/90 leading-tight flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    {onUpdateStatus && (
                      <button
                        onClick={() => onUpdateStatus(movie.id, 'plan_to_watch')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-semibold transition-all border border-amber-500/40"
                      >
                        <Bookmark className="w-3 h-3" />
                        <span>+ Plan to Watch</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenTrailer(movie)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Watch Trailer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        onClick={() => onSelectMovie(movie)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Curated Themed User Collections */}
      {activeTab === 'custom_lists' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <span>My Curated Film Collections</span>
              </h3>
              <p className="text-xs text-slate-400 max-w-xl">
                Create themed movie collections (e.g., 'Top 10 Epic Costumes', 'Best of Funke Akindele'). Each collection gets a public shareable deep link and dedicated standalone web page view.
              </p>
            </div>

            {onOpenCreateList && (
              <button
                id="btn-create-new-collection"
                onClick={onOpenCreateList}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold transition-all shadow-md active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Curate New Collection</span>
              </button>
            )}
          </div>

          {userCustomLists.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 space-y-3">
              <Layers className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No custom collections created yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Group Nollywood films into shareable lists with custom descriptions, notes, and standalone presentation views.
              </p>
              {onOpenCreateList && (
                <button
                  onClick={onOpenCreateList}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  Create Your First Collection
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {userCustomLists.map((list) => {
                const listMovies = list.movieIds
                  .map(id => moviesList.find(m => m.id === id))
                  .filter((m): m is Movie => Boolean(m));

                const shareUrl = `${window.location.origin}${window.location.pathname}?list=${encodeURIComponent(list.id)}`;

                return (
                  <div 
                    key={list.id}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            list.isPublic ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {list.isPublic ? 'Public Web Page' : 'Private Draft'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 capitalize">
                            Theme: {list.theme || 'emerald'}
                          </span>
                        </div>

                        <span className="text-xs text-slate-400 font-mono">
                          {list.movieIds.length} Films
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white hover:text-purple-300 transition-colors">
                        {list.title}
                      </h4>

                      {list.description && (
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {list.description}
                        </p>
                      )}

                      {/* Movie poster thumbnails preview */}
                      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                        {listMovies.slice(0, 5).map(m => (
                          <img 
                            key={m.id}
                            src={m.posterUrl} 
                            alt={m.title}
                            title={m.title}
                            className="w-10 h-14 object-cover rounded bg-slate-800 border border-slate-700/60 shrink-0" 
                          />
                        ))}
                        {listMovies.length > 5 && (
                          <div className="w-10 h-14 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                            +{listMovies.length - 5}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {onViewStandaloneList && (
                          <button
                            onClick={() => onViewStandaloneList(list)}
                            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                            title="Open clean standalone public web page view"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Standalone View</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(shareUrl);
                            setKeyNotice(`Copied public link for "${list.title}"!`);
                            setTimeout(() => setKeyNotice(null), 3500);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
                          title="Copy shareable link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share Link</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {onOpenEditList && (
                          <button
                            onClick={() => onOpenEditList(list)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit collection"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteCustomList && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete collection "${list.title}"?`)) {
                                onDeleteCustomList(list.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                            title="Delete collection"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 3. Theme & Secure API Keys Settings */}
      {activeTab === 'api_settings' && (
        <div className="max-w-3xl space-y-6">
          
          {/* Theme & Accent Color Customization Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Theme & Accent Color Customization
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Seamlessly switch between Nigerian Emerald, Royal Gold, and Deep Obsidian tones across the entire application interface.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shrink-0 capitalize">
                Active: {activeTheme}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* 1. Nigerian Emerald */}
              <div
                id="theme-option-emerald"
                onClick={() => onSelectTheme?.('emerald')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  activeTheme === 'emerald'
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500/50'
                    : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-500 shadow" />
                    <span className="text-sm font-bold text-white">Nigerian Emerald</span>
                  </div>
                  {activeTheme === 'emerald' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Rich green and vibrant teal accents celebrating the timeless spirit of Nollywood.
                </p>
                <div className="pt-2 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">Classic</span>
                  <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-400 text-[10px] font-bold">Vibrant</span>
                </div>
              </div>

              {/* 2. Royal Gold */}
              <div
                id="theme-option-gold"
                onClick={() => onSelectTheme?.('gold')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  activeTheme === 'gold'
                    ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/50 ring-1 ring-amber-500/50'
                    : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-500 shadow" />
                    <span className="text-sm font-bold text-white">Royal Gold</span>
                  </div>
                  {activeTheme === 'gold' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Radiant gold and warm metallic tones inspired by Nollywood red carpets and ₦1B+ records.
                </p>
                <div className="pt-2 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">Prestige</span>
                  <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-bold">Royal</span>
                </div>
              </div>

              {/* 3. Deep Obsidian */}
              <div
                id="theme-option-obsidian"
                onClick={() => onSelectTheme?.('obsidian')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  activeTheme === 'obsidian'
                    ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-950/50 ring-1 ring-purple-500/50'
                    : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-purple-500 shadow" />
                    <span className="text-sm font-bold text-white">Deep Obsidian</span>
                  </div>
                  {activeTheme === 'obsidian' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Midnight onyx and electric violet hues crafted for modern, immersive cinema sessions.
                </p>
                <div className="pt-2 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-bold">Midnight</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">Violet</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-teal-400" />
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Personal External API Keys & Quota Settings
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Provide your personal The Movie Database (TMDb) v3 API key. All movie discovery, deep-casts, and historical sweeps will prioritize your key to avoid shared daily rate limits.
                </p>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${
                customTmdbApiKey 
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' 
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}>
                {customTmdbApiKey ? 'Custom Key Active' : 'Default Key'}
              </span>
            </div>

            {/* API Key Input Section */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                TMDb API v3 Key
              </label>

              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={inputApiKey}
                  onChange={(e) => setInputApiKey(e.target.value)}
                  placeholder="e.g. 15d2ea6d0dc1d476efbca3eba2b9bbfb"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                  title={showApiKey ? 'Hide API key' : 'Show API key'}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <p className="text-[11px] text-slate-500">
                Stored privately in your Firestore user document (`/users/{currentUser.uid}`). Security rules forbid any other user from reading or modifying your key.
              </p>
            </div>

            {/* Test Connection Result */}
            {testResult && (
              <div className={`p-3.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                testResult.valid
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              }`}>
                {testResult.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Save Feedback Notice */}
            {keyNotice && (
              <div className="p-3.5 rounded-xl text-xs font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{keyNotice}</span>
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800">
              <button
                id="btn-test-tmdb-key"
                onClick={handleTestKey}
                disabled={isTestingKey || !inputApiKey.trim()}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold transition-all flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingKey ? 'animate-spin' : ''}`} />
                <span>{isTestingKey ? 'Verifying...' : 'Test Connection'}</span>
              </button>

              <button
                id="btn-save-tmdb-key"
                onClick={handleSaveApiKey}
                disabled={isSavingKey || !inputApiKey.trim()}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingKey ? 'Saving to Cloud...' : 'Save API Key'}</span>
              </button>

              {customTmdbApiKey && (
                <button
                  id="btn-remove-tmdb-key"
                  onClick={handleRemoveApiKey}
                  disabled={isSavingKey}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all"
                >
                  Reset to Default
                </button>
              )}
            </div>

            {/* TMDb Account Instructions */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-300">
                <Info className="w-4 h-4 text-teal-400" />
                <span>How to get a free personal TMDb API Key:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-slate-400">
                <li>Create an account at <a href="https://www.themoviedb.org/signup" target="_blank" rel="noreferrer" className="text-teal-400 hover:underline">themoviedb.org</a>.</li>
                <li>Go to Account Settings &gt; API and click "Create".</li>
                <li>Select "Developer", agree to terms, and copy your 32-character API Key (v3 auth).</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. Reviews & 5. Contributions */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {visibleReviews.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No reviews found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Explore any movie card and post your first critique.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleReviews.map((r: UserReview) => {
                const movie = moviesList.find(m => m.id === r.movieId);
                return (
                  <div key={r.id} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{movie?.title || r.movieId}</span>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 text-amber-400 text-xs font-bold">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{r.rating}/10</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{r.comment}</p>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Posted {r.createdAt} • {r.userLocation}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {movie && (
                        <button
                          onClick={() => onSelectMovie(movie)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
                        >
                          View Film
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReviewClick(r.id)}
                        disabled={deletingReviewId === r.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                        title="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'contributions' && (
        <div className="space-y-4">
          {visibleContributions.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 space-y-3">
              <Film className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No film contributions yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Add unindexed Nigerian movies or VHS classics to the AfroMovieDB catalog.
              </p>
              <button
                onClick={onOpenAddMovie}
                className="mt-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all"
              >
                Contribute a Film
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleContributions.map((movie) => (
                <div key={movie.id} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 
                      onClick={() => onSelectMovie(movie)}
                      className="text-sm font-bold text-white hover:text-teal-400 transition-colors cursor-pointer truncate"
                    >
                      {movie.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {movie.releaseYear} • Dir. {movie.director}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <button
                      onClick={() => onSelectMovie(movie)}
                      className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
