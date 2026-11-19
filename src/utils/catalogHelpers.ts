import type { FilterState, Movie, UserReview, UserTrackedItem } from '../types.ts';
import { DEFAULT_MOVIE_COLLECTION } from './movieCollections.ts';
import { isNigerianMovie } from './nigerianMovieValidator.ts';
import { sanitizeAndTagMovie } from './sanitizeAndTagMovie.ts';
import { sanitizeAndAlignMovieMetadata } from './validation.ts';
import { sanitizeMovie } from './api.ts';

export const MOVIES_BATCH_SIZE = 12;

export const INITIAL_FILTER_STATE: FilterState = {
  searchQuery: '',
  selectedGenre: 'All',
  selectedLanguage: 'All',
  selectedEra: 'All',
  selectedPlatform: 'All',
  sortBy: 'rating',
  watchlistOnly: false,
};

/**
 * Filters and normalizes raw Firestore custom_movies documents into verified Nigerian Movie records.
 */
export function normalizeCatalogMovies(cloudMovies: Movie[] = []): Movie[] {
  return (cloudMovies || [])
    .filter((movie) => {
      const normTitle = String(movie?.title || '').toLowerCase().trim();
      const normDirector = String(movie?.director || '').toLowerCase().trim();
      if (normTitle.includes('call me') || normDirector.includes('arek zasowski')) {
        return false;
      }
      return isNigerianMovie(movie);
    })
    .map((movie) =>
      sanitizeAndAlignMovieMetadata(sanitizeAndTagMovie(sanitizeMovie(movie)) as Movie)
    );
}

/**
 * Computes updated FilterState when switching between quick curated collection tabs.
 */
export function applyCollectionFilterUpdate(prev: FilterState, collId: string): FilterState {
  if (collId === 'all') {
    return {
      ...prev,
      selectedGenre: 'All',
      selectedEra: 'All',
      selectedLanguage: 'All',
      selectedPlatform: 'All',
      watchlistOnly: false,
      sortBy: 'rating',
    };
  }
  if (collId === 'box-office') {
    return {
      ...prev,
      selectedGenre: 'All',
      selectedEra: 'All',
      selectedLanguage: 'All',
      selectedPlatform: 'All',
      watchlistOnly: false,
      sortBy: 'box_office',
    };
  }
  if (collId === 'epics') {
    return {
      ...prev,
      selectedGenre: 'Epic & Folklore',
      selectedEra: 'All',
      selectedLanguage: 'All',
      selectedPlatform: 'All',
      watchlistOnly: false,
      sortBy: 'rating',
    };
  }
  if (collId === 'golden-era') {
    return {
      ...prev,
      selectedGenre: 'All',
      selectedEra: 'Golden Era (1992-2005)',
      selectedLanguage: 'All',
      selectedPlatform: 'All',
      watchlistOnly: false,
      sortBy: 'year_asc',
    };
  }
  if (collId === 'crime-heist') {
    return {
      ...prev,
      selectedGenre: 'Crime & Thriller',
      selectedEra: 'All',
      selectedLanguage: 'All',
      selectedPlatform: 'All',
      watchlistOnly: false,
      sortBy: 'rating',
    };
  }
  if (collId === 'community') {
    return {
      ...prev,
      selectedGenre: 'All',
      selectedEra: 'All',
      selectedLanguage: 'All',
      selectedPlatform: 'All',
      watchlistOnly: false,
      sortBy: 'year_desc',
    };
  }
  return prev;
}

export interface FilterAndSortOptions {
  filterState: FilterState;
  activeCollection: string;
  watchlistIds?: string[];
  trackingMap?: Map<string, UserTrackedItem>;
  reviews?: UserReview[];
}

/**
 * Applies collection, watchlist, search query, genre, language, era, platform filters and sort order.
 */
export function filterAndSortCatalogMovies(
  movies: Movie[],
  {
    filterState,
    activeCollection,
    watchlistIds = [],
    trackingMap = new Map<string, UserTrackedItem>(),
    reviews = [],
  }: FilterAndSortOptions
): Movie[] {
  return movies
    .filter((movie) => {
      // "All" is intentionally not gated by collection tags or TMDb metadata:
      // every entry here came from the custom_movies Firestore snapshot.
      const selectedCollection = activeCollection.trim().toLowerCase();
      const allTitlesSelected =
        selectedCollection === 'all' ||
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
        const matchesCast = movie.leadCast.some((c) => c.actor.toLowerCase().includes(query));
        const matchesSynopsis = movie.synopsis.toLowerCase().includes(query);
        const matchesTagline = movie.tagline.toLowerCase().includes(query);

        if (
          !matchesTitle &&
          !matchesNative &&
          !matchesDirector &&
          !matchesCast &&
          !matchesSynopsis &&
          !matchesTagline
        ) {
          return false;
        }
      }

      // Genre
      if (filterState.selectedGenre !== 'All' && !movie.genres.includes(filterState.selectedGenre)) {
        return false;
      }

      // Language
      if (
        filterState.selectedLanguage !== 'All' &&
        !movie.languages.includes(filterState.selectedLanguage)
      ) {
        return false;
      }

      // Era
      if (filterState.selectedEra !== 'All' && movie.era !== filterState.selectedEra) {
        return false;
      }

      // Platform
      if (filterState.selectedPlatform !== 'All') {
        const hasPlatform = movie.streamingPlatforms.some(
          (p) => p.name === filterState.selectedPlatform
        );
        if (!hasPlatform) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (filterState.sortBy === 'rating') {
        const aReviews = reviews.filter((r) => r.movieId === a.id);
        const bReviews = reviews.filter((r) => r.movieId === b.id);
        const aScore =
          aReviews.length > 0
            ? (a.rating + aReviews.reduce((sum, r) => sum + r.rating, 0) / aReviews.length) / 2
            : a.rating;
        const bScore =
          bReviews.length > 0
            ? (b.rating + bReviews.reduce((sum, r) => sum + r.rating, 0) / bReviews.length) / 2
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
        const aScore = a.boxOfficeChampion ? 2 : a.boxOffice ? 1 : 0;
        const bScore = b.boxOfficeChampion ? 2 : b.boxOffice ? 1 : 0;
        if (aScore !== bScore) return bScore - aScore;
        return b.rating - a.rating;
      }
      if (filterState.sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
}

export function paginateCatalogMovies(filteredMovies: Movie[], displayedCount: number) {
  return {
    displayedMovies: filteredMovies.slice(0, displayedCount),
    hasMore: displayedCount < filteredMovies.length,
    remainingCount: Math.max(0, filteredMovies.length - displayedCount),
  };
}
