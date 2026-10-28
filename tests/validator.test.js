import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ValidationStatus,
  validateNigerianMovie,
  isNigerianMovie,
  isDiscoveryCandidateEligible,
  extractOriginCountries,
  parseSpokenLanguages
} from '../src/utils/nigerianMovieValidator.ts';

test('1. English-language movie with verified Nigerian production-country is accepted', () => {
  const movie = {
    id: 'the-black-book',
    title: 'The Black Book',
    original_language: 'en',
    origin_country: ['NG'],
    production_countries: [{ iso_3166_1: 'NG', name: 'Nigeria' }]
  };
  const result = validateNigerianMovie(movie, { isDetailEnriched: true });
  assert.strictEqual(result.status, ValidationStatus.VERIFIED_NIGERIAN);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(isNigerianMovie(movie), true);
});

test('2. Yoruba-language movie with verified Nigerian production-country is accepted', () => {
  const movie = {
    id: 'aníkúlápó',
    title: 'Aníkúlápó',
    original_language: 'yo',
    production_countries: [{ iso_3166_1: 'NG', name: 'Nigeria' }]
  };
  const result = validateNigerianMovie(movie, { isDetailEnriched: true });
  assert.strictEqual(result.status, ValidationStatus.VERIFIED_NIGERIAN);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(isNigerianMovie(movie), true);
});

test('3. Foreign movie is rejected even if it uses English', () => {
  const foreignEnglishMovie = {
    id: 'hollywood-action',
    title: 'Speed Racer 2024',
    original_language: 'en',
    origin_country: ['US'],
    production_countries: [{ iso_3166_1: 'US', name: 'United States of America' }]
  };
  const result = validateNigerianMovie(foreignEnglishMovie, { isDetailEnriched: true });
  assert.strictEqual(result.status, ValidationStatus.REJECTED_NON_NIGERIAN);
  assert.strictEqual(result.isValid, false);
  assert.strictEqual(isNigerianMovie(foreignEnglishMovie), false);
});

test('4. Foreign movie is not accepted merely because its language matches a Nigerian language', () => {
  // E.g., a US documentary or foreign drama that features Yoruba or Igbo dialog with foreign production companies
  const foreignLanguageMovie = {
    id: 'foreign-yoruba-doc',
    title: 'African Diaspora in Brazil',
    original_language: 'yo',
    origin_country: ['BR'],
    production_countries: [{ iso_3166_1: 'BR', name: 'Brazil' }, { iso_3166_1: 'US', name: 'United States' }]
  };
  const result = validateNigerianMovie(foreignLanguageMovie, { isDetailEnriched: true });
  assert.strictEqual(result.status, ValidationStatus.REJECTED_NON_NIGERIAN);
  assert.strictEqual(result.isValid, false);
  assert.strictEqual(isNigerianMovie(foreignLanguageMovie), false);
});

test('5. Movie with incomplete discovery metadata is marked INSUFFICIENT_METADATA and is eligible for enrichment', () => {
  const discoveryCandidate = {
    id: 123456,
    title: 'A Tribe Called Judah',
    original_language: 'en',
    // No origin_country or production_countries provided in raw discovery summary
  };
  // At discovery stage (isDetailEnriched: false)
  const result = validateNigerianMovie(discoveryCandidate, { isDetailEnriched: false });
  assert.strictEqual(result.status, ValidationStatus.INSUFFICIENT_METADATA);
  assert.strictEqual(result.isValid, false);
  // It is eligible for discovery enrichment, so it is not rejected upfront
  assert.strictEqual(isDiscoveryCandidateEligible(discoveryCandidate), true);
});

test('6. Movie whose full metadata confirms foreign production is rejected', () => {
  const enrichedForeignMovie = {
    id: 999999,
    title: 'London After Midnight',
    original_language: 'en',
    production_countries: [{ iso_3166_1: 'GB', name: 'United Kingdom' }]
  };
  const result = validateNigerianMovie(enrichedForeignMovie, { isDetailEnriched: true });
  assert.strictEqual(result.status, ValidationStatus.REJECTED_NON_NIGERIAN);
  assert.strictEqual(result.isValid, false);
  assert.strictEqual(isNigerianMovie(enrichedForeignMovie), false);
});

test('7. Manually curated catalogue entries continue to follow intended validation rules', () => {
  const curatedEntry = {
    id: 'living-in-bondage-1992',
    title: 'Living in Bondage (1992)',
    source: 'system',
    isStarterMovie: true
  };
  const result = validateNigerianMovie(curatedEntry, { isDetailEnriched: true });
  assert.strictEqual(result.status, ValidationStatus.VERIFIED_NIGERIAN);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(isNigerianMovie(curatedEntry), true);
});

test('8. Blacklisted foreign titles are rejected immediately', () => {
  const blacklisted1 = { title: 'Wallace & Gromit: The Curse of the Were-Rabbit', origin_country: ['NG'] };
  const blacklisted2 = { title: '29th Street', origin_country: ['NG'] };
  const blacklisted3 = { title: 'Baby Steps', origin_country: ['NG'] };

  assert.strictEqual(validateNigerianMovie(blacklisted1).status, ValidationStatus.REJECTED_NON_NIGERIAN);
  assert.strictEqual(validateNigerianMovie(blacklisted2).status, ValidationStatus.REJECTED_NON_NIGERIAN);
  assert.strictEqual(validateNigerianMovie(blacklisted3).status, ValidationStatus.REJECTED_NON_NIGERIAN);
  assert.strictEqual(isDiscoveryCandidateEligible(blacklisted1), false);
});

test('9. extractOriginCountries normalizes various country formats correctly', () => {
  const item1 = { origin_country: ['NG', 'US'] };
  assert.deepStrictEqual(extractOriginCountries(item1).sort(), ['NG', 'US']);

  const item2 = { production_countries: [{ iso_3166_1: 'ng', name: 'Nigeria' }] };
  assert.deepStrictEqual(extractOriginCountries(item2), ['NG']);

  const item3 = { production_companies: [{ name: 'EbonyLife Films', origin_country: 'NG' }] };
  assert.deepStrictEqual(extractOriginCountries(item3), ['NG']);
});

test('10. parseSpokenLanguages parses languages with fallback to English', () => {
  assert.deepStrictEqual(parseSpokenLanguages({ spoken_languages: [{ english_name: 'Yoruba' }] }), ['Yoruba']);
  assert.deepStrictEqual(parseSpokenLanguages({ original_language: 'ig' }), ['Igbo']);
  assert.deepStrictEqual(parseSpokenLanguages({}), ['English']);
});
