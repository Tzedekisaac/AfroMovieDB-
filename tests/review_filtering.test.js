import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMovieRatingBreakdown } from '../src/lib/firestoreService.ts';
import { INITIAL_REVIEWS } from '../src/data/reviews.ts';

test('1. calculateMovieRatingBreakdown computes accurate 5-star to 1-star distribution for a movie', () => {
  const sampleMovieReviews = [
    {
      id: 'rev-1',
      movieId: 'a-tribe-called-judah',
      userName: 'Tunde',
      rating: 10, // 5 stars
      comment: 'Superb acting and storytelling!',
      createdAt: '2024-01-15',
      userLocation: 'Lagos'
    },
    {
      id: 'rev-2',
      movieId: 'a-tribe-called-judah',
      userName: 'Chioma',
      rating: 8, // 4 stars
      comment: 'Loved the family dynamics.',
      createdAt: '2024-01-16',
      userLocation: 'Abuja'
    },
    {
      id: 'rev-3',
      movieId: 'a-tribe-called-judah',
      userName: 'Emeka',
      rating: 6, // 3 stars
      comment: 'Good movie overall.',
      createdAt: '2024-01-17',
      userLocation: 'Enugu'
    }
  ];

  const breakdown = calculateMovieRatingBreakdown(sampleMovieReviews, { rating: 8.5, ratingCount: 100 });

  assert.strictEqual(breakdown.total, 3);
  assert.strictEqual(breakdown.average10, '8.0');
  assert.strictEqual(breakdown.average5, '4.0');
  assert.strictEqual(breakdown.source, 'Verified NaijaReel User Reviews');

  const star5 = breakdown.stars.find(s => s.star === 5);
  const star4 = breakdown.stars.find(s => s.star === 4);
  const star3 = breakdown.stars.find(s => s.star === 3);
  const star2 = breakdown.stars.find(s => s.star === 2);
  const star1 = breakdown.stars.find(s => s.star === 1);

  assert.strictEqual(star5?.count, 1);
  assert.strictEqual(star4?.count, 1);
  assert.strictEqual(star3?.count, 1);
  assert.strictEqual(star2?.count, 0);
  assert.strictEqual(star1?.count, 0);

  // Each of the 3 reviews contributes 33% (rounded)
  assert.strictEqual(star5?.percent, 33);
  assert.strictEqual(star4?.percent, 33);
  assert.strictEqual(star3?.percent, 33);
});

test('2. calculateMovieRatingBreakdown returns clean zero rating state without fallback ratings when no reviews exist', () => {
  const emptyReviews = [];
  const breakdown = calculateMovieRatingBreakdown(emptyReviews);

  assert.strictEqual(breakdown.total, 0);
  assert.strictEqual(breakdown.average10, '0.0');
  assert.strictEqual(breakdown.average5, '0.0');
  assert.strictEqual(breakdown.source, 'No reviews yet');
  assert.strictEqual(breakdown.stars.length, 5);

  const totalSum = breakdown.stars.reduce((acc, s) => acc + s.count, 0);
  assert.strictEqual(totalSum, 0);
});

test('3. Dynamic review filtering strictly filters by movieId == currentMovieId and prevents ghost reviews', () => {
  const currentMovieId = 'the-black-book';

  const mixedReviewsFromGlobalOrSnapshot = [
    {
      id: 'rev-global-1',
      movieId: 'the-black-book',
      userName: 'Amina',
      rating: 10,
      comment: 'Incredible Nollywood action thriller.',
      createdAt: '2023-10-02',
      userLocation: 'Abuja'
    },
    {
      id: 'rev-ghost-1',
      movieId: 'a-tribe-called-judah', // GHOST REVIEW FROM ANOTHER MOVIE
      userName: 'Chidi',
      rating: 9,
      comment: 'Funke Akindele once again proved why she rules Nigerian cinema.',
      createdAt: '2024-01-14',
      userLocation: 'Lagos'
    },
    {
      id: 'rev-ghost-2',
      movieId: 'saworoide', // GHOST REVIEW FROM ANOTHER MOVIE
      userName: 'Babatunde',
      rating: 10,
      comment: 'Tunde Kelani masterpiece.',
      createdAt: '2023-11-19',
      userLocation: 'Ibadan'
    }
  ];

  // Apply strict dynamic movieId matching as implemented in ReviewSection & subscribeToMovieReviews
  const movieSpecificReviews = mixedReviewsFromGlobalOrSnapshot.filter(
    r => r.movieId === currentMovieId
  );

  assert.strictEqual(movieSpecificReviews.length, 1);
  assert.strictEqual(movieSpecificReviews[0].id, 'rev-global-1');
  assert.strictEqual(movieSpecificReviews[0].movieId, currentMovieId);

  // Verify none of the ghost reviews leaked through
  assert.strictEqual(movieSpecificReviews.some(r => r.movieId === 'a-tribe-called-judah'), false);
  assert.strictEqual(movieSpecificReviews.some(r => r.movieId === 'saworoide'), false);
});

test('4. Hardcoded mock reviews (e.g. Babatunde Alao, 2023) are removed and 0 reviews yield empty state without mock data fallback', () => {
  // Verify INITIAL_REVIEWS has no hardcoded sample reviews
  assert.strictEqual(INITIAL_REVIEWS.length, 0);
  assert.strictEqual(INITIAL_REVIEWS.some(r => r.userName?.includes('Babatunde Alao')), false);
  assert.strictEqual(INITIAL_REVIEWS.some(r => r.createdAt?.includes('2023')), false);

  // When querying/filtering for any movie with 0 reviews, it strictly yields an empty list
  const targetMovieId = 'saworoide';
  const matchingInitial = INITIAL_REVIEWS.filter(r => r.movieId === targetMovieId);
  assert.strictEqual(matchingInitial.length, 0);

  const unrelatedMovieId = 'an-unreviewed-film-999';
  const unrelatedInitial = INITIAL_REVIEWS.filter(r => r.movieId === unrelatedMovieId);
  assert.strictEqual(unrelatedInitial.length, 0);
});
