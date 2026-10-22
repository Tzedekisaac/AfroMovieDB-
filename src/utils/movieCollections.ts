export const DEFAULT_MOVIE_COLLECTION = 'All Nigerian Titles';

export function normalizeMovieCollections(value: unknown): string[] {
  const collections = Array.isArray(value)
    ? value
        .filter((collection): collection is string => typeof collection === 'string')
        .map((collection) => collection.trim())
        .filter(Boolean)
    : [];

  return Array.from(new Set([DEFAULT_MOVIE_COLLECTION, ...collections]));
}
