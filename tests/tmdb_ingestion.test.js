import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterVerifiedTmdbCandidates,
  evaluateTmdbSearchResults,
  canSaveVerifiedTmdbMovie
} from '../src/utils/tmdbIngestion.ts';
import {
  hasExplicitNigerianOrigin,
  sanitizeCandidate,
  sanitizeMovie
} from '../src/utils/api.ts';

test('1. filterVerifiedTmdbCandidates strictly enforces origin_country: ["NG"] and valid tmdbId', () => {
  const rawCandidates = [
    {
      tmdbId: 118001,
      title: 'Anikulapo',
      releaseYear: 2022,
      overview: 'After an affair with a queen leads to his demise, a traveler encounters a mystical bird.',
      posterUrl: 'https://image.tmdb.org/t/p/w780/anikulapo.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/original/anikulapo-bg.jpg',
      rating: 7.4,
      ratingCount: 95,
      originCountry: ['NG'],
      originalLanguage: 'yo'
    },
    {
      tmdbId: 999002,
      title: 'Foreign Action Movie',
      releaseYear: 2024,
      overview: 'Hollywood explosion film.',
      posterUrl: '',
      backdropUrl: '',
      rating: 6.5,
      ratingCount: 200,
      originCountry: ['US'],
      originalLanguage: 'en'
    },
    {
      tmdbId: 999003,
      title: 'Missing Origin Country Film',
      releaseYear: 2023,
      overview: 'No origin country tag provided.',
      posterUrl: '',
      backdropUrl: '',
      rating: 0,
      ratingCount: 0,
      originCountry: [],
      originalLanguage: 'yo'
    },
    {
      tmdbId: 0,
      title: 'Fake Zero ID Film',
      releaseYear: 2024,
      overview: '',
      posterUrl: '',
      backdropUrl: '',
      rating: 0,
      ratingCount: 0,
      originCountry: ['NG'],
      originalLanguage: 'en'
    },
    {
      tmdbId: 1574114,
      title: 'Call Me',
      releaseYear: 2024,
      overview: '',
      posterUrl: '',
      backdropUrl: '',
      rating: 0,
      ratingCount: 0,
      originCountry: ['NG'],
      originalLanguage: 'en'
    }
  ];

  const verified = filterVerifiedTmdbCandidates(rawCandidates);
  assert.strictEqual(verified.length, 1);
  assert.strictEqual(verified[0].tmdbId, 118001);
  assert.strictEqual(verified[0].title, 'Anikulapo');
  assert.strictEqual(hasExplicitNigerianOrigin(verified[0]), true);
});

test('2. evaluateTmdbSearchResults returns "No verified Nigerian film found" error and disables saving when 0 matches exist', () => {
  const emptyEvaluation = evaluateTmdbSearchResults('Nonexistent Movie 2099', []);
  assert.strictEqual(emptyEvaluation.candidates.length, 0);
  assert.strictEqual(emptyEvaluation.canSaveToFirestore, false);
  assert.ok(emptyEvaluation.errorMessage);
  assert.match(emptyEvaluation.errorMessage, /No verified Nigerian film found/i);

  // Also test when results exist but none pass strict origin_country: ['NG']
  const foreignOnlyEvaluation = evaluateTmdbSearchResults('Inception', [
    {
      tmdbId: 27205,
      title: 'Inception',
      releaseYear: 2010,
      overview: 'Mind heist.',
      posterUrl: '',
      backdropUrl: '',
      rating: 8.4,
      ratingCount: 35000,
      originCountry: ['US', 'GB'],
      originalLanguage: 'en'
    }
  ]);
  assert.strictEqual(foreignOnlyEvaluation.candidates.length, 0);
  assert.strictEqual(foreignOnlyEvaluation.canSaveToFirestore, false);
  assert.match(foreignOnlyEvaluation.errorMessage || '', /No verified Nigerian film found/i);
});

test('3. canSaveVerifiedTmdbMovie requires real TMDb match (tmdbId > 0) and strict NG originCountry', () => {
  assert.strictEqual(canSaveVerifiedTmdbMovie(null), false);
  assert.strictEqual(canSaveVerifiedTmdbMovie(undefined, 'No verified Nigerian film found'), false);

  // Reject AI/template-like movie with no tmdbId
  assert.strictEqual(
    canSaveVerifiedTmdbMovie({
      id: 'invented-film',
      title: 'Invented Film',
      originCountry: ['NG'],
      releaseYear: 2025
    }),
    false
  );

  // Reject TMDb movie with non-NG originCountry
  assert.strictEqual(
    canSaveVerifiedTmdbMovie({
      id: 'foreign-film-555',
      title: 'Foreign Film',
      tmdbId: 555,
      originCountry: ['GB'],
      releaseYear: 2023
    }),
    false
  );

  // Accept verified TMDb Nigerian film
  assert.strictEqual(
    canSaveVerifiedTmdbMovie({
      id: 'jagun-jagun-112233',
      title: 'Jagun Jagun',
      tmdbId: 112233,
      originCountry: ['NG'],
      releaseYear: 2023
    }),
    true
  );
});

test('4. sanitizeCandidate and sanitizeMovie never invent hallucinated placeholder cast, director, synopsis, or fake ratings', () => {
  const minimalCandidate = sanitizeCandidate({
    id: 555111,
    title: 'Minimal Nigerian Film',
    release_date: '2024-05-01',
    origin_country: ['NG']
  });

  assert.strictEqual(minimalCandidate.rating, 0);
  assert.strictEqual(minimalCandidate.ratingCount, 0);
  assert.strictEqual(minimalCandidate.overview, '');
  assert.doesNotMatch(minimalCandidate.overview, /captivating Nollywood cinematic story/i);

  const minimalMovie = sanitizeMovie({
    id: 'minimal-nigerian-film-555111',
    tmdbId: 555111,
    title: 'Minimal Nigerian Film',
    releaseYear: 2024,
    originCountry: ['NG']
  });

  assert.strictEqual(minimalMovie.director, '');
  assert.deepStrictEqual(minimalMovie.leadCast, []);
  assert.strictEqual(minimalMovie.synopsis, '');
  assert.strictEqual(minimalMovie.rating, 0);
  assert.strictEqual(minimalMovie.ratingCount, 0);
  assert.doesNotMatch(minimalMovie.director, /Nigerian Filmmaker Team|Renowned Nollywood Director/i);
});
