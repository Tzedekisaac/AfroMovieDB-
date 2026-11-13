/**
 * Movie Service Layer
 * 
 * Provides high-level business logic for:
 * 1. Cross-referencing movie banners/posters with official titles and regional origins.
 * 2. Sanitizing and aligning all metadata (titles, release years, directors, descriptions)
 *    with verified visual assets for existing catalogue entries and future uploads.
 * 3. Fetching and validating online candidates against Nollywood provenance before Firestore persistence.
 */

import type { Movie } from '../types.ts';
import { 
  validateMovieArtwork, 
  sanitizeAndAlignMovieMetadata, 
  validateMovieForUpload,
  ArtworkValidationResult,
  MovieValidationReport,
  VERIFIED_NOLLYWOOD_FALLBACK_POSTER,
  VERIFIED_NOLLYWOOD_FALLBACK_BACKDROP
} from '../utils/validation.ts';
import { 
  pullMovieDetailsFromOnline, 
  searchMoviesOnline, 
  WebMovieCandidate,
  bulkSyncNigerianNewReleases,
  hasExplicitNigerianOrigin 
} from '../utils/api.ts';
import { isNigerianMovie } from '../utils/nigerianMovieValidator.ts';

export {
  validateMovieArtwork,
  sanitizeAndAlignMovieMetadata,
  validateMovieForUpload,
  VERIFIED_NOLLYWOOD_FALLBACK_POSTER,
  VERIFIED_NOLLYWOOD_FALLBACK_BACKDROP
};

export type { ArtworkValidationResult, MovieValidationReport };

/**
 * Validates and aligns a single movie entry (new upload or edit)
 */
export function validateAndAlignMovie(movieData: Partial<Movie>): MovieValidationReport {
  return validateMovieForUpload(movieData);
}

/**
 * Sanitizes and aligns movie metadata and artwork for upload
 */
export function sanitizeMovieForUpload(movieData: Partial<Movie>): Movie {
  return sanitizeAndAlignMovieMetadata(movieData);
}

/**
 * Direct check to verify whether a poster or banner matches the movie title and Nigerian origin
 */
export function verifyArtworkAgainstTitleAndOrigin(
  title: string, 
  posterUrl: string, 
  originCountry?: string[] | string
): ArtworkValidationResult {
  return validateMovieArtwork({
    title,
    posterUrl,
    originCountry
  });
}

/**
 * Aligns and sanitizes an entire collection of existing catalogue entries.
 * Scans for any entries with mismatched international artwork, unaligned release eras,
 * or messy titles, and returns the sanitized list.
 */
export function alignExistingCatalog(movies: Movie[]): Movie[] {
  return (movies || []).map(movie => sanitizeAndAlignMovieMetadata(movie));
}

/**
 * Fetches movie details from the online registry (TMDb), verifies that the
 * visual assets correspond to an authentic Nigerian title and regional origin ('NG'),
 * and aligns all metadata fields.
 */
export async function fetchAndVerifyOnlineMovie(
  candidate: WebMovieCandidate, 
  forceRefresh = false
): Promise<Movie | null> {
  try {
    const rawMovie = await pullMovieDetailsFromOnline(candidate, forceRefresh);
    if (!rawMovie) return null;

    // Cross-reference regional origin strictly
    if (!hasExplicitNigerianOrigin(rawMovie)) {
      console.warn(`Candidate "${rawMovie.title}" rejected: Does not meet strict origin_country: ['NG'] criteria.`);
      return null;
    }

    // Sanitize and align all metadata with verified visual assets
    const aligned = sanitizeAndAlignMovieMetadata(rawMovie);

    // Double-check artwork
    const artworkCheck = validateMovieArtwork({
      title: aligned.title,
      posterUrl: aligned.posterUrl,
      backdropUrl: aligned.backdropUrl,
      originCountry: aligned.originCountry,
      releaseYear: aligned.releaseYear,
      tmdbId: aligned.tmdbId
    });

    if (!artworkCheck.isValid && artworkCheck.recommendedPosterUrl) {
      aligned.posterUrl = artworkCheck.recommendedPosterUrl;
      aligned.backdropUrl = artworkCheck.recommendedBackdropUrl || aligned.posterUrl;
    }

    return aligned;
  } catch (err) {
    console.error('Error in fetchAndVerifyOnlineMovie:', err);
    throw err;
  }
}

// Re-export common API functions for convenience
export {
  pullMovieDetailsFromOnline,
  searchMoviesOnline,
  bulkSyncNigerianNewReleases,
  hasExplicitNigerianOrigin
};
