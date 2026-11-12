import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  validateAndPrepareDiscoveredBatch,
  ABSTRACT_QUERY_PRESETS
} from '../src/utils/batchDiscovery.ts';

test('1. ABSTRACT_QUERY_PRESETS contains rich Nollywood category queries', () => {
  assert.ok(ABSTRACT_QUERY_PRESETS.length >= 4);
  assert.ok(ABSTRACT_QUERY_PRESETS.some(p => p.includes('box office')));
  assert.ok(ABSTRACT_QUERY_PRESETS.some(p => p.includes('Yoruba') || p.includes('90s')));
});

test('2. validateAndPrepareDiscoveredBatch enforces strict originCountry: ["NG"] and auto era calculation', () => {
  const rawDiscovered = [
    {
      title: 'Jagun Jagun',
      releaseYear: 2023,
      director: 'Adebayo Tijani',
      genres: ['Action', 'Epic'],
      synopsis: 'A young warrior arrives at the training grounds of a fierce warlord.'
    },
    {
      title: 'Living in Bondage',
      releaseYear: 1992,
      director: 'Chris Obi Rapu',
      genres: ['Drama', 'Thriller'],
      synopsis: 'Andy Okeke joins a secret cult to achieve instantaneous wealth.'
    }
  ];

  const batch = validateAndPrepareDiscoveredBatch(rawDiscovered, []);

  assert.strictEqual(batch.length, 2);

  // First item checks
  const item1 = batch[0];
  assert.strictEqual(item1.id, 'jagun-jagun');
  assert.deepStrictEqual(item1.movie.originCountry, ['NG']);
  assert.strictEqual(item1.movie.era, 'Modern Global Era (2019-Present)');
  assert.strictEqual(item1.validation.isValid, true);
  assert.strictEqual(item1.alreadyExists, false);
  assert.strictEqual(item1.selected, true);

  // Second item checks (1992 era)
  const item2 = batch[1];
  assert.strictEqual(item2.id, 'living-in-bondage');
  assert.deepStrictEqual(item2.movie.originCountry, ['NG']);
  assert.strictEqual(item2.movie.era, 'Golden Era (1992-2005)');
  assert.strictEqual(item2.validation.isValid, true);
  assert.strictEqual(item2.alreadyExists, false);
  assert.strictEqual(item2.selected, true);
});

test('3. validateAndPrepareDiscoveredBatch flags already existing movies and deselects them', () => {
  const mockExistingCatalog = [
    {
      id: 'the-wedding-party',
      title: 'The Wedding Party',
      releaseYear: 2016,
      director: 'Kemi Adetiba',
      originCountry: ['NG'],
      genres: ['Romance', 'Comedy'],
      era: 'New Nollywood (2006-2018)'
    }
  ];

  const rawDiscovered = [
    {
      title: 'The Wedding Party',
      releaseYear: 2016,
      director: 'Kemi Adetiba'
    },
    {
      title: 'A Tribe Called Judah',
      releaseYear: 2023,
      director: 'Funke Akindele'
    }
  ];

  const batch = validateAndPrepareDiscoveredBatch(rawDiscovered, mockExistingCatalog);

  assert.strictEqual(batch.length, 2);

  // Duplicate item
  assert.strictEqual(batch[0].alreadyExists, true);
  assert.strictEqual(batch[0].selected, false);

  // New item
  assert.strictEqual(batch[1].alreadyExists, false);
  assert.strictEqual(batch[1].selected, true);
});
