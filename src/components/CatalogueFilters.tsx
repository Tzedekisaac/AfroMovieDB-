import React from 'react';
import { FilterState, Genre, Language, Era, AppTheme } from '../types';
import { SlidersHorizontal, RotateCcw, Sparkles, Film, Globe, Clock, Tv, LayoutGrid, List } from 'lucide-react';

interface CatalogueFiltersProps {
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  totalMatches: number;
  viewMode: 'grid' | 'compact';
  setViewMode: (mode: 'grid' | 'compact') => void;
  activeTheme?: AppTheme;
}

const GENRES: Genre[] = [
  'All',
  'Epic & Folklore',
  'Crime & Thriller',
  'Comedy',
  'Drama',
  'Romantic Comedy',
  'Action',
  'Historical Drama'
];

const ERAS: { label: string; value: Era }[] = [
  { label: 'All Eras', value: 'All' },
  { label: 'Golden Era (1992-2005)', value: 'Golden Era (1992-2005)' },
  { label: 'New Nollywood (2006-2018)', value: 'New Nollywood (2006-2018)' },
  { label: 'Modern Global Era (2019-Present)', value: 'Modern Global Era (2019-Present)' }
];

const LANGUAGES: { label: string; value: Language }[] = [
  { label: 'All Languages', value: 'All' },
  { label: 'Yoruba Cinema', value: 'Yoruba' },
  { label: 'Igbo Cinema', value: 'Igbo' },
  { label: 'Hausa (Kannywood)', value: 'Hausa' },
  { label: 'Nigerian Pidgin', value: 'Nigerian Pidgin' },
  { label: 'English', value: 'English' }
];

const PLATFORMS = [
  'All',
  'Netflix',
  'Prime Video',
  'YouTube',
  'Cinema',
  'Africa Magic'
];

export const CatalogueFilters: React.FC<CatalogueFiltersProps> = ({
  filterState,
  setFilterState,
  totalMatches,
  viewMode,
  setViewMode,
  activeTheme = 'emerald'
}) => {
  const isFiltered =
    filterState.selectedGenre !== 'All' ||
    filterState.selectedLanguage !== 'All' ||
    filterState.selectedEra !== 'All' ||
    filterState.selectedPlatform !== 'All' ||
    filterState.searchQuery !== '' ||
    filterState.watchlistOnly ||
    filterState.sortBy !== 'rating';

  const resetFilters = () => {
    setFilterState({
      searchQuery: '',
      selectedGenre: 'All',
      selectedLanguage: 'All',
      selectedEra: 'All',
      selectedPlatform: 'All',
      sortBy: 'rating',
      watchlistOnly: false
    });
  };

  const activePillStyle = 
    activeTheme === 'gold'
      ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-950/40'
      : activeTheme === 'obsidian'
        ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-950/40'
        : 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-950/40';

  const accentText = 
    activeTheme === 'gold' ? 'text-amber-400' : activeTheme === 'obsidian' ? 'text-purple-400' : 'text-emerald-400';

  const selectFocusRing = 
    activeTheme === 'gold'
      ? 'focus:ring-amber-500'
      : activeTheme === 'obsidian'
        ? 'focus:ring-purple-500'
        : 'focus:ring-emerald-500';

  return (
    <div className="w-full max-w-full space-y-4 pt-4 sm:pt-6 pb-2" id="catalogue-filters-section">
      {/* Top row: Genre Pills scrollable bar */}
      <div className="w-full max-w-full flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1.5 pl-1 pr-2">
          <Film className={`w-3.5 h-3.5 ${accentText}`} />
          Genres:
        </span>
        {GENRES.map((genre) => {
          const isActive = filterState.selectedGenre === genre;
          return (
            <button
              key={genre}
              id={`filter-genre-${genre.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              onClick={() => setFilterState(prev => ({ ...prev, selectedGenre: genre }))}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? activePillStyle
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>

      {/* Second row: Dropdown selectors & Sorting */}
      <div className="w-full max-w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 sm:p-4 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3">
        
        {/* Left Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto min-w-0 flex-1">
          
          {/* Era Filter */}
          <div className="relative">
            <select
              id="filter-era-select"
              aria-label="Filter by Era"
              value={filterState.selectedEra}
              onChange={(e) => setFilterState(prev => ({ ...prev, selectedEra: e.target.value }))}
              className={`appearance-none pl-8 pr-8 py-1.5 bg-slate-900 border border-slate-700/80 hover:border-slate-600 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 ${selectFocusRing} cursor-pointer`}
            >
              {ERAS.map((era) => (
                <option key={era.value} value={era.value} className="bg-slate-900 text-slate-200">
                  {era.label}
                </option>
              ))}
            </select>
            <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Language Filter */}
          <div className="relative">
            <select
              id="filter-language-select"
              aria-label="Filter by Language"
              value={filterState.selectedLanguage}
              onChange={(e) => setFilterState(prev => ({ ...prev, selectedLanguage: e.target.value }))}
              className={`appearance-none pl-8 pr-8 py-1.5 bg-slate-900 border border-slate-700/80 hover:border-slate-600 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 ${selectFocusRing} cursor-pointer`}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value} className="bg-slate-900 text-slate-200">
                  {lang.label}
                </option>
              ))}
            </select>
            <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Streaming Platform Filter */}
          <div className="relative">
            <select
              id="filter-platform-select"
              aria-label="Filter by Streaming Platform"
              value={filterState.selectedPlatform}
              onChange={(e) => setFilterState(prev => ({ ...prev, selectedPlatform: e.target.value }))}
              className={`appearance-none pl-8 pr-8 py-1.5 bg-slate-900 border border-slate-700/80 hover:border-slate-600 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 ${selectFocusRing} cursor-pointer`}
            >
              <option value="All" className="bg-slate-900 text-slate-200">All Platforms</option>
              {PLATFORMS.filter(p => p !== 'All').map((platform) => (
                <option key={platform} value={platform} className="bg-slate-900 text-slate-200">
                  Watch on {platform}
                </option>
              ))}
            </select>
            <Tv className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset button if active */}
          {isFiltered && (
            <button
              id="reset-all-filters-btn"
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

        </div>

        {/* Right Sort & View toggles */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          
          {/* Match counter badge */}
          <span className="text-xs text-slate-400">
            Showing <strong className="text-white font-semibold">{totalMatches}</strong> Nigerian films
          </span>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden md:inline">Sort:</span>
            <select
              id="sort-by-select"
              aria-label="Sort movies by"
              value={filterState.sortBy}
              onChange={(e) => setFilterState(prev => ({ ...prev, sortBy: e.target.value as FilterState['sortBy'] }))}
              className={`bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 ${selectFocusRing} cursor-pointer`}
            >
              <option value="rating">Highest Community Rating</option>
              <option value="year_desc">Release Date: Newest First</option>
              <option value="year_asc">Release Date: Golden Classics (Oldest)</option>
              <option value="runtime_desc">Runtime: Longest Epics First</option>
              <option value="runtime_asc">Runtime: Quick Watches (Shortest)</option>
              <option value="rewatch_desc">Most Rewatched Films</option>
              <option value="box_office">₦1B+ Box Office Champions</option>
              <option value="title">Title (A–Z)</option>
            </select>
          </div>

          {/* Grid / Compact Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              id="view-grid-btn"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded text-xs cursor-pointer ${viewMode === 'grid' ? `bg-slate-800 ${accentText} shadow` : 'text-slate-400 hover:text-slate-200'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              id="view-compact-btn"
              onClick={() => setViewMode('compact')}
              className={`p-1.5 rounded text-xs cursor-pointer ${viewMode === 'compact' ? `bg-slate-800 ${accentText} shadow` : 'text-slate-400 hover:text-slate-200'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
