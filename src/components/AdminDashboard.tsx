import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User } from 'firebase/auth';
import { 
  Shield, Users, RefreshCw, Trash2, CheckCircle2, 
  AlertCircle, Search, Film, Crown, UserCheck, ArrowLeft,
  Database, Loader2, Copy, Check, Globe,
  Play, Filter, Eye, Lock
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { 
  subscribeToAllUsers, 
  updateUserRole, 
  isUserOwner, 
  saveFirestoreCustomMovie,
  purgeNonNigerianMoviesFromFirestore,
  PurgeResult,
  PRIMARY_OWNER_UID,
  PRIMARY_OWNER_EMAIL
} from '../lib/firestoreService';
import { 
  searchMoviesOnline, 
  pullMovieDetailsFromOnline, 
  bulkSyncNigerianNewReleases,
  runDeepHistoricalSweep,
  HistoricalSweepProgress,
  WebMovieCandidate,
  POPULAR_NIGERIAN_WEB_SUGGESTIONS,
  hasExplicitNigerianOrigin
} from '../utils/api';
import { extractOriginCountries } from '../utils/nigerianMovieValidator';
import { 
  evaluateTmdbSearchResults, 
  canSaveVerifiedTmdbMovie 
} from '../utils/tmdbIngestion';
import { AppUserProfile, Movie, UserRole, AppTheme } from '../types';

interface AdminDashboardProps {
  currentUser: User | null;
  onNavigateHome: () => void;
  moviesList: Movie[];
  activeTheme?: AppTheme;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onNavigateHome,
  moviesList,
  activeTheme = 'emerald'
}) => {
  // Tabs: 'import' | 'sweeps' | 'users'
  const [activeTab, setActiveTab] = useState<'import' | 'sweeps' | 'users'>('import');

  // ==========================================
  // TAB A: ONLINE SEARCH (TMDB) INGESTION STATE
  // ==========================================
  const [tmdbQuery, setTmdbQuery] = useState('');
  const [isSearchingTmdb, setIsSearchingTmdb] = useState(false);
  const [tmdbCandidates, setTmdbCandidates] = useState<WebMovieCandidate[]>([]);
  const [pullingTmdbId, setPullingTmdbId] = useState<number | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Staged Movie Preview & Verification
  const [stagedMovie, setStagedMovie] = useState<Partial<Movie> | null>(null);
  const [isSavingStaged, setIsSavingStaged] = useState(false);
  const [stagedSuccessMessage, setStagedSuccessMessage] = useState<string | null>(null);

  // ==========================================
  // TAB B: CATALOG SWEEP & PURGE STATE
  // ==========================================
  const [isPurging, setIsPurging] = useState(false);
  const [purgeReport, setPurgeReport] = useState<PurgeResult | null>(null);
  const [purgeError, setPurgeError] = useState<string | null>(null);
  const [isSyncingReleases, setIsSyncingReleases] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  
  // Historical sweep state inside admin panel
  const [isHistoricalSweeping, setIsHistoricalSweeping] = useState(false);
  const [sweepProgress, setSweepProgress] = useState<HistoricalSweepProgress | null>(null);
  const sweepAbortRef = useRef<AbortController | null>(null);

  // ==========================================
  // TAB C: USER MANAGEMENT & ROLE ASSIGNMENT STATE
  // ==========================================
  const [usersList, setUsersList] = useState<AppUserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [copiedUid, setCopiedUid] = useState<string | null>(null);
  const [roleActionToast, setRoleActionToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Current viewer permissions
  const isOwnerViewer = isUserOwner(currentUser);

  // Subscribe to live user list for Tab C
  useEffect(() => {
    setUsersLoading(true);
    const unsubscribe = subscribeToAllUsers((users) => {
      setUsersList(users);
      setUsersLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const q = userSearchQuery.trim().toLowerCase();
      const matchesSearch = 
        !q ||
        (u.displayName && u.displayName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        u.uid.toLowerCase().includes(q);

      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [usersList, userSearchQuery, userRoleFilter]);

  const canSaveStagedMovie = useMemo(
    () => canSaveVerifiedTmdbMovie(stagedMovie, searchError),
    [stagedMovie, searchError]
  );

  // Copy UID helper
  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  // Role promotion / revocation handler
  const handleUpdateRole = async (targetUser: AppUserProfile, newRole: UserRole) => {
    if (targetUser.uid === PRIMARY_OWNER_UID || (targetUser.email && targetUser.email.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase())) {
      setRoleActionToast({
        message: 'The Primary System Owner cannot be modified or demoted.',
        type: 'error'
      });
      return;
    }

    if (!isOwnerViewer && newRole === 'admin') {
      setRoleActionToast({
        message: 'Permission Denied: Only the Primary Owner can assign the Admin role.',
        type: 'error'
      });
      return;
    }

    if (!isOwnerViewer && targetUser.role === 'admin') {
      setRoleActionToast({
        message: 'Permission Denied: Only the Primary Owner can alter existing Admin accounts.',
        type: 'error'
      });
      return;
    }

    setUpdatingUserId(targetUser.uid);
    try {
      await updateUserRole(targetUser.uid, newRole, targetUser.email);
      setRoleActionToast({
        message: `Successfully changed role of ${targetUser.displayName || targetUser.email || targetUser.uid} to "${newRole.toUpperCase()}".`,
        type: 'success'
      });
      setTimeout(() => setRoleActionToast(null), 4000);
    } catch (err: any) {
      setRoleActionToast({
        message: err?.message || 'Failed to update user role in Firestore.',
        type: 'error'
      });
      setTimeout(() => setRoleActionToast(null), 5000);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ==========================================
  // TAB A ACTIONS: ONLINE SEARCH (TMDB) ONLY
  // ==========================================
  const handleSearchTmdb = async (overrideQuery?: string) => {
    const queryToSearch = (overrideQuery !== undefined ? overrideQuery : tmdbQuery).trim();
    if (!queryToSearch) return;
    if (overrideQuery !== undefined) {
      setTmdbQuery(overrideQuery);
    }

    setIsSearchingTmdb(true);
    setSearchError(null);
    setStagedSuccessMessage(null);
    setStagedMovie(null);
    setTmdbCandidates([]);

    try {
      const results = await searchMoviesOnline(queryToSearch, true);
      const evaluation = evaluateTmdbSearchResults(queryToSearch, results);
      if (evaluation.errorMessage) {
        setSearchError(evaluation.errorMessage);
        setTmdbCandidates([]);
        setStagedMovie(null);
      } else {
        setTmdbCandidates(evaluation.candidates.slice(0, 8));
      }
    } catch (err: any) {
      setTmdbCandidates([]);
      setStagedMovie(null);
      setSearchError(err?.message || `No verified Nigerian film found for "${queryToSearch}". Failed to query TMDb.`);
    } finally {
      setIsSearchingTmdb(false);
    }
  };

  const handleSelectTmdbCandidate = async (cand: WebMovieCandidate) => {
    if (!hasExplicitNigerianOrigin(cand)) {
      setStagedMovie(null);
      setSearchError(`No verified Nigerian film found: "${cand.title}" lacks strict origin_country: ['NG'].`);
      return;
    }

    setPullingTmdbId(cand.tmdbId);
    setSearchError(null);
    setStagedSuccessMessage(null);

    try {
      const fullMovie = await pullMovieDetailsFromOnline(cand, true);
      if (!canSaveVerifiedTmdbMovie(fullMovie)) {
        setStagedMovie(null);
        setSearchError(`No verified Nigerian film found: "${fullMovie.title || cand.title}" failed strict origin_country: ['NG'] verification.`);
        return;
      }
      setStagedMovie(fullMovie);
    } catch (err: any) {
      setStagedMovie(null);
      setSearchError(err?.message || 'No verified Nigerian film found: could not pull details from TMDb.');
    } finally {
      setPullingTmdbId(null);
    }
  };

  const handleSaveStagedMovie = async () => {
    if (!canSaveVerifiedTmdbMovie(stagedMovie, searchError) || !stagedMovie?.title || !stagedMovie?.id) {
      setSearchError('No verified Nigerian film found. Saving to Firestore is disabled without a verified TMDb match (origin_country: ["NG"]).');
      return;
    }

    const activeUid = currentUser?.uid || auth.currentUser?.uid;
    if (!activeUid) {
      setSearchError('Authentication required: please sign in before saving to Firestore.');
      return;
    }

    const verifiedCountries = extractOriginCountries(stagedMovie);
    if (!verifiedCountries.includes('NG')) {
      setSearchError('Validation Error: Movie does not include explicit originCountry: ["NG"].');
      return;
    }

    setIsSavingStaged(true);
    setSearchError(null);
    try {
      const movieToSave: Movie = {
        ...(stagedMovie as Movie),
        addedByUserId: activeUid,
        originCountry: verifiedCountries,
        isUserAdded: true,
        source: 'web_pulled'
      };

      await saveFirestoreCustomMovie(movieToSave, activeUid);
      setStagedSuccessMessage(`"${movieToSave.title}" verified & saved to Cloud Firestore catalog!`);
      setTimeout(() => {
        setStagedSuccessMessage(null);
        setStagedMovie(null);
      }, 2500);
    } catch (err: any) {
      setSearchError(err?.message || 'Failed to save movie to Firestore.');
    } finally {
      setIsSavingStaged(false);
    }
  };

  // ==========================================
  // TAB B ACTIONS: PURGE & SWEEPS
  // ==========================================
  const handleRunPurge = async () => {
    setIsPurging(true);
    setPurgeReport(null);
    setPurgeError(null);
    try {
      const report = await purgeNonNigerianMoviesFromFirestore();
      setPurgeReport(report);
    } catch (err: any) {
      setPurgeError(`Purge failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsPurging(false);
    }
  };

  const handleSyncReleases = async () => {
    setIsSyncingReleases(true);
    setSyncStatusMsg('Scanning recent Nollywood releases on TMDb...');
    try {
      const added = await bulkSyncNigerianNewReleases(
        50,
        (synced, total) => {
          setSyncStatusMsg(`Ingested ${synced} of ${total} titles...`);
        },
        moviesList,
        10,
        currentUser?.uid || undefined
      );
      setSyncStatusMsg(`Sync complete! ${added.length} verified authentic Nollywood release(s) added.`);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } catch (err: any) {
      setSyncStatusMsg(`Sync error: ${err?.message || 'Failed'}`);
    } finally {
      setIsSyncingReleases(false);
    }
  };

  const handleStartHistoricalSweep = () => {
    setIsHistoricalSweeping(true);
    const controller = new AbortController();
    sweepAbortRef.current = controller;

    runDeepHistoricalSweep(
      moviesList,
      (progress) => {
        setSweepProgress(progress);
        if (progress.isComplete || progress.isCancelled) {
          setIsHistoricalSweeping(false);
        }
      },
      5,
      controller.signal
    ).catch((err) => {
      console.warn('Historical sweep interrupted:', err);
      setIsHistoricalSweeping(false);
    });
  };

  const handleStopHistoricalSweep = () => {
    if (sweepAbortRef.current) {
      sweepAbortRef.current.abort();
    }
    setIsHistoricalSweeping(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Return to Catalogue"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-cinema font-bold text-white tracking-wide">
                NaijaReel Admin Command Center
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {isOwnerViewer ? 'Primary Owner' : 'Administrator'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manage Nollywood catalog metadata, run data integrity sweeps, and govern user roles.
            </p>
          </div>
        </div>

        {/* Global Catalog Count Metric */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2 text-xs">
          <Database className="w-4 h-4 text-amber-400" />
          <span className="text-slate-400">Live Catalog Size:</span>
          <span className="font-bold text-white font-mono">{moviesList.length} films</span>
        </div>
      </div>

      {/* Toast notification banner */}
      {roleActionToast && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-sm transition-all animate-fadeIn ${
          roleActionToast.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200' 
            : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {roleActionToast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{roleActionToast.message}</span>
          </div>
          <button 
            onClick={() => setRoleActionToast(null)}
            className="text-xs font-semibold px-2 py-1 rounded bg-slate-900/50 hover:bg-slate-900 text-slate-300 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer select-none ${
            activeTab === 'import'
              ? 'bg-gradient-to-r from-emerald-500 to-amber-500 text-slate-950 font-bold shadow-md shadow-emerald-950/40'
              : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Online Search (TMDb)</span>
        </button>

        <button
          onClick={() => setActiveTab('sweeps')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer select-none ${
            activeTab === 'sweeps'
              ? 'bg-gradient-to-r from-emerald-500 to-amber-500 text-slate-950 font-bold shadow-md shadow-emerald-950/40'
              : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Catalog Sweep & Purge</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer select-none ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-emerald-500 to-amber-500 text-slate-950 font-bold shadow-md shadow-emerald-950/40'
              : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management & RBAC</span>
          <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-950/60 font-mono text-slate-300">
            {usersList.length}
          </span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB A: ONLINE SEARCH (TMDB) — SOLE INGESTION ENGINE */}
      {/* ==================================================================== */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Online Search (TMDb) Input & Verified Candidates */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-amber-400" />
                    Online Search (TMDb)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Search verified TMDb records strictly filtered by <code className="text-emerald-400 font-mono">origin_country: ['NG']</code>. Real database matches only.
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold tracking-wide shrink-0 self-start sm:self-center">
                  Verified TMDb Only
                </span>
              </div>

              {searchError && (
                <div 
                  role="alert"
                  className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{searchError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search Nigerian movie title on TMDb (e.g. Anikulapo, Jagun Jagun)..."
                    value={tmdbQuery}
                    onChange={(e) => setTmdbQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchTmdb()}
                    className="flex-1 px-4 py-2.5 bg-slate-950/90 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSearchTmdb()}
                    disabled={isSearchingTmdb || !tmdbQuery.trim()}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSearchingTmdb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>Search</span>
                  </button>
                </div>

                {/* Quick Real-Title TMDb Lookups */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Search TMDb Title:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_NIGERIAN_WEB_SUGGESTIONS.slice(0, 8).map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSearchTmdb(suggestion)}
                        disabled={isSearchingTmdb}
                        className="px-2.5 py-1 text-[11px] rounded-lg border bg-slate-950/60 text-slate-300 border-slate-800 hover:border-amber-500/50 hover:text-amber-300 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {tmdbCandidates.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Verified Nigerian TMDb Matches ({tmdbCandidates.length})
                    </p>
                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {tmdbCandidates.map((c) => (
                        <div 
                          key={c.tmdbId}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                            stagedMovie?.tmdbId === c.tmdbId
                              ? 'bg-slate-950 border-emerald-500/50 ring-1 ring-emerald-500/20'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {c.posterUrl ? (
                              <img src={c.posterUrl} alt={c.title} className="w-10 h-14 object-cover rounded-lg shrink-0 border border-slate-700" />
                            ) : (
                              <div className="w-10 h-14 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                                <Film className="w-5 h-5 text-slate-500" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-white line-clamp-1">{c.title}</h4>
                              <p className="text-xs text-slate-400">
                                {c.releaseYear} • TMDb #{c.tmdbId} • {c.rating > 0 ? `⭐ ${c.rating.toFixed(1)}` : 'Unrated'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectTmdbCandidate(c)}
                            disabled={pullingTmdbId === c.tmdbId}
                            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                          >
                            {pullingTmdbId === c.tmdbId ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Pulling...</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Right: Metadata Preview & Verification Card */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Metadata & Origin Verification
                  </h3>
                  {canSaveStagedMovie && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      TMDb Verified NG
                    </span>
                  )}
                </div>

                {stagedSuccessMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{stagedSuccessMessage}</span>
                  </div>
                )}

                {!stagedMovie ? (
                  <div className="py-16 text-center text-slate-500 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                      <Film className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-medium text-slate-300">
                      {searchError ? 'No verified Nigerian film found' : 'No verified TMDb match staged'}
                    </p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      {searchError
                        ? 'Saving to Firestore is disabled until a real Nigerian film (origin_country: ["NG"]) is found and previewed from TMDb.'
                        : 'Search TMDb on the left and click Preview on a verified Nigerian match to inspect real database metadata.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    {/* Visual Asset Preview */}
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-800 group flex items-center justify-center">
                      {stagedMovie.backdropUrl || stagedMovie.posterUrl ? (
                        <img 
                          src={stagedMovie.backdropUrl || stagedMovie.posterUrl} 
                          alt={stagedMovie.title}
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <Film className="w-10 h-10 text-slate-700" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-3 flex flex-col justify-end">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                          {stagedMovie.era} • TMDb #{stagedMovie.tmdbId}
                        </span>
                        <h4 className="text-base font-cinema font-bold text-white">
                          {stagedMovie.title} ({stagedMovie.releaseYear})
                        </h4>
                        {stagedMovie.tagline && (
                          <p className="text-[11px] text-slate-300 line-clamp-1 italic">
                            "{stagedMovie.tagline}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Verification Badges */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                        <span className="text-slate-500 block">Origin:</span>
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {(stagedMovie.originCountry || []).join(', ')}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                        <span className="text-slate-500 block">Director:</span>
                        <span className="font-bold text-slate-200 truncate block">
                          {stagedMovie.director || 'Not listed on TMDb'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                        <span className="text-slate-500 block">Languages:</span>
                        <span className="font-bold text-slate-200 truncate block">
                          {stagedMovie.languages?.join(', ') || 'Not listed'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                        <span className="text-slate-500 block">Lead Cast:</span>
                        <span className="font-bold text-slate-200 truncate block">
                          {stagedMovie.leadCast && stagedMovie.leadCast.length > 0
                            ? stagedMovie.leadCast.map(c => c.actor).slice(0, 2).join(', ')
                            : 'Not listed on TMDb'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 block mb-1">Synopsis:</span>
                      <p className="text-slate-300 leading-relaxed line-clamp-4">
                        {stagedMovie.synopsis || 'No synopsis returned from TMDb.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 mt-4 flex items-center gap-3">
                {stagedMovie && (
                  <button
                    type="button"
                    onClick={() => setStagedMovie(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Discard
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveStagedMovie}
                  disabled={!canSaveStagedMovie || isSavingStaged}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md"
                >
                  {isSavingStaged ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Cloud...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save to Cloud Catalog</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB B: CATALOG SWEEP & PURGE */}
      {/* ==================================================================== */}
      {activeTab === 'sweeps' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Card 1: Strict Regional Origin Purge */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-3">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Regional Origin Purge
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Permanently deletes documents in <code className="text-rose-300">custom_movies</code> where <code className="text-amber-300">originCountry</code> lacks authentic Nigerian tags or features foreign production studios.
                </p>

                {purgeError && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2 mb-4">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{purgeError}</span>
                  </div>
                )}

                {purgeReport && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1 mb-4 font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Scanned Documents:</span>
                      <span className="text-slate-200">{purgeReport.totalScanned}</span>
                    </div>
                    <div className="flex justify-between text-rose-400 font-bold">
                      <span>Purged Foreign Films:</span>
                      <span>{purgeReport.purgedCount}</span>
                    </div>
                    {purgeReport.purgedTitles && purgeReport.purgedTitles.length > 0 && (
                      <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800">
                        Purged: {purgeReport.purgedTitles.slice(0, 3).join(', ')}
                        {purgeReport.purgedTitles.length > 3 && ` +${purgeReport.purgedTitles.length - 3} more`}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleRunPurge}
                disabled={isPurging}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-md"
              >
                {isPurging ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Purging Cloud Database...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Run Regional Origin Purge</span>
                  </>
                )}
              </button>
            </div>

            {/* Card 2: Deep Historical Archive Sweep */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3">
                  <RefreshCw className={`w-5 h-5 ${isHistoricalSweeping ? 'animate-spin' : ''}`} />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  Historical Archive Sweep
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Multi-era archive sweep pulling verified Golden Era (1992-2005), New Nollywood (2006-2018), and Modern Nollywood films with safe early export.
                </p>

                {sweepProgress && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2 mb-4 font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Era:</span>
                      <span className="text-amber-400 font-bold">{sweepProgress.decadeLabel}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Status:</span>
                      <span className="text-slate-200">{sweepProgress.statusText}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Imported:</span>
                      <span className="text-emerald-400 font-bold">{sweepProgress.importedCount} films</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-amber-500 h-full transition-all"
                        style={{ width: `${sweepProgress.percent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {!isHistoricalSweeping ? (
                  <button
                    onClick={handleStartHistoricalSweep}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all cursor-pointer shadow-md"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>Start Archive Sweep</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopHistoricalSweep}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    title="Gracefully stop sweep and preserve all swept movies in Firestore"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Finished (Save & Stop)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Card 3: Bulk Release Sync */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  New Release Ingestion
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Fetches newly premiered Nigerian cinematic titles and streaming releases from official studio distribution logs.
                </p>

                {syncStatusMsg && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-300 mb-4 font-mono flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span className="truncate">{syncStatusMsg}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleSyncReleases}
                disabled={isSyncingReleases}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSyncingReleases ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Syncing Ingest Pipeline...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Run Release Sync Now</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB C: USER MANAGEMENT & ROLE ASSIGNMENT */}
      {/* ==================================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block mb-1">Total Registered Users</span>
              <span className="text-2xl font-bold font-mono text-white">{usersList.length}</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-amber-400 block mb-1">System Owners</span>
              <span className="text-2xl font-bold font-mono text-amber-300">
                {usersList.filter(u => u.role === 'owner').length}
              </span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-purple-400 block mb-1">Admins</span>
              <span className="text-2xl font-bold font-mono text-purple-300">
                {usersList.filter(u => u.role === 'admin').length}
              </span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-emerald-400 block mb-1">Moderators</span>
              <span className="text-2xl font-bold font-mono text-emerald-300">
                {usersList.filter(u => u.role === 'moderator').length}
              </span>
            </div>
          </div>

          {/* Table Controls (Search & Filter) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search user by name, email, or UID..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-400">Filter:</span>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">All Roles ({usersList.length})</option>
                <option value="owner">Owners</option>
                <option value="admin">Admins</option>
                <option value="moderator">Moderators</option>
                <option value="user">Standard Users</option>
              </select>
            </div>
          </div>

          {/* Real-time Users Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">User</th>
                    <th className="py-3.5 px-4 font-semibold">Email</th>
                    <th className="py-3.5 px-4 font-semibold">Role Badge</th>
                    <th className="py-3.5 px-4 font-semibold">Firebase UID</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions & Role Governance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                        <span>Querying Firestore user directory...</span>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        No users found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isOwnerUser = u.uid === PRIMARY_OWNER_UID || (!!u.email && u.email.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase()) || u.role === 'owner';
                      const isUpdating = updatingUserId === u.uid;

                      return (
                        <tr key={u.uid} className="hover:bg-slate-800/40 transition-colors">
                          {/* User Name & Avatar */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {u.photoURL ? (
                                <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs">
                                  {(u.displayName || u.email || 'U')[0].toUpperCase()}
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-white block text-sm">
                                  {u.displayName || 'Anonymous User'}
                                </span>
                                {isOwnerUser && (
                                  <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                                    <Crown className="w-3 h-3 text-amber-400" /> System Owner
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="py-3.5 px-4 text-slate-300 font-mono">
                            {u.email || <span className="text-slate-500 italic">No email linked</span>}
                          </td>

                          {/* Role Badge */}
                          <td className="py-3.5 px-4">
                            {u.role === 'owner' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300">
                                <Crown className="w-3 h-3 text-amber-400" />
                                Owner
                              </span>
                            ) : u.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 border border-purple-500/40 text-purple-300">
                                <Shield className="w-3 h-3 text-purple-400" />
                                Admin
                              </span>
                            ) : u.role === 'moderator' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
                                <UserCheck className="w-3 h-3 text-emerald-400" />
                                Moderator
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-400">
                                User
                              </span>
                            )}
                          </td>

                          {/* UID Snippet with Copy */}
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleCopyUid(u.uid)}
                              className="group flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors font-mono text-[11px] cursor-pointer"
                              title="Click to copy full UID"
                            >
                              <span>{u.uid.slice(0, 10)}...</span>
                              {copiedUid === u.uid ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                              )}
                            </button>
                          </td>

                          {/* Inline Governance Actions */}
                          <td className="py-3.5 px-4 text-right">
                            {isOwnerUser ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-medium bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg select-none">
                                <Lock className="w-3 h-3" />
                                System Owner (Immutable)
                              </span>
                            ) : isUpdating ? (
                              <span className="text-xs text-slate-400 inline-flex items-center gap-1.5">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                                Updating...
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Promote to Moderator */}
                                {u.role !== 'moderator' && (
                                  <button
                                    onClick={() => handleUpdateRole(u, 'moderator')}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold hover:border-emerald-500/60 transition-colors cursor-pointer text-[11px]"
                                    title="Grant catalog & curation moderation privileges"
                                  >
                                    To Moderator
                                  </button>
                                )}

                                {/* Promote to Admin (Owner clearance required) */}
                                {u.role !== 'admin' && (
                                  <button
                                    onClick={() => handleUpdateRole(u, 'admin')}
                                    disabled={!isOwnerViewer}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                                      isOwnerViewer
                                        ? 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-300 hover:border-purple-500/60 cursor-pointer'
                                        : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-60'
                                    }`}
                                    title={isOwnerViewer ? "Promote user to Administrator" : "Only Primary Owner can appoint Admins"}
                                  >
                                    To Admin
                                  </button>
                                )}

                                {/* Revoke Access / Demote to standard User */}
                                {u.role !== 'user' && (
                                  <button
                                    onClick={() => handleUpdateRole(u, 'user')}
                                    disabled={u.role === 'admin' && !isOwnerViewer}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                                      u.role === 'admin' && !isOwnerViewer
                                        ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-60'
                                        : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300 hover:border-rose-500/60 cursor-pointer'
                                    }`}
                                    title="Revoke administrative access and reset to standard user"
                                  >
                                    Revoke Access
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="font-mono">
                Hierarchy Rule: Only the Primary Owner can create or revoke Admin roles. Moderators have curation permissions.
              </span>
              <span className="text-slate-500">
                Connected to Cloud Firestore: <code className="text-emerald-400">users</code>
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
