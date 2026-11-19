import type { CustomUserList, Movie } from '../types.ts';

export type ActiveModalType =
  | 'movie'
  | 'trailer'
  | 'edit'
  | 'watchlist'
  | 'heritage'
  | 'addMovie'
  | 'auth'
  | 'customList'
  | 'siteInfo'
  | null;

export interface DeepLinkParams {
  movieId: string | null;
  listId: string | null;
}

/**
 * Parses deep-link query parameters (`?movie=` and `?list=`) from a URL search string.
 */
export function parseDeepLinkParams(search: string): DeepLinkParams {
  try {
    const params = new URLSearchParams(search);
    const movieId = params.get('movie')?.trim() || null;
    const listId = params.get('list')?.trim() || null;
    return { movieId, listId };
  } catch {
    return { movieId: null, listId: null };
  }
}

/**
 * Extracts a positive numeric TMDb ID from a string like `tmdb-12345` or `12345`, or null if invalid.
 */
export function parseTmdbIdFromMovieParam(movieId: string): number | null {
  const cleaned = String(movieId || '').replace(/^tmdb-/, '').trim();
  if (!/^\d+$/.test(cleaned)) return null;
  const num = parseInt(cleaned, 10);
  return !isNaN(num) && num > 0 ? num : null;
}

/**
 * Removes a specific query parameter from a full URL while preserving pathname, other params, and hash.
 */
export function removeQueryParamFromUrl(href: string, paramName: string): string | null {
  try {
    const url = new URL(href);
    if (!url.searchParams.has(paramName)) {
      return null;
    }
    url.searchParams.delete(paramName);
    return url.pathname + (url.search ? url.search : '') + url.hash;
  } catch {
    return null;
  }
}

/**
 * Sets `?list=<id>` on a URL if it is not already set to that value.
 */
export function buildListDeepLinkUrl(href: string, listId: string): string | null {
  try {
    const url = new URL(href);
    if (url.searchParams.get('list') === listId) {
      return null;
    }
    url.searchParams.set('list', listId);
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Finds a movie in the catalog by ID or falls back to matching tmdbId.
 */
export function findMovieById(movies: Movie[], movieId: string): Movie | null {
  if (!movieId) return null;
  const direct = movies.find((m) => m.id === movieId);
  if (direct) return direct;
  const tmdbId = parseTmdbIdFromMovieParam(movieId);
  if (tmdbId !== null) {
    return movies.find((m) => m.tmdbId === tmdbId) || null;
  }
  return null;
}

/**
 * Finds a custom user list by ID.
 */
export function findListById(lists: CustomUserList[], listId: string): CustomUserList | null {
  if (!listId) return null;
  return lists.find((l) => l.id === listId) || null;
}
