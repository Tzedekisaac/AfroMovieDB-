import React from 'react';
import { Film, Bookmark, Sparkles, Search, X, Award, Flame, Plus, User as UserIcon, LogIn } from 'lucide-react';
import { FilterState, AppTheme } from '../types';
import { User } from 'firebase/auth';

interface NavbarProps {
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  watchlistCount: number;
  onOpenWatchlist: () => void;
  onOpenTrivia: () => void;
  onOpenAutoPull: () => void;
  totalMoviesCount: number;
  currentUser: User | null;
  onOpenAuth: () => void;
  currentView?: 'catalogue' | 'profile';
  onNavigateView?: (view: 'catalogue' | 'profile') => void;
  activeTheme?: AppTheme;
}

export const Navbar: React.FC<NavbarProps> = ({
  filterState,
  setFilterState,
  watchlistCount,
  onOpenWatchlist,
  onOpenTrivia,
  onOpenAutoPull,
  totalMoviesCount,
  currentUser,
  onOpenAuth,
  currentView = 'catalogue',
  onNavigateView,
  activeTheme = 'emerald'
}) => {
  // Dynamic theme accents
  const brandGradient = 
    activeTheme === 'gold'
      ? 'from-amber-500 via-amber-600 to-yellow-500 shadow-amber-950/40'
      : activeTheme === 'obsidian'
        ? 'from-purple-600 via-indigo-600 to-cyan-500 shadow-purple-950/40'
        : 'from-emerald-500 via-emerald-600 to-amber-500 shadow-emerald-950/40';

  const brandAccentText = 
    activeTheme === 'gold' ? 'text-amber-400' : activeTheme === 'obsidian' ? 'text-purple-400' : 'text-emerald-400';

  const badgeStyle = 
    activeTheme === 'gold'
      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
      : activeTheme === 'obsidian'
        ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';

  const searchFocusRing = 
    activeTheme === 'gold'
      ? 'focus:ring-amber-500/50 focus:border-amber-500'
      : activeTheme === 'obsidian'
        ? 'focus:ring-purple-500/50 focus:border-purple-500'
        : 'focus:ring-emerald-500/50 focus:border-emerald-500';

  const watchlistBtnStyle = 
    activeTheme === 'gold'
      ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold shadow-amber-950/40'
      : activeTheme === 'obsidian'
        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/40'
        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0b0f17]/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Logo / Brand */}
          <div 
            onClick={() => {
              if (onNavigateView) onNavigateView('catalogue');
              setFilterState(prev => ({
                ...prev,
                searchQuery: '',
                selectedGenre: 'All',
                selectedLanguage: 'All',
                selectedEra: 'All',
                selectedPlatform: 'All',
                watchlistOnly: false
              }));
            }}
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
            id="brand-logo"
          >
            <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${brandGradient} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
              <Film className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-[#0b0f17] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-cinema text-xl sm:text-2xl font-bold tracking-wider text-white">
                  AFRO<span className={brandAccentText}>MOVIEDB</span>
                </span>
                <span className={`hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase border rounded ${badgeStyle}`}>
                  Nollywood
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                The Definitive Nigerian Cinema Archive
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-sm lg:max-w-md relative hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="search-input-header"
                type="text"
                placeholder="Search titles, actors (RMD, Sola Sobowale...), directors..."
                value={filterState.searchQuery}
                onChange={(e) => setFilterState(prev => ({ ...prev, searchQuery: e.target.value }))}
                className={`w-full pl-10 pr-9 py-2 bg-slate-900/90 border border-slate-700/80 rounded-full text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${searchFocusRing} transition-all`}
              />
              {filterState.searchQuery && (
                <button
                  onClick={() => setFilterState(prev => ({ ...prev, searchQuery: '' }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full cursor-pointer"
                  title="Clear search"
                  id="clear-search-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Add Movie / Auto-Pull Trigger (Authenticated Users Only) */}
            {currentUser && (
              <button
                id="open-autopull-btn"
                onClick={onOpenAutoPull}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full ${activeTheme === 'obsidian' ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white' : activeTheme === 'gold' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950' : 'bg-gradient-to-r from-emerald-500 to-amber-500 text-slate-950'} hover:brightness-110 shadow-md hover:scale-102 active:scale-95 transition-all cursor-pointer`}
                title="Add Movie or Auto-Pull from Web"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden sm:inline">Add Film</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}

            {/* Box Office Highlight Shortcut */}
            <button
              id="filter-box-office-btn"
              onClick={() => setFilterState(prev => ({
                ...prev,
                sortBy: prev.sortBy === 'box_office' ? 'rating' : 'box_office'
              }))}
              className={`hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all cursor-pointer ${
                filterState.sortBy === 'box_office'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/30'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>₦1B+ Records</span>
            </button>

            {/* Nollywood Trivia & Heritage Modal Trigger */}
            <button
              id="open-trivia-btn"
              onClick={onOpenTrivia}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Nollywood History & Milestones"
            >
              <Award className={`w-3.5 h-3.5 ${brandAccentText}`} />
              <span>Heritage</span>
            </button>

            {/* Watchlist Button */}
            <button
              id="open-watchlist-btn"
              onClick={() => {
                if (!currentUser) {
                  onOpenAuth();
                } else {
                  onOpenWatchlist();
                }
              }}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full ${watchlistBtnStyle} shadow-md transition-all cursor-pointer`}
              title={currentUser ? "View your saved watchlist" : "Sign in to access your watchlist"}
            >
              <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Watchlist</span>
              {currentUser && watchlistCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[11px] font-bold leading-none bg-amber-400 text-slate-950 rounded-full">
                  {watchlistCount}
                </span>
              )}
            </button>

            {/* Unified User Profile & Account Authentication Button */}
            <button
              id={currentUser ? "open-user-profile-btn" : "open-auth-btn"}
              onClick={() => {
                if (currentUser) {
                  if (onNavigateView) {
                    onNavigateView(currentView === 'profile' ? 'catalogue' : 'profile');
                  } else {
                    onOpenAuth();
                  }
                } else {
                  onOpenAuth();
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-full border transition-all cursor-pointer shadow-sm select-none ${
                currentUser
                  ? currentView === 'profile'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-md shadow-amber-950/40 font-bold hover:brightness-110 active:scale-95'
                    : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 hover:border-emerald-500/50 text-slate-200 hover:text-white active:scale-95'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:text-emerald-300 active:scale-95'
              }`}
              title={
                currentUser 
                  ? (currentView === 'profile' 
                      ? 'Return to Nigerian Movie Catalogue' 
                      : `View ${currentUser.displayName || 'User'} Profile, Tracked Movies & Settings`)
                  : 'Sign in with Google or Email'
              }
            >
              {currentUser ? (
                <>
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="" 
                      className="w-4 h-4 rounded-full object-cover ring-1 ring-emerald-400/50 shrink-0" 
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[75px] sm:max-w-[120px] truncate">
                    {currentView === 'profile' 
                      ? 'Catalogue' 
                      : (currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'Profile')}
                  </span>
                  {currentView === 'profile' ? (
                    <Film className="w-3.5 h-3.5 text-slate-950 opacity-80 shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  )}
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5 shrink-0" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Mobile Search Bar */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="search-input-mobile"
              type="text"
              placeholder="Search Nigerian films, actors, directors..."
              value={filterState.searchQuery}
              onChange={(e) => setFilterState(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pl-10 pr-9 py-2 bg-slate-900 border border-slate-800 rounded-full text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {filterState.searchQuery && (
              <button
                onClick={() => setFilterState(prev => ({ ...prev, searchQuery: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full"
                id="clear-mobile-search-btn"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
