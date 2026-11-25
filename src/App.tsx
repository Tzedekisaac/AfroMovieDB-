import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useUserSession } from './hooks/useUserSession';
import { useMovieCatalog } from './hooks/useMovieCatalog';
import { useModalRouter } from './hooks/useModalRouter';
import type { Movie } from './types';
import { Navbar } from './components/Navbar';
import { HeroSpotlight } from './components/HeroSpotlight';
import { CatalogueFilters } from './components/CatalogueFilters';
import { MovieGrid } from './components/MovieGrid';
import { UserProfilePage } from './components/UserProfilePage';
import { StandaloneListView } from './components/StandaloneListView';
import { HistoricalSweepPill } from './components/HistoricalSweepPill';
import { AdminRoute } from './components/AdminRoute';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import { AppModals } from './components/AppModals';
import {
  Sparkles, Flame, Award, Film,
  Clapperboard, Plus, RefreshCw, CheckCircle2, ChevronDown, ArrowUp
} from 'lucide-react';

export default function App() {
  // Navigation View State: 'catalogue', 'profile', or 'admin' command center
  const [currentView, setCurrentView] = useState<'catalogue' | 'profile' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p === '/admin' || p.startsWith('/admin')) return 'admin';
      if (p === '/profile' || p.startsWith('/profile')) return 'profile';
    }
    return 'catalogue';
  });

  // Synchronize browser history / URL path when switching views
  const closeListRef = useRef<() => void>(() => {});
  const openAuthRef = useRef<() => void>(() => {});
  const navigateToView = (view: 'catalogue' | 'profile' | 'admin') => {
    setCurrentView(view);
    if (view === 'catalogue') {
      closeListRef.current();
    }
    try {
      const targetPath = view === 'admin' ? '/admin' : view === 'profile' ? '/profile' : '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    } catch (e) {}
  };

  // Listen to browser forward/back popstate events
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/admin' || path.startsWith('/admin')) {
        setCurrentView('admin');
      } else if (path === '/profile' || path.startsWith('/profile')) {
        setCurrentView('profile');
      } else {
        setCurrentView('catalogue');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync notification banner state
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const showSyncNotice = useCallback((message: string | null, durationMs?: number) => {
    setSyncNotice(message);
    if (message && durationMs) {
      window.setTimeout(() => {
        setSyncNotice((curr) => (curr === message ? null : curr));
      }, durationMs);
    }
  }, []);

  // Auth, user profile, preferences, and tracking session hook
  const {
    user: currentUser,
    userProfile: currentUserProfile,
    isAdmin,
    loadingAuth,
    watchlistIds,
    trackingList,
    trackingMap,
    customTmdbApiKey,
    activeTheme,
    userCustomLists,
    signOutUser: handleSignOut,
    updateTrackingStatus: handleUpdateTrackingStatus,
    updateRewatchCount: handleUpdateRewatchCount,
    toggleWatchlist: handleToggleWatchlist,
    clearWatchlist: handleClearWatchlist,
    saveApiKey: handleSaveApiKey,
    removeApiKey: handleRemoveApiKey,
    selectTheme: handleSelectTheme,
    saveUserCustomList: handleSaveCustomList,
    deleteUserCustomList
  } = useUserSession({
    onSyncNotice: showSyncNotice,
    onRequireAuth: () => openAuthRef.current()
  });

  // Layout UI states
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [showSweepPill, setShowSweepPill] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Scroll listener to toggle floating 'Back to Top' button when scrolled past the first batch of movies
  useEffect(() => {
    const handleScroll = () => {
      const gridEl = document.getElementById('movies-grid') || document.getElementById('movies-list');
      if (gridEl) {
        const rect = gridEl.getBoundingClientRect();
        // Becomes visible once the user has scrolled past the hero section and past the top of the first batch
        setShowBackToTop(rect.top < -150 || window.scrollY > 600);
      } else {
        setShowBackToTop(window.scrollY > 600);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Movie catalog data layer hook (Firestore snapshots, reviews, filtering, sorting, pagination, sync & sweep)
  const {
    movies,
    loadingMovies,
    catalogLoadError,
    filteredMovies,
    displayedMovies,
    featuredMovies,
    hasMore,
    loadMore,
    remainingCount,
    batchSize,
    filterState,
    setFilterState,
    resetFilters,
    activeCollection,
    handleCollectionSelect,
    isSyncingReleases,
    reviews,
    addReview: handleAddReview,
    deleteReview: handleDeleteReview,
    publishMovie,
    updateMovie,
    isSweeping,
    isFinishingSweep,
    sweepProgress,
    triggerHistoricalSweep,
    finishHistoricalSweep: handleFinishHistoricalSweep
  } = useMovieCatalog({
    currentUser,
    isAuthReady: !loadingAuth,
    watchlistIds,
    trackingMap,
    onSyncNotice: showSyncNotice
  });

  // URL deep-linking (?movie=, ?list=) & modal visibility router hook
  const modalRouter = useModalRouter({
    movies,
    userCustomLists
  });

  const {
    selectedMovie,
    setSelectedMovie,
    openMovie,
    trailerMovie,
    setTrailerMovie,
    openTrailer,
    openEditMovie,
    openWatchlist,
    openHeritage,
    openAddMovie,
    openAuth,
    activeStandaloneList,
    openList,
    closeList,
    openCustomList,
    openSiteInfo
  } = modalRouter;

  closeListRef.current = closeList;
  openAuthRef.current = openAuth;

  // UI modal coordinators delegating persistence to useMovieCatalog & useUserSession
  const handleMoviePulled = async (newMovie: Movie) => {
    const savedMovie = await publishMovie(newMovie);
    setSelectedMovie(savedMovie);
  };

  const handleUpdateMovie = async (updatedMovie: Movie) => {
    await updateMovie(updatedMovie, (safeUpdatedMovie) => {
      if (selectedMovie?.id === safeUpdatedMovie.id) {
        setSelectedMovie(safeUpdatedMovie);
      }
      if (trailerMovie?.id === safeUpdatedMovie.id) {
        setTrailerMovie(safeUpdatedMovie);
      }
    });
  };

  const handleDeleteCustomList = (listId: string) =>
    deleteUserCustomList(listId, () => {
      if (activeStandaloneList?.id === listId) {
        closeList();
      }
    });

  const handleTriggerHistoricalSweep = () => {
    setShowSweepPill(true);
    return triggerHistoricalSweep();
  };

  // Watchlist movies objects
  const watchlistMovies = useMemo(() => {
    return movies.filter(m => watchlistIds.includes(m.id));
  }, [watchlistIds, movies]);

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
        onOpenWatchlist={openWatchlist}
        onOpenTrivia={openHeritage}
        onOpenAutoPull={openAddMovie}
        totalMoviesCount={movies.length}
        currentUser={currentUser}
        userRole={currentUserProfile?.role}
        onOpenAuth={openAuth}
        currentView={currentView}
        onNavigateView={navigateToView}
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
          allMovies={movies}
          currentUser={currentUser}
          onClose={closeList}
          onSelectMovie={openMovie}
          onOpenTrailer={openTrailer}
          onEditList={(list) => openCustomList(list)}
          watchlist={watchlistIds}
          onToggleWatchlist={handleToggleWatchlist}
          trackingMap={trackingMap}
          onUpdateStatus={handleUpdateTrackingStatus}
          onOpenAuth={openAuth}
        />
      ) : currentView === 'profile' ? (
        <UserProfilePage
          currentUser={currentUser}
          moviesList={movies}
          watchlist={watchlistIds}
          trackingList={trackingList}
          customTmdbApiKey={customTmdbApiKey}
          reviews={reviews}
          activeTheme={activeTheme}
          onSelectTheme={handleSelectTheme}
          userCustomLists={userCustomLists}
          onOpenCreateList={() => openCustomList(null)}
          onOpenEditList={(list) => openCustomList(list)}
          onDeleteCustomList={handleDeleteCustomList}
          onViewStandaloneList={(list) => openList(list)}
          onUpdateStatus={handleUpdateTrackingStatus}
          onUpdateRewatchCount={handleUpdateRewatchCount}
          onSaveApiKey={handleSaveApiKey}
          onRemoveApiKey={handleRemoveApiKey}
          onToggleWatchlist={handleToggleWatchlist}
          onClearWatchlist={handleClearWatchlist}
          onSelectMovie={openMovie}
          onOpenTrailer={openTrailer}
          onDeleteReview={handleDeleteReview}
          onOpenAddMovie={openAddMovie}
          onOpenAuth={openAuth}
          onSignOut={handleSignOut}
          onBackToCatalogue={() => navigateToView('catalogue')}
          onOpenEdit={openEditMovie}
          onNavigateAdmin={() => navigateToView('admin')}
          isAdmin={isAdmin}
          userRole={currentUserProfile?.role}
        />
      ) : currentView === 'admin' ? (
        <AdminRoute
          currentUser={currentUser}
          onNavigateHome={() => navigateToView('catalogue')}
          onOpenAuth={openAuth}
          allowedRoles={['owner', 'admin', 'moderator']}
        >
          <AdminDashboard
            currentUser={currentUser}
            onNavigateHome={() => navigateToView('catalogue')}
            moviesList={movies}
            activeTheme={activeTheme}
          />
        </AdminRoute>
      ) : (
        <>
          {/* Hero Spotlight (Hidden if user is actively searching or filtering by watchlist) */}
          {!filterState.searchQuery && !filterState.watchlistOnly && (
            <HeroSpotlight
              featuredMovies={featuredMovies}
              onSelectMovie={openMovie}
              onOpenTrailer={openTrailer}
              isWatchlisted={(id) => watchlistIds.includes(id)}
              onToggleWatchlist={handleToggleWatchlist}
              currentUser={currentUser}
              onOpenEdit={openEditMovie}
              onOpenAuth={openAuth}
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
                  label: `Added Movies (${movies.filter(m => m.isUserAdded).length})`, 
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
            {loadingMovies ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-slate-800 bg-slate-900/40 p-8 text-center">
                <Film className="h-10 w-10 animate-pulse text-emerald-400" />
                <p className="text-sm text-slate-300">Loading the movie catalog from Firestore…</p>
              </div>
            ) : catalogLoadError && movies.length === 0 ? (
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
                    onClick={resetFilters}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                  {currentUser ? (
                    <button
                      onClick={openAddMovie}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-amber-600 hover:brightness-110 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Auto-Pull from Online Registry</span>
                    </button>
                  ) : (
                    <button
                      onClick={openAuth}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                    >
                      <span>Sign In to Add Titles</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <MovieGrid
                  movies={displayedMovies}
                  onSelectMovie={openMovie}
                  onOpenTrailer={openTrailer}
                  watchlistIds={watchlistIds}
                  onToggleWatchlist={handleToggleWatchlist}
                  trackingMap={trackingMap}
                  onUpdateStatus={handleUpdateTrackingStatus}
                  viewMode={viewMode}
                  currentUser={currentUser}
                  onOpenEdit={openEditMovie}
                  onOpenAuth={openAuth}
                  reviews={reviews}
                />

                {/* Clean Load More Button (Fixed Batches of 12) */}
                {hasMore && (
                  <div className="py-8 flex flex-col items-center justify-center gap-3">
                    <div className="text-xs text-slate-400 font-medium">
                      Showing <strong className="text-white">{displayedMovies.length}</strong> of <strong className="text-white">{filteredMovies.length}</strong> Nollywood titles
                    </div>
                    <button
                      id="load-more-catalogue-btn"
                      onClick={loadMore}
                      className="px-8 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-xs sm:text-sm font-bold shadow-xl shadow-black/50 hover:scale-102 active:scale-98 transition-all cursor-pointer flex items-center gap-2.5 group"
                    >
                      <ChevronDown className="w-4 h-4 text-amber-400 group-hover:translate-y-0.5 transition-transform" />
                      <span>Load More Titles ({Math.min(batchSize, remainingCount)} remaining)</span>
                    </button>
                  </div>
                )}

                {filteredMovies.length > batchSize && !hasMore && (
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
        onOpenHeritage={openHeritage}
        onOpenSiteInfo={openSiteInfo}
      />

      {/* Application Modals */}
      <AppModals
        modalRouter={modalRouter}
        movies={movies}
        watchlistIds={watchlistIds}
        watchlistMovies={watchlistMovies}
        trackingMap={trackingMap}
        reviews={reviews}
        currentUser={currentUser}
        userProfile={currentUserProfile}
        onToggleWatchlist={handleToggleWatchlist}
        onClearWatchlist={handleClearWatchlist}
        onUpdateTrackingStatus={handleUpdateTrackingStatus}
        onUpdateRewatchCount={handleUpdateRewatchCount}
        onAddReview={handleAddReview}
        onMoviePulled={handleMoviePulled}
        onUpdateMovie={handleUpdateMovie}
        onSaveCustomList={handleSaveCustomList}
        onSignOut={handleSignOut}
        onOpenProfile={() => navigateToView('profile')}
      />

      {/* Floating 'Back to Top' Button (Appears only in movie catalogue view when scrolled past first batch of movies) */}
      {currentView === 'catalogue' && !activeStandaloneList && showBackToTop && (
        <button
          onClick={scrollToTop}
          id="btn-back-to-top"
          aria-label="Back to top of movie catalogue"
          title="Back to top"
          className={`fixed z-40 flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-full shadow-2xl transition-all duration-300 backdrop-blur-md cursor-pointer border active:scale-95 group hover:scale-105 animate-in fade-in slide-in-from-bottom-3 ${
            activeTheme === 'gold'
              ? 'bg-amber-950/90 hover:bg-amber-900 border-amber-500/40 text-amber-300 hover:text-amber-100 shadow-amber-950/60'
              : activeTheme === 'obsidian'
              ? 'bg-purple-950/90 hover:bg-purple-900 border-purple-500/40 text-purple-300 hover:text-purple-100 shadow-purple-950/60'
              : 'bg-emerald-950/90 hover:bg-emerald-900 border-emerald-500/40 text-emerald-300 hover:text-emerald-100 shadow-emerald-950/60'
          } ${showSweepPill ? 'bottom-16 sm:bottom-20 right-4 sm:right-5' : 'bottom-4 sm:bottom-5 right-4 sm:right-5'}`}
        >
          <ArrowUp className="w-4 h-4 text-inherit transition-transform group-hover:-translate-y-0.5" />
          <span className="text-xs font-bold tracking-wide">Top</span>
        </button>
      )}

      {/* Unobtrusive Floating Multi-Decade Historical Sweep Status Pill */}
      {showSweepPill && (
        <HistoricalSweepPill
          progress={sweepProgress}
          isRunning={isSweeping}
          isFinishing={isFinishingSweep}
          onTriggerSweep={handleTriggerHistoricalSweep}
          onFinishSweep={handleFinishHistoricalSweep}
          onCancelSweep={handleFinishHistoricalSweep}
          onDismiss={() => setShowSweepPill(false)}
        />
      )}

    </div>
  );
}

