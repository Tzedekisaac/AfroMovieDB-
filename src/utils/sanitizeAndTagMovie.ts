import type { Movie } from '../types';
import { normalizeMovieCollections } from './movieCollections';

function replaceUndefinedValues(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === null || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map(replaceUndefinedValues);
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    // Preserve Firestore values such as Timestamp and FieldValue instances.
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, child]) => [key, replaceUndefinedValues(child)])
  );
}

/**
 * Normalizes every movie ingestion path: adds the default collection tag and
 * replaces undefined values recursively so Firestore never receives them.
 */
export function sanitizeAndTagMovie<T extends object>(movie: T): T & { collections: string[] } {
  const cleaned = replaceUndefinedValues(movie) as Record<string, unknown>;
  cleaned.collections = normalizeMovieCollections(cleaned.collections);
  return cleaned as T & Pick<Movie, 'collections'> & { collections: string[] };
}
