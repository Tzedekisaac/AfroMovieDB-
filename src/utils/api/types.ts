export interface WebMovieCandidate {
  tmdbId: number;
  title: string;
  originalTitle?: string;
  releaseYear: number;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  rating: number;
  ratingCount: number;
  genreIds?: number[];
  language?: string;
  popularity?: number;
  originCountry?: string[];
  originalLanguage?: string;
}

export interface CacheEnvelope<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version: number;
}

/**
 * Progress update payload for deep historical sweep.
 * Internal page numbers are excluded from user-facing status displays where applicable.
 */
export interface HistoricalSweepProgress {
  decadeLabel: string;
  page: number;
  totalPages: number;
  importedCount: number;
  percent: number;
  isComplete: boolean;
  isCancelled: boolean;
  isSaving: boolean;
  firestoreSaveStarted: boolean;
  statusText: string;
}
