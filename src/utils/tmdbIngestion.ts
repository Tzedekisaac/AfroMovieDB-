import type { Movie } from '../types.ts';
import type { WebMovieCandidate } from './api.ts';
import { hasExplicitNigerianOrigin } from './api.ts';
import { extractOriginCountries } from './nigerianMovieValidator.ts';

export interface TmdbSearchEvaluation {
  candidates: WebMovieCandidate[];
  errorMessage: string | null;
  canSaveToFirestore: boolean;
}

/**
 * Filters raw TMDb search candidates to strictly enforce:
 * 1. A real TMDb numeric ID (`tmdbId > 0`)
 * 2. Explicit `origin_country: ['NG']` (or `production_countries` including 'NG')
 * 3. Passing authoritative Nigerian cinema validation (`isNigerianMovie`)
 */
export function filterVerifiedTmdbCandidates(
  candidates: WebMovieCandidate[] | null | undefined
): WebMovieCandidate[] {
  if (!Array.isArray(candidates)) return [];
  return candidates.filter((cand) => {
    if (!cand || typeof cand !== 'object') return false;
    if (typeof cand.tmdbId !== 'number' || !Number.isFinite(cand.tmdbId) || cand.tmdbId <= 0) {
      return false;
    }
    return hasExplicitNigerianOrigin(cand);
  });
}

/**
 * Evaluates TMDb search results for a query.
 * When zero verified Nigerian matches exist, returns an empty list, a clear
 * "No verified Nigerian film found" error message, and keeps Firestore saving disabled.
 */
export function evaluateTmdbSearchResults(
  query: string,
  candidates: WebMovieCandidate[] | null | undefined
): TmdbSearchEvaluation {
  const cleanQuery = query.trim();
  const verified = filterVerifiedTmdbCandidates(candidates);

  if (verified.length === 0) {
    return {
      candidates: [],
      errorMessage: cleanQuery
        ? `No verified Nigerian film found for "${cleanQuery}". Only real TMDb database matches with origin_country: ['NG'] can be imported.`
        : 'No verified Nigerian film found.',
      canSaveToFirestore: false
    };
  }

  return {
    candidates: verified,
    errorMessage: null,
    canSaveToFirestore: false
  };
}

/**
 * Guards Firestore persistence: only real TMDb matches with a valid numeric `tmdbId`
 * and explicit `origin_country: ['NG']` are eligible to be saved to Firestore.
 */
export function canSaveVerifiedTmdbMovie(
  movie: Partial<Movie> | null | undefined,
  searchError?: string | null
): boolean {
  if (!movie || typeof movie !== 'object') return false;
  if (searchError && !movie.tmdbId) return false;
  if (!movie.id || !String(movie.id).trim()) return false;
  if (!movie.title || !String(movie.title).trim()) return false;

  const tmdbId = Number((movie as any).tmdbId);
  if (!Number.isFinite(tmdbId) || tmdbId <= 0) return false;

  const countries = extractOriginCountries(movie);
  if (!countries.includes('NG')) return false;

  return hasExplicitNigerianOrigin(movie);
}
