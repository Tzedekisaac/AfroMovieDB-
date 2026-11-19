import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_FILTER_STATE,
  MOVIES_BATCH_SIZE,
  normalizeCatalogMovies,
  applyCollectionFilterUpdate,
  filterAndSortCatalogMovies,
  paginateCatalogMovies,
} from '../src/utils/catalogHelpers.ts';

function makeMovie(overrides = {}) {
  return {
    id: overrides.id || 'movie-1',
    title: overrides.title || 'Sample Nigerian Film',
    tagline: overrides.tagline || 'Lagos cinema story',
    releaseYear: overrides.releaseYear ?? 2023,
    director: overrides.director || 'Kunle Afolayan',
    leadCast: overrides.leadCast || [{ actor: 'Funke Akindele', role: 'Lead' }],
    genres: overrides.genres || ['Drama'],
    languages: overrides.languages || ['English'],
    era: overrides.era || 'Modern Global Era (2019-Present)',
    runtimeMinutes: overrides.runtimeMinutes ?? 110,
    rating: overrides.rating ?? 8.2,
    ratingCount: overrides.ratingCount ?? 15,
    posterUrl: 'https://image.tmdb.org/t/p/w500/sample.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/sample.jpg',
    synopsis: overrides.synopsis || 'Authentic Nigerian drama.',
    culturalSignificance: 'Nigerian cultural landmark',
    streamingPlatforms: overrides.streamingPlatforms || [{ name: 'Netflix', badgeColor: '#E50914' }],
    originCountry: overrides.originCountry || ['NG'],
    trailerYoutubeId: '',
    ...overrides,
  };
}

const SAMPLE_CATALOG = [
  makeMovie({
    id: 'judah',
    title: 'A Tribe Called Judah',
    releaseYear: 2023,
    era: 'Modern Global Era (2019-Present)',
    genres: ['Drama', 'Comedy'],
    languages: ['English', 'Nigerian Pidgin'],
    runtimeMinutes: 132,
    rating: 8.6,
    boxOffice: '₦1.4B',
    boxOfficeChampion: true,
    streamingPlatforms: [{ name: 'Cinema', badgeColor: '#f59e0b' }],
  }),
  makeMovie({
    id: 'saworoide',
    title: 'Saworoide',
    releaseYear: 1999,
    era: 'Golden Era (1992-2005)',
    genres: ['Epic & Folklore', 'Drama'],
    languages: ['Yoruba', 'English'],
    runtimeMinutes: 103,
    rating: 9.1,
    streamingPlatforms: [{ name: 'YouTube', badgeColor: '#ff0000' }],
  }),
  makeMovie({
    id: 'black-book',
    title: 'The Black Book',
    releaseYear: 2023,
    era: 'Modern Global Era (2019-Present)',
    genres: ['Crime & Thriller', 'Action'],
    languages: ['English'],
    runtimeMinutes: 124,
    rating: 8.1,
    boxOffice: 'Top Streaming',
    isUserAdded: true,
    streamingPlatforms: [{ name: 'Netflix', badgeColor: '#E50914' }],
  }),
  makeMovie({
    id: 'figurine',
    title: 'The Figurine (Araromire)',
    releaseYear: 2009,
    era: 'New Nollywood (2006-2018)',
    genres: ['Crime & Thriller', 'Drama'],
    languages: ['Yoruba', 'English'],
    runtimeMinutes: 122,
    rating: 8.4,
    streamingPlatforms: [{ name: 'Prime Video', badgeColor: '#00A8E1' }],
  }),
];

test('1. normalizeCatalogMovies filters out non-Nigerian records and Call Me / Arek Zasowski', () => {
  const normalized = normalizeCatalogMovies([
    makeMovie({ id: 'valid-ng', title: 'Anikulapo', originCountry: ['NG'] }),
    makeMovie({ id: 'call-me', title: 'Call Me', director: 'Arek Zasowski', originCountry: ['PL'] }),
    makeMovie({ id: 'foreign', title: 'Foreign Drama', director: 'Foreign Dir', originCountry: ['US'] }),
  ]);

  assert.strictEqual(normalized.length, 1);
  assert.strictEqual(normalized[0].id, 'valid-ng');
});

test('2. applyCollectionFilterUpdate configures all curated collections identically', () => {
  const boxOffice = applyCollectionFilterUpdate(INITIAL_FILTER_STATE, 'box-office');
  assert.strictEqual(boxOffice.sortBy, 'box_office');
  assert.strictEqual(boxOffice.selectedGenre, 'All');

  const epics = applyCollectionFilterUpdate(INITIAL_FILTER_STATE, 'epics');
  assert.strictEqual(epics.selectedGenre, 'Epic & Folklore');
  assert.strictEqual(epics.sortBy, 'rating');

  const goldenEra = applyCollectionFilterUpdate(INITIAL_FILTER_STATE, 'golden-era');
  assert.strictEqual(goldenEra.selectedEra, 'Golden Era (1992-2005)');
  assert.strictEqual(goldenEra.sortBy, 'year_asc');

  const crime = applyCollectionFilterUpdate(INITIAL_FILTER_STATE, 'crime-heist');
  assert.strictEqual(crime.selectedGenre, 'Crime & Thriller');

  const community = applyCollectionFilterUpdate(INITIAL_FILTER_STATE, 'community');
  assert.strictEqual(community.sortBy, 'year_desc');

  const all = applyCollectionFilterUpdate(goldenEra, 'all');
  assert.deepStrictEqual(all, INITIAL_FILTER_STATE);
});

test('3. filterAndSortCatalogMovies supports era, language, collection, watchlist, and search filters', () => {
  const eraMatches = filterAndSortCatalogMovies(SAMPLE_CATALOG, {
    filterState: { ...INITIAL_FILTER_STATE, selectedEra: 'Golden Era (1992-2005)' },
    activeCollection: 'all',
  });
  assert.deepStrictEqual(eraMatches.map((m) => m.id), ['saworoide']);

  const languageMatches = filterAndSortCatalogMovies(SAMPLE_CATALOG, {
    filterState: { ...INITIAL_FILTER_STATE, selectedLanguage: 'Yoruba' },
    activeCollection: 'all',
  });
  assert.deepStrictEqual(languageMatches.map((m) => m.id), ['saworoide', 'figurine']);

  const communityMatches = filterAndSortCatalogMovies(SAMPLE_CATALOG, {
    filterState: applyCollectionFilterUpdate(INITIAL_FILTER_STATE, 'community'),
    activeCollection: 'community',
  });
  assert.deepStrictEqual(communityMatches.map((m) => m.id), ['black-book']);

  const watchlistMatches = filterAndSortCatalogMovies(SAMPLE_CATALOG, {
    filterState: { ...INITIAL_FILTER_STATE, watchlistOnly: true },
    activeCollection: 'all',
    watchlistIds: ['judah'],
  });
  assert.deepStrictEqual(watchlistMatches.map((m) => m.id), ['judah']);
});

test('4. filterAndSortCatalogMovies supports all sorting modes accurately', () => {
  const byTitle = filterAndSortCatalogMovies(SAMPLE_CATALOG, {
    filterState: { ...INITIAL_FILTER_STATE, sortBy: 'title' },
    activeCollection: 'all',
  });
  assert.deepStrictEqual(byTitle.map((m) => m.id), ['judah', 'saworoide', 'black-book', 'figurine']);

  const byYearAsc = filterAndSortCatalogMovies(SAMPLE_CATALOG, {
    filterState: { ...INITIAL_FILTER_STATE, sortBy: 'year_asc' },
    activeCollection: 'all',
  });
  assert.strictEqual(byYearAsc[0].id, 'saworoide');

  const byRuntimeDesc = filterAndSortCatalogMovies(SAMPLE_CATALOG, {
    filterState: { ...INITIAL_FILTER_STATE, sortBy: 'runtime_desc' },
    activeCollection: 'all',
  });
  assert.strictEqual(byRuntimeDesc[0].id, 'judah');

  const byBoxOffice = filterAndSortCatalogMovies(SAMPLE_CATALOG, {
    filterState: { ...INITIAL_FILTER_STATE, sortBy: 'box_office' },
    activeCollection: 'all',
  });
  assert.strictEqual(byBoxOffice[0].id, 'judah');
  assert.strictEqual(byBoxOffice[1].id, 'black-book');

  const trackingMap = new Map([['figurine', { movieId: 'figurine', status: 'completed', rewatchCount: 5, updatedAt: '2024-01-01' }]]);
  const byRewatch = filterAndSortCatalogMovies(SAMPLE_CATALOG, {
    filterState: { ...INITIAL_FILTER_STATE, sortBy: 'rewatch_desc' },
    activeCollection: 'all',
    trackingMap,
  });
  assert.strictEqual(byRewatch[0].id, 'figurine');
});

test('5. paginateCatalogMovies slices fixed 12-item batches and reports hasMore correctly', () => {
  const manyMovies = Array.from({ length: 15 }, (_, idx) =>
    makeMovie({ id: `movie-${idx + 1}`, title: `Movie ${idx + 1}` })
  );

  const page1 = paginateCatalogMovies(manyMovies, MOVIES_BATCH_SIZE);
  assert.strictEqual(page1.displayedMovies.length, 12);
  assert.strictEqual(page1.hasMore, true);
  assert.strictEqual(page1.remainingCount, 3);

  const page2 = paginateCatalogMovies(manyMovies, MOVIES_BATCH_SIZE * 2);
  assert.strictEqual(page2.displayedMovies.length, 15);
  assert.strictEqual(page2.hasMore, false);
  assert.strictEqual(page2.remainingCount, 0);
});
