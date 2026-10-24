/**
 * Strict Nigerian / Nollywood Cinema Metadata Validation and Language Parsing Utilities
 * Enforces zero-tolerance against foreign movie leakage across all TMDb discovery, search,
 * import, and Firestore database operations.
 */

export const NIGERIAN_ORIGIN_COUNTRY = 'NG';

// Allowed languages associated with Nigerian cinema
export const NIGERIAN_LANGUAGES = ['yo', 'ig', 'ha', 'pcm', 'en'];

// Indigenous Nigerian languages where Nigerian provenance is assured even if country tag is omitted in older archives
export const NIGERIAN_INDIGENOUS_LANGUAGES = ['yo', 'ig', 'ha', 'pcm'];

// Known foreign / non-Nigerian titles that leaked into previous catalog iterations
export const KNOWN_FOREIGN_TITLES_LOWER = [
  'wallace & gromit',
  'wallace and gromit',
  '29th street',
  'baby steps',
  'winnie the pooh',
  'while you were sleeping',
  'white hunters',
  'white man',
  'white waters',
  'wicked games',
  'wife of bath',
  'wild beasts',
  'wild ocean',
  'will it snow for christmas',
  'william wilson',
  'wilson periera',
  'window shopping',
  'wing man',
  'winter days',
  'with love, christmas',
  'wizards',
  'wolf\'s skin',
  'wolfpack',
  'wormholes',
  'wornout',
  'write before christmas',
  'x2000',
  'yanks',
  'yellow is the new black',
  'yes, virginia',
  'yogi bear',
  'yogi\'s first christmas',
  'you\'ll fall for me',
  'you\'ve got mail',
  'your christmas or mine',
  'your friend the rat',
  'your studio and you',
  'yuppies',
  'zen - grogu and dust bunnies',
  'zeitverläufe',
  'zero hour',
  'zerzura',
  'ziggy\'s gift',
  'zog',
  'zone bleue',
  'zvyky nezvykle',
  'blade runner',
  'nexus dawn',
  'nowhere to run',
  '22 vs. earth',
  '12 dates of christmas',
  '12 days of christmas',
  '12 gifts of christmas',
  'удачная охота',
  '100 papiers',
  'outrageous',
  'captains outrageous',
  'outrageous fortune',
  'outrageous drops',
  'outrageous request'
];

/**
 * Normalizes an origin country array from diverse metadata representations
 * (e.g., TMDb origin_country strings, production_countries objects with iso_3166_1, or comma-separated strings).
 * Aggregates all country sources across origin_country, production_countries, and country fields.
 */
export function extractOriginCountries(movieOrItem: any): string[] {
  if (!movieOrItem || typeof movieOrItem !== 'object') return [];

  const rawSources = [
    movieOrItem.originCountry,
    movieOrItem.origin_country,
    movieOrItem.production_countries,
    movieOrItem.productionCountries,
    movieOrItem.country,
    movieOrItem.countries
  ].filter(Boolean);

  const countries: string[] = [];

  for (const raw of rawSources) {
    if (Array.isArray(raw)) {
      for (const c of raw) {
        if (typeof c === 'string' && c.trim()) {
          countries.push(c.trim().toUpperCase());
        } else if (c && typeof c === 'object') {
          const code = String(c.iso_3166_1 || c.code || c.country_code || '').trim().toUpperCase();
          if (code) countries.push(code);
        }
      }
    } else if (typeof raw === 'string') {
      const parts = raw.split(/[,\s|]+/).map((s: string) => s.trim().toUpperCase()).filter(Boolean);
      countries.push(...parts);
    }
  }

  return Array.from(new Set(countries));
}

/**
 * Strict Nigerian film evaluation helper.
 * Enforces requirement:
 * "Do not accept or save any movie unless its origin_country array includes 'NG'
 * or its original_language matches Nigerian criteria ['yo', 'ig', 'ha', 'pcm', 'en']."
 * AND strictly blocks known foreign titles (e.g. Wallace & Gromit, 29th Street, Baby Steps).
 */
export function isNigerianMovie(movieOrItem: any): boolean {
  if (!movieOrItem || typeof movieOrItem !== 'object') return false;

  const rawTitle = String(movieOrItem.title || movieOrItem.name || '').toLowerCase().trim();
  if (!rawTitle) return false;

  // 1. Title blacklist check (immediately reject known leaked foreign titles)
  if (KNOWN_FOREIGN_TITLES_LOWER.some(foreign => rawTitle.includes(foreign))) {
    return false;
  }

  // 2. Extract origin countries
  const countries = extractOriginCountries(movieOrItem);
  const hasNg = countries.includes(NIGERIAN_ORIGIN_COUNTRY);

  // 3. Extract original language
  const originalLang = String(
    movieOrItem.originalLanguage ||
    movieOrItem.original_language ||
    movieOrItem.language ||
    ''
  ).trim().toLowerCase();

  // If origin countries are present:
  if (countries.length > 0) {
    if (hasNg) {
      return true;
    }
    // Foreign country explicitly specified without 'NG'
    // Exception: strictly indigenous Nigerian languages (Yoruba, Igbo, Hausa, Pidgin)
    if (NIGERIAN_INDIGENOUS_LANGUAGES.includes(originalLang)) {
      return true;
    }
    return false;
  }

  // If origin_country array was omitted/empty in source metadata:
  // Accept if original_language is an indigenous Nigerian language
  if (NIGERIAN_INDIGENOUS_LANGUAGES.includes(originalLang)) {
    return true;
  }

  // If original language is 'en' and no country is specified, check cultural indicators
  if (originalLang === 'en' || originalLang === '') {
    // If it has explicitly foreign production countries, reject
    if (countries.length > 0 && !hasNg) {
      return false;
    }
    // If it has an explicit Nollywood/Nigeria source or tag, allow
    if (
      movieOrItem.source === 'system' ||
      movieOrItem.isStarterMovie === true ||
      (Array.isArray(movieOrItem.collections) && movieOrItem.collections.includes('all-nigerian-titles'))
    ) {
      return true;
    }
    return false;
  }

  return false;
}

/**
 * Accurate Language Parsing:
 * Parses spoken_languages directly from TMDb metadata.
 * Removes hardcoded string injectors (never defaults unmapped movies to "Nigerian Pidgin, Yoruba").
 * If missing, maps original_language or defaults to 'English' per user requirement:
 * ("If missing, leave blank or default to 'English'").
 */
export function parseSpokenLanguages(tmdbData: any): string[] {
  if (!tmdbData || typeof tmdbData !== 'object') return ['English'];

  let langs: string[] = [];

  // 1. Parse spoken_languages directly from TMDb metadata
  const spoken = tmdbData.spoken_languages || tmdbData.spokenLanguages;
  if (Array.isArray(spoken) && spoken.length > 0) {
    langs = spoken
      .map((item: any) => {
        if (!item) return '';
        if (typeof item === 'string') return item.trim();
        const englishName = typeof item.english_name === 'string' && item.english_name.trim();
        if (englishName) return englishName;
        const name = typeof item.name === 'string' && item.name.trim();
        if (name) return name;
        return '';
      })
      .filter((l: string) => l.length > 0);
  }

  // 2. If spoken_languages was missing/empty, derive from original_language code
  if (langs.length === 0) {
    const rawLang = String(
      tmdbData.original_language ||
      tmdbData.originalLanguage ||
      tmdbData.language ||
      ''
    ).trim().toLowerCase();

    const codeToNameMap: Record<string, string> = {
      yo: 'Yoruba',
      ig: 'Igbo',
      ha: 'Hausa',
      pcm: 'Nigerian Pidgin',
      en: 'English'
    };

    if (codeToNameMap[rawLang]) {
      langs.push(codeToNameMap[rawLang]);
    }
  }

  // 3. If already present on movie object as a non-empty array
  if (langs.length === 0 && Array.isArray(tmdbData.languages) && tmdbData.languages.length > 0) {
    langs = tmdbData.languages
      .map((l: any) => String(l || '').trim())
      .filter((l: string) => l.length > 0);
  }

  const unique = Array.from(new Set(langs));
  // Default to ['English'] if unmapped, exactly per user prompt
  return unique.length > 0 ? unique : ['English'];
}
