import type { Movie, UserReview } from '../types.ts';

/**
 * Initial reviews catalogue.
 * Empty by default — all reviews and ratings are calculated dynamically solely from live Firestore.
 * Hardcoded default rating counts, distribution percentages, and seed objects have been removed.
 */
export const mockMovies: Movie[] = [];
export const mockReviews: UserReview[] = [];
export const INITIAL_REVIEWS: UserReview[] = [];
