/**
 * Movie Metadata and Artwork Validation Utilities
 * 
 * 1. Cross-references movie banners/posters with official titles and regional origins
 *    to prevent mismatched international artwork from being associated with Nollywood cinema.
 * 2. Sanitizes and aligns all metadata (titles, release years, directors, descriptions, eras)
 *    with verified visual assets for existing catalogue entries and future uploads.
 */

import type { Movie, Genre, Era, StreamingPlatform } from '../types.ts';
import { 
  isNigerianMovie, 
  validateNigerianMovie, 
  ValidationStatus, 
  extractOriginCountries, 
  parseSpokenLanguages,
  NIGERIAN_ORIGIN_COUNTRY,
  KNOWN_FOREIGN_TITLES_LOWER 
} from './nigerianMovieValidator.ts';
import { normalizeMovieCollections } from './movieCollections.ts';

export {
  isNigerianMovie,
  validateNigerianMovie,
  ValidationStatus,
  extractOriginCountries,
  parseSpokenLanguages
};

export interface ArtworkValidationResult {
  isValid: boolean;
  isRegionalMatch: boolean;
  confidence: 'high' | 'medium' | 'low' | 'rejected';
  reason: string;
  recommendedPosterUrl?: string;
  recommendedBackdropUrl?: string;
}

export interface MovieValidationReport {
  isValid: boolean;
  artworkValidation: ArtworkValidationResult;
  issues: string[];
  sanitizedMovie: Movie;
}

// Trusted default verified visual assets for Nigerian cinema fallbacks
export const VERIFIED_NOLLYWOOD_FALLBACK_POSTER = 
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop';
export const VERIFIED_NOLLYWOOD_FALLBACK_BACKDROP = 
  'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=1600&auto=format&fit=crop';

// Known international studio artwork markers and non-Nigerian domain/path patterns
const FOREIGN_ARTWORK_URL_PATTERNS = [
  /disney/i,
  /marvel/i,
  /hollywood/i,
  /pixar/i,
  /dreamworks/i,
  /bollywood/i,
  /anime/i,
  /korean/i,
  /wallace.*gromit/i,
  /blade.*runner/i,
  /star.*wars/i,
  /harry.*potter/i
];

/**
 * Determine Nollywood Era from release year
 */
export function determineNollywoodEra(year: number): Era {
  if (year <= 2005) return 'Golden Era (1992-2005)';
  if (year <= 2018) return 'New Nollywood (2006-2018)';
  return 'Modern Global Era (2019-Present)';
}

/**
 * Cross-references a movie's artwork (poster and backdrop) with official title,
 * release year, and regional origin to detect and prevent mismatched international artwork.
 */
export function validateMovieArtwork(params: {
  title?: string;
  posterUrl?: string;
  backdropUrl?: string;
  originCountry?: string[] | string;
  productionCountries?: Array<{ iso_3166_1?: string; name?: string }> | string[];
  releaseYear?: number;
  tmdbId?: number | null;
}): ArtworkValidationResult {
  const { title = '', posterUrl = '', backdropUrl = '', originCountry, productionCountries } = params;
  const normalizedTitle = title.trim().toLowerCase();

  // 1. Check for missing artwork
  if (!posterUrl || !posterUrl.trim()) {
    return {
      isValid: false,
      isRegionalMatch: false,
      confidence: 'low',
      reason: 'No poster URL provided.',
      recommendedPosterUrl: VERIFIED_NOLLYWOOD_FALLBACK_POSTER,
      recommendedBackdropUrl: VERIFIED_NOLLYWOOD_FALLBACK_BACKDROP
    };
  }

  // 2. Cross-reference regional origin
  const countries = extractOriginCountries({
    origin_country: originCountry,
    production_countries: productionCountries
  });

  const isNigerianOrigin = countries.includes(NIGERIAN_ORIGIN_COUNTRY) || countries.length === 0;

  // 3. Check for blacklisted international titles that leaked into artwork or catalog
  const isKnownForeignTitle = KNOWN_FOREIGN_TITLES_LOWER.some(foreign => 
    normalizedTitle === foreign || 
    (foreign.length > 5 && normalizedTitle.startsWith(foreign + ':'))
  );

  if (isKnownForeignTitle) {
    return {
      isValid: false,
      isRegionalMatch: false,
      confidence: 'rejected',
      reason: `Title "${title}" matches a known international / non-Nigerian production. Mismatched artwork rejected.`,
      recommendedPosterUrl: VERIFIED_NOLLYWOOD_FALLBACK_POSTER,
      recommendedBackdropUrl: VERIFIED_NOLLYWOOD_FALLBACK_BACKDROP
    };
  }

  // 4. Inspect poster URL for international studio patterns
  const posterMatchesForeign = FOREIGN_ARTWORK_URL_PATTERNS.some(regex => regex.test(posterUrl));
  const backdropMatchesForeign = backdropUrl ? FOREIGN_ARTWORK_URL_PATTERNS.some(regex => regex.test(backdropUrl)) : false;

  if (posterMatchesForeign || backdropMatchesForeign) {
    return {
      isValid: false,
      isRegionalMatch: false,
      confidence: 'rejected',
      reason: 'Visual asset URL contains non-Nigerian studio keywords or international markers.',
      recommendedPosterUrl: VERIFIED_NOLLYWOOD_FALLBACK_POSTER,
      recommendedBackdropUrl: VERIFIED_NOLLYWOOD_FALLBACK_BACKDROP
    };
  }

  // 5. If origin countries are explicitly specified and do NOT include Nigeria, flag as regional mismatch
  if (countries.length > 0 && !countries.includes(NIGERIAN_ORIGIN_COUNTRY)) {
    return {
      isValid: false,
      isRegionalMatch: false,
      confidence: 'rejected',
      reason: `Regional origin (${countries.join(', ')}) is foreign and does not include Nigeria ('${NIGERIAN_ORIGIN_COUNTRY}').`,
      recommendedPosterUrl: VERIFIED_NOLLYWOOD_FALLBACK_POSTER,
      recommendedBackdropUrl: VERIFIED_NOLLYWOOD_FALLBACK_BACKDROP
    };
  }

  // 6. Artwork URL structure validation (TMDb secure CDN or valid HTTPS URLs)
  const isTmdbImage = posterUrl.includes('image.tmdb.org');
  const isHttps = posterUrl.startsWith('https://') || posterUrl.startsWith('http://');

  if (!isHttps) {
    return {
      isValid: false,
      isRegionalMatch: isNigerianOrigin,
      confidence: 'low',
      reason: 'Artwork URL must use a secure web protocol (HTTPS).',
      recommendedPosterUrl: VERIFIED_NOLLYWOOD_FALLBACK_POSTER,
      recommendedBackdropUrl: VERIFIED_NOLLYWOOD_FALLBACK_BACKDROP
    };
  }

  return {
    isValid: true,
    isRegionalMatch: true,
    confidence: isTmdbImage ? 'high' : 'medium',
    reason: 'Artwork successfully cross-referenced with Nollywood title and regional provenance.',
    recommendedPosterUrl: posterUrl,
    recommendedBackdropUrl: backdropUrl || posterUrl
  };
}

/**
 * Sanitizes and cleans a movie title:
 * - Trims whitespace
 * - Removes video resolution tags like "[1080p]", "(HD)", "4K"
 * - Removes common YouTube rip strings like "Full Movie", "Nigerian Movie 2024", "Latest Nollywood"
 * - Strips file extensions like .mp4, .mkv
 */
export function sanitizeMovieTitle(rawTitle: string): string {
  if (!rawTitle) return 'Untitled Nollywood Film';
  let cleaned = rawTitle.trim();

  // Strip file extensions
  cleaned = cleaned.replace(/\.(mp4|mkv|avi|mov|webm)$/i, '');

  // Strip anything inside brackets or parens containing resolution, format or promo tags
  const tagPattern = /(?:1080p|720p|480p|360p|2160p|4k|hd|uhd|bluray|blu-ray|web-dl|webrip|rip|dvd|cam|full\s*movie|complete\s*season|part\s*\d+|official\s*trailer)/i;
  cleaned = cleaned.replace(/\[([^\]]*)\]/g, (match, inner) => {
    return tagPattern.test(inner) ? '' : match;
  });
  cleaned = cleaned.replace(/\(([^)]*)\)/g, (match, inner) => {
    return tagPattern.test(inner) ? '' : match;
  });

  // Strip standalone video resolution keywords
  cleaned = cleaned.replace(/\b(1080p|720p|480p|4k|uhd|bluray|web-dl|webrip)\b/gi, '');

  // Strip common promo suffixes
  cleaned = cleaned.replace(/[-–—]\s*(latest\s+)?(nigerian|nollywood)\s+movie(\s+\d{4})?/gi, '');
  cleaned = cleaned.replace(/\b(latest\s+)?(nigerian|nollywood)\s+movie(\s+\d{4})?\b/gi, '');
  cleaned = cleaned.replace(/\b(full\s+movie|complete\s+season|part\s+\d+)\b/gi, '');

  // Clean empty brackets or parentheses that might remain
  cleaned = cleaned.replace(/\[\s*\]/g, '').replace(/\(\s*\)/g, '');

  // Strip multiple consecutive spaces and trailing/leading punctuation
  cleaned = cleaned.replace(/\s+/g, ' ').replace(/^[-–—\s:,]+|[-–—\s:,]+$/g, '').trim();

  return cleaned.length > 0 ? cleaned : rawTitle.trim();
}

/**
 * Sanitizes a director name
 */
export function sanitizeDirectorName(rawDirector: string): string {
  if (!rawDirector) return 'Unknown Director';
  let cleaned = rawDirector.trim();
  cleaned = cleaned.replace(/^(directed\s+by[:.]?|director[:.]?|dir[:.]?)\s*/i, '');
  cleaned = cleaned.replace(/^[:\-–—\s]+/, '');
  return cleaned.trim() || 'Unknown Director';
}

/**
 * Sanitizes and aligns all movie metadata with verified visual assets
 */
export function sanitizeAndAlignMovieMetadata<T extends Partial<Movie>>(movie: T): Movie {
  const currentYear = new Date().getFullYear();
  const rawYear = typeof movie.releaseYear === 'number' && !isNaN(movie.releaseYear)
    ? movie.releaseYear
    : parseInt(String(movie.releaseYear || currentYear), 10);
  
  // Constrain release year to authentic Nollywood historical range
  const releaseYear = Math.max(1960, Math.min(currentYear + 2, isNaN(rawYear) ? currentYear : rawYear));
  const era = determineNollywoodEra(releaseYear);

  const title = sanitizeMovieTitle(movie.title || 'Untitled Nollywood Film');
  const director = sanitizeDirectorName(movie.director || 'Unknown Director');

  // Cross-reference artwork
  const artworkCheck = validateMovieArtwork({
    title,
    posterUrl: movie.posterUrl,
    backdropUrl: movie.backdropUrl,
    originCountry: movie.originCountry,
    releaseYear,
    tmdbId: movie.tmdbId
  });

  const posterUrl = artworkCheck.isValid 
    ? (movie.posterUrl || VERIFIED_NOLLYWOOD_FALLBACK_POSTER) 
    : (artworkCheck.recommendedPosterUrl || VERIFIED_NOLLYWOOD_FALLBACK_POSTER);

  const backdropUrl = movie.backdropUrl && movie.backdropUrl.trim().length > 0 && artworkCheck.isValid
    ? movie.backdropUrl
    : (artworkCheck.recommendedBackdropUrl || posterUrl);

  const safeGenres = Array.isArray(movie.genres) && movie.genres.length > 0
    ? Array.from(new Set(movie.genres.map(g => String(g).trim()).filter(Boolean)))
    : ['Drama'];

  const safeLanguages = Array.isArray(movie.languages) && movie.languages.length > 0
    ? Array.from(new Set(movie.languages.map(l => String(l).trim()).filter(Boolean)))
    : ['English', 'Nigerian Pidgin'];

  const leadCast = Array.isArray(movie.leadCast) && movie.leadCast.length > 0
    ? movie.leadCast.map(c => ({
        actor: String(c.actor || 'Nollywood Actor').trim(),
        role: String(c.role || 'Lead Character').trim(),
        avatarUrl: c.avatarUrl || undefined,
        tmdbId: c.tmdbId ? Number(c.tmdbId) : undefined
      }))
    : [{ actor: 'Nollywood Cast', role: 'Lead Character' }];

  const safePlatforms: StreamingPlatform[] = Array.isArray(movie.streamingPlatforms) && movie.streamingPlatforms.length > 0
    ? movie.streamingPlatforms.map(p => ({
        name: p.name || 'Cinema',
        badgeColor: p.badgeColor || 'bg-emerald-600',
        url: p.url || undefined
      }))
    : [{ name: 'Cinema', badgeColor: 'bg-emerald-600' }];

  const rating = typeof movie.rating === 'number' && !isNaN(movie.rating)
    ? Math.max(1, Math.min(10, Math.round(movie.rating * 10) / 10))
    : 8.0;

  const ratingCount = typeof movie.ratingCount === 'number' && !isNaN(movie.ratingCount)
    ? Math.max(1, Math.round(movie.ratingCount))
    : 25;

  const runtimeMinutes = typeof movie.runtimeMinutes === 'number' && !isNaN(movie.runtimeMinutes)
    ? Math.max(20, Math.min(360, Math.round(movie.runtimeMinutes)))
    : 110;

  // Stable document ID derived from title and year if missing
  const safeId = movie.id || (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + `-${releaseYear}`
  );

  const alignedMovie: Movie = {
    id: safeId,
    title,
    nativeTitle: movie.nativeTitle ? movie.nativeTitle.trim() : undefined,
    tagline: movie.tagline ? movie.tagline.trim() : `${title} — A celebrated Nollywood story.`,
    releaseYear,
    director,
    directorAvatarUrl: movie.directorAvatarUrl || undefined,
    directorTmdbId: movie.directorTmdbId ? Number(movie.directorTmdbId) : undefined,
    producer: movie.producer ? movie.producer.trim() : undefined,
    leadCast,
    genres: safeGenres,
    languages: safeLanguages,
    era: era as 'Golden Era (1992-2005)' | 'New Nollywood (2006-2018)' | 'Modern Global Era (2019-Present)',
    runtimeMinutes,
    rating,
    ratingCount,
    boxOffice: movie.boxOffice ? movie.boxOffice.trim() : undefined,
    posterUrl,
    backdropUrl,
    synopsis: movie.synopsis && movie.synopsis.trim().length > 0
      ? movie.synopsis.trim()
      : `An acclaimed Nigerian film capturing authentic cultural storytelling, drama, and contemporary Nollywood artistry.`,
    culturalSignificance: movie.culturalSignificance && movie.culturalSignificance.trim().length > 0
      ? movie.culturalSignificance.trim()
      : `Highlights the vibrant storytelling traditions of Nigerian cinema.`,
    streamingPlatforms: safePlatforms,
    collections: normalizeMovieCollections(movie.collections),
    originCountry: Array.isArray(movie.originCountry) && movie.originCountry.length > 0
      ? movie.originCountry
      : [NIGERIAN_ORIGIN_COUNTRY],
    originalLanguage: movie.originalLanguage || 'en',
    trailerYoutubeId: movie.trailerYoutubeId ? movie.trailerYoutubeId.trim() : '',
    amvcaAwards: Array.isArray(movie.amvcaAwards) ? movie.amvcaAwards : undefined,
    quote: movie.quote ? {
      text: String(movie.quote.text || '').trim(),
      character: String(movie.quote.character || '').trim(),
      actor: String(movie.quote.actor || '').trim()
    } : undefined,
    featured: Boolean(movie.featured),
    boxOfficeChampion: Boolean(movie.boxOfficeChampion),
    isUserAdded: Boolean(movie.isUserAdded),
    source: movie.source || 'custom',
    addedByUserId: movie.addedByUserId || null,
    lastEditedByUserId: movie.lastEditedByUserId || null,
    tmdbId: movie.tmdbId ? Number(movie.tmdbId) : undefined
  };

  return alignedMovie;
}

/**
 * Validates a movie object for catalogue upload or update.
 * Returns a validation report containing status, issues, and the fully sanitized movie.
 */
export function validateMovieForUpload(movieData: Partial<Movie>): MovieValidationReport {
  const issues: string[] = [];

  if (!movieData.title || !movieData.title.trim()) {
    issues.push('Movie title is required.');
  }

  if (movieData.releaseYear && (movieData.releaseYear < 1960 || movieData.releaseYear > new Date().getFullYear() + 2)) {
    issues.push(`Release year must be between 1960 and ${new Date().getFullYear() + 2}.`);
  }

  if (!movieData.director || !movieData.director.trim()) {
    issues.push('Director name is required.');
  }

  // Cross-reference artwork with title and origin
  const artworkValidation = validateMovieArtwork({
    title: movieData.title,
    posterUrl: movieData.posterUrl,
    backdropUrl: movieData.backdropUrl,
    originCountry: movieData.originCountry,
    releaseYear: movieData.releaseYear,
    tmdbId: movieData.tmdbId
  });

  if (!artworkValidation.isValid) {
    issues.push(artworkValidation.reason);
  }

  const sanitizedMovie = sanitizeAndAlignMovieMetadata(movieData);

  return {
    isValid: issues.length === 0 && artworkValidation.isValid,
    artworkValidation,
    issues,
    sanitizedMovie
  };
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
