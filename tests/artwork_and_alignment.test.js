import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  validateMovieArtwork, 
  sanitizeAndAlignMovieMetadata, 
  validateMovieForUpload,
  sanitizeMovieTitle,
  determineNollywoodEra,
  alignExistingCatalog,
  verifyArtworkAgainstTitleAndOrigin,
  VERIFIED_NOLLYWOOD_FALLBACK_POSTER 
} from '../src/utils/validation.ts';

test('1. Valid Nollywood artwork with verified Nigerian regional origin is accepted', () => {
  const result = validateMovieArtwork({
    title: 'The Black Book',
    posterUrl: 'https://image.tmdb.org/t/p/w780/blackbook-poster.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/blackbook-banner.jpg',
    originCountry: ['NG'],
    releaseYear: 2023
  });

  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.isRegionalMatch, true);
  assert.strictEqual(result.confidence, 'high');
});

test('2. Mismatched international artwork with foreign studio keywords is rejected', () => {
  const result = validateMovieArtwork({
    title: 'Lionheart',
    posterUrl: 'https://cdn.hollywood-marvel-disney.com/posters/disney-remake.jpg',
    originCountry: ['NG'],
    releaseYear: 2018
  });

  assert.strictEqual(result.isValid, false);
  assert.strictEqual(result.confidence, 'rejected');
  assert.match(result.reason, /non-Nigerian studio keywords/i);
  assert.strictEqual(result.recommendedPosterUrl, VERIFIED_NOLLYWOOD_FALLBACK_POSTER);
});

test('3. Foreign regional origin without Nigeria is detected as mismatched artwork', () => {
  const result = validateMovieArtwork({
    title: 'California Sunset',
    posterUrl: 'https://image.tmdb.org/t/p/w780/american-journey-poster.jpg',
    originCountry: ['US'],
    releaseYear: 1993
  });

  assert.strictEqual(result.isValid, false);
  assert.strictEqual(result.isRegionalMatch, false);
  assert.match(result.reason, /foreign and does not include Nigeria/i);
});

test('4. Blacklisted international titles with mismatched artwork are rejected', () => {
  const result = verifyArtworkAgainstTitleAndOrigin(
    'Wallace & Gromit',
    'https://image.tmdb.org/t/p/w780/wallace.jpg',
    ['GB']
  );

  assert.strictEqual(result.isValid, false);
  assert.strictEqual(result.confidence, 'rejected');
  assert.match(result.reason, /known international \/ non-Nigerian production/i);
});

test('5. sanitizeMovieTitle removes video tags, file extensions, and upload junk', () => {
  assert.strictEqual(
    sanitizeMovieTitle('Jagun Jagun [1080p] - Latest Nollywood Movie 2023.mp4'),
    'Jagun Jagun'
  );
  assert.strictEqual(
    sanitizeMovieTitle('A Tribe Called Judah (4K UHD) Full Movie'),
    'A Tribe Called Judah'
  );
});

test('6. determineNollywoodEra aligns era correctly with release years', () => {
  assert.strictEqual(determineNollywoodEra(1995), 'Golden Era (1992-2005)');
  assert.strictEqual(determineNollywoodEra(2005), 'Golden Era (1992-2005)');
  assert.strictEqual(determineNollywoodEra(2010), 'New Nollywood (2006-2018)');
  assert.strictEqual(determineNollywoodEra(2018), 'New Nollywood (2006-2018)');
  assert.strictEqual(determineNollywoodEra(2023), 'Modern Global Era (2019-Present)');
});

test('7. sanitizeAndAlignMovieMetadata aligns titles, directors, eras, and visual assets', () => {
  const rawMovie = {
    title: 'Anikulapo [Full Movie] .mp4',
    releaseYear: 2022,
    director: 'Directed by: Kunle Afolayan',
    posterUrl: 'https://image.tmdb.org/t/p/w780/anikulapo.jpg',
    originCountry: ['NG']
  };

  const aligned = sanitizeAndAlignMovieMetadata(rawMovie);

  assert.strictEqual(aligned.title, 'Anikulapo');
  assert.strictEqual(aligned.director, 'Kunle Afolayan');
  assert.strictEqual(aligned.era, 'Modern Global Era (2019-Present)');
  assert.strictEqual(aligned.posterUrl, 'https://image.tmdb.org/t/p/w780/anikulapo.jpg');
  assert.ok(Array.isArray(aligned.genres) && aligned.genres.length > 0);
  assert.ok(Array.isArray(aligned.languages) && aligned.languages.length > 0);
  assert.ok(Array.isArray(aligned.collections));
});

test('8. alignExistingCatalog updates entire catalog collections safely', () => {
  const catalog = [
    {
      id: 'film-1',
      title: 'Blood Sisters [HD]',
      releaseYear: 2003,
      director: 'Tchidi Chikere',
      posterUrl: 'https://image.tmdb.org/t/p/w500/bloodsisters.jpg',
      originCountry: ['NG']
    },
    {
      id: 'film-2',
      title: 'Baby Steps (Foreign)',
      releaseYear: 2011,
      director: 'Unknown',
      posterUrl: 'https://cdn.hollywood.com/poster.jpg',
      originCountry: ['US']
    }
  ];

  const alignedCatalog = alignExistingCatalog(catalog);
  assert.strictEqual(alignedCatalog.length, 2);
  assert.strictEqual(alignedCatalog[0].title, 'Blood Sisters');
  assert.strictEqual(alignedCatalog[0].era, 'Golden Era (1992-2005)');

  // Film 2 had mismatched foreign artwork, so fallback verified artwork was assigned
  assert.strictEqual(alignedCatalog[1].posterUrl, VERIFIED_NOLLYWOOD_FALLBACK_POSTER);
});
