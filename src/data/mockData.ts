import type { Movie, UserReview } from '../types.ts';

/**
 * Empty mock datasets.
 * Hardcoded default rating counts, rating distributions, and sample review seed objects
 * have been removed. All data is queried and calculated dynamically from live Firestore.
 */
export const mockMovies: Movie[] = [];
export const mockReviews: UserReview[] = [];
export const INITIAL_REVIEWS: UserReview[] = [];
