import type { UserReview } from '../types.ts';

/**
 * Initial reviews catalogue.
 * Empty by default — all reviews are user-submitted and queried dynamically from Firestore.
 * Hardcoded sample reviews (e.g. Babatunde Alao, 2023) have been removed.
 */
export const INITIAL_REVIEWS: UserReview[] = [];
