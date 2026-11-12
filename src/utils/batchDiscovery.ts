import type { Movie } from '../types.ts';
import { isNigerianMovie, sanitizeMovie } from './api.ts';
import { 
  determineNollywoodEra, 
  sanitizeAndAlignMovieMetadata,
  VERIFIED_NOLLYWOOD_FALLBACK_POSTER, 
  VERIFIED_NOLLYWOOD_FALLBACK_BACKDROP 
} from './validation.ts';
import { sanitizeAndTagMovie } from './sanitizeAndTagMovie.ts';
import { PRIMARY_OWNER_UID } from '../lib/firestoreService.ts';

export interface DiscoveredBatchItem {
  id: string;
  selected: boolean;
  movie: Movie;
  validation: {
    isValid: boolean;
    issues: string[];
    originCountry: string[];
    era: string;
  };
  alreadyExists: boolean;
}

export const ABSTRACT_QUERY_PRESETS = [
  'Top 20 Nollywood box office movies',
  'Classic 90s Yoruba epics',
  'Recent 2025/2026 Nigerian dramas',
  'Iconic 2000s New Nollywood classics',
  'Lagos crime heists and high-stakes thrillers',
  'AMVCA Best Indigenous Film Winners'
];

/**
 * Normalizes, aligns metadata, and runs strict Nigerian origin verification on raw AI-discovered movie entries.
 */
export function validateAndPrepareDiscoveredBatch(
  rawList: any[],
  existingCatalog: Movie[] = [],
  userId?: string
): DiscoveredBatchItem[] {
  if (!Array.isArray(rawList)) return [];

  return rawList.map((raw: any) => {
    const normTitle = String(raw?.title || 'Untitled Nollywood Film').trim();
    const releaseYear = Number(raw?.releaseYear) || new Date().getFullYear();
    const era = determineNollywoodEra(releaseYear);
    const cleanId = normTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const sanitized = sanitizeMovie({
      ...raw,
      id: cleanId,
      title: normTitle,
      releaseYear,
      era,
      originCountry: ['NG'],
      posterUrl: raw?.posterUrl || VERIFIED_NOLLYWOOD_FALLBACK_POSTER,
      backdropUrl: raw?.backdropUrl || VERIFIED_NOLLYWOOD_FALLBACK_BACKDROP,
      source: 'custom',
      isUserAdded: true,
      addedByUserId: userId || PRIMARY_OWNER_UID
    });

    const aligned = sanitizeAndAlignMovieMetadata(sanitizeAndTagMovie(sanitized) as Movie);
    const isValid = isNigerianMovie(aligned);
    const alreadyExists = existingCatalog.some(
      m => m.id === aligned.id || m.title.toLowerCase().trim() === aligned.title.toLowerCase().trim()
    );

    return {
      id: aligned.id,
      selected: isValid && !alreadyExists,
      movie: aligned,
      validation: {
        isValid,
        issues: isValid ? [] : ['Origin criteria not met: missing Nigerian tags'],
        originCountry: aligned.originCountry || ['NG'],
        era: aligned.era
      },
      alreadyExists
    };
  });
}
