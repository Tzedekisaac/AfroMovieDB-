import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDeepLinkParams,
  parseTmdbIdFromMovieParam,
  removeQueryParamFromUrl,
  buildListDeepLinkUrl,
  findMovieById,
  findListById,
} from '../src/utils/modalRouterHelpers.ts';

test('1. parseDeepLinkParams extracts ?movie= and ?list= query parameters cleanly', () => {
  assert.deepStrictEqual(parseDeepLinkParams('?movie=the-black-book'), {
    movieId: 'the-black-book',
    listId: null,
  });

  assert.deepStrictEqual(parseDeepLinkParams('?list=lagos-classics&ref=share'), {
    movieId: null,
    listId: 'lagos-classics',
  });

  assert.deepStrictEqual(parseDeepLinkParams('?movie=tmdb-12345&list=favorites'), {
    movieId: 'tmdb-12345',
    listId: 'favorites',
  });

  assert.deepStrictEqual(parseDeepLinkParams(''), {
    movieId: null,
    listId: null,
  });
});

test('2. parseTmdbIdFromMovieParam validates numeric and tmdb-prefixed IDs', () => {
  assert.strictEqual(parseTmdbIdFromMovieParam('tmdb-987654'), 987654);
  assert.strictEqual(parseTmdbIdFromMovieParam('54321'), 54321);
  assert.strictEqual(parseTmdbIdFromMovieParam('a-tribe-called-judah'), null);
  assert.strictEqual(parseTmdbIdFromMovieParam('tmdb-0'), null);
  assert.strictEqual(parseTmdbIdFromMovieParam(''), null);
});

test('3. removeQueryParamFromUrl strips target parameter while preserving other query params and hash', () => {
  const cleanedList = removeQueryParamFromUrl(
    'https://naijareel.app/?list=abc123&movie=xyz#details',
    'list'
  );
  assert.strictEqual(cleanedList, '/?movie=xyz#details');

  const cleanedMovie = removeQueryParamFromUrl(
    'https://naijareel.app/?movie=the-black-book',
    'movie'
  );
  assert.strictEqual(cleanedMovie, '/');

  const unchanged = removeQueryParamFromUrl('https://naijareel.app/profile', 'list');
  assert.strictEqual(unchanged, null);
});

test('4. buildListDeepLinkUrl sets ?list=<id> only when missing or different', () => {
  const updated = buildListDeepLinkUrl('https://naijareel.app/', 'my-list-1');
  assert.strictEqual(updated, 'https://naijareel.app/?list=my-list-1');

  const alreadySet = buildListDeepLinkUrl('https://naijareel.app/?list=my-list-1', 'my-list-1');
  assert.strictEqual(alreadySet, null);
});

test('5. findMovieById and findListById resolve entities by ID or tmdbId', () => {
  const movies = [
    { id: 'the-black-book', tmdbId: 1094556, title: 'The Black Book' },
    { id: 'anikulapo', tmdbId: 990123, title: 'Anikulapo' },
  ];
  const lists = [
    { id: 'list-1', title: 'Golden Era Gems' },
    { id: 'list-2', title: 'Top Thrillers' },
  ];

  assert.strictEqual(findMovieById(movies, 'anikulapo')?.title, 'Anikulapo');
  assert.strictEqual(findMovieById(movies, 'tmdb-1094556')?.id, 'the-black-book');
  assert.strictEqual(findMovieById(movies, 'missing-id'), null);

  assert.strictEqual(findListById(lists, 'list-2')?.title, 'Top Thrillers');
  assert.strictEqual(findListById(lists, 'missing-list'), null);
});
