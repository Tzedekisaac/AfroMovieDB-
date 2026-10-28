/**
 * Strict Nigerian / Nollywood Cinema Metadata Validation and Cinema Utilities
 * Shared between frontend web app and background synchronisation script.
 * 
 * Enforces authoritative validation:
 * - VERIFIED_NIGERIAN: Authoritative Nigerian country tag ('NG') or curated Nollywood entry.
 * - REJECTED_NON_NIGERIAN: Blacklisted title or explicit foreign production countries without 'NG'.
 * - INSUFFICIENT_METADATA: Candidate lacking country tags; needs full enrichment before final decision.
 */

export const NIGERIAN_ORIGIN_COUNTRY = 'NG';

// Allowed languages associated with Nigerian cinema
export const NIGERIAN_LANGUAGES = ['yo', 'ig', 'ha', 'pcm', 'en'];

// Indigenous Nigerian languages where Nigerian cultural provenance is significant
export const NIGERIAN_INDIGENOUS_LANGUAGES = ['yo', 'ig', 'ha', 'pcm'];

export const ValidationStatus = {
  VERIFIED_NIGERIAN: 'VERIFIED_NIGERIAN',
  REJECTED_NON_NIGERIAN: 'REJECTED_NON_NIGERIAN',
  INSUFFICIENT_METADATA: 'INSUFFICIENT_METADATA'
} as const;

export type ValidationStatus = typeof ValidationStatus[keyof typeof ValidationStatus];

export interface ValidationResult {
  status: ValidationStatus;
  isValid: boolean;
  reason: string;
  countries: string[];
  originalLanguage: string;
}

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

export const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime & Thriller',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'Historical Drama',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romantic Comedy',
  878: 'Sci-Fi',
  53: 'Crime & Thriller',
  10752: 'War',
  37: 'Western'
};

export const FALLBACK_POSTER = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800&auto=format&fit=crop';
export const FALLBACK_BACKDROP = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1600&auto=format&fit=crop';

export function normalizeTitle(t: unknown): string {
  return String(t || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function determineEra(year: unknown): 'Modern Global Era (2019-Present)' | 'New Nollywood (2006-2018)' | 'Golden Era (1992-2005)' {
  const y = Number(year) || new Date().getFullYear();
  if (y >= 2019) return 'Modern Global Era (2019-Present)';
  if (y >= 2006) return 'New Nollywood (2006-2018)';
  return 'Golden Era (1992-2005)';
}

/**
 * Normalizes an origin country array from diverse metadata representations
 * (e.g., TMDb origin_country strings, production_countries objects with iso_3166_1,
 * or production_companies with origin_country).
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

  const countries = new Set<string>();

  for (const raw of rawSources) {
    if (Array.isArray(raw)) {
      for (const c of raw) {
        if (typeof c === 'string' && c.trim()) {
          const code = c.trim().toUpperCase();
          if (code === 'NIGERIA') countries.add('NG');
          else countries.add(code);
        } else if (c && typeof c === 'object') {
          const code = String(c.iso_3166_1 || c.code || c.country_code || '').trim().toUpperCase();
          const name = String(c.name || '').trim().toUpperCase();
          if (code) countries.add(code);
          else if (name === 'NIGERIA') countries.add('NG');
        }
      }
    } else if (typeof raw === 'string') {
      const parts = raw.split(/[,\s|]+/).map((s: string) => s.trim().toUpperCase()).filter(Boolean);
      for (const p of parts) {
        if (p === 'NIGERIA') countries.add('NG');
        else countries.add(p);
      }
    }
  }

  // Also inspect production_companies if available on detailed objects
  if (Array.isArray(movieOrItem.production_companies)) {
    for (const company of movieOrItem.production_companies) {
      if (company && typeof company === 'object') {
        const compCountry = String(company.origin_country || '').trim().toUpperCase();
        if (compCountry) countries.add(compCountry);
      }
    }
  }

  return Array.from(countries);
}

/**
 * Validates a movie against authoritative Nigerian metadata criteria.
 * Returns a detailed ValidationResult with explicit status:
 * - VERIFIED_NIGERIAN
 * - REJECTED_NON_NIGERIAN
 * - INSUFFICIENT_METADATA
 */
export function validateNigerianMovie(
  movieOrItem: any,
  options?: { isDetailEnriched?: boolean }
): ValidationResult {
  if (!movieOrItem || typeof movieOrItem !== 'object') {
    return {
      status: ValidationStatus.REJECTED_NON_NIGERIAN,
      isValid: false,
      reason: 'Invalid or missing movie payload',
      countries: [],
      originalLanguage: ''
    };
  }

  const rawTitle = String(movieOrItem.title || movieOrItem.name || movieOrItem.original_title || '').toLowerCase().trim();
  if (!rawTitle) {
    return {
      status: ValidationStatus.REJECTED_NON_NIGERIAN,
      isValid: false,
      reason: 'Movie title is missing or empty',
      countries: [],
      originalLanguage: ''
    };
  }

  // 1. Blacklist check: immediate rejection of known leaked foreign titles
  for (const foreign of KNOWN_FOREIGN_TITLES_LOWER) {
    if (rawTitle === foreign || rawTitle.startsWith(foreign + ' ') || rawTitle.includes(foreign)) {
      return {
        status: ValidationStatus.REJECTED_NON_NIGERIAN,
        isValid: false,
        reason: `Matches known non-Nigerian title blacklist: "${foreign}"`,
        countries: extractOriginCountries(movieOrItem),
        originalLanguage: String(movieOrItem.original_language || movieOrItem.originalLanguage || '')
      };
    }
  }

  const countries = extractOriginCountries(movieOrItem);
  const hasNg = countries.includes(NIGERIAN_ORIGIN_COUNTRY);
  const originalLang = String(
    movieOrItem.originalLanguage ||
    movieOrItem.original_language ||
    movieOrItem.language ||
    ''
  ).trim().toLowerCase();

  // 2. Authoritative Nigerian country tag present ('NG')
  if (hasNg) {
    return {
      status: ValidationStatus.VERIFIED_NIGERIAN,
      isValid: true,
      reason: 'Authoritative Nigerian production country or origin country (NG) confirmed',
      countries,
      originalLanguage: originalLang
    };
  }

  // 3. Explicit foreign countries present without 'NG'
  // Rule: Do not accept a movie merely because it uses a Nigerian language if production metadata is foreign
  if (countries.length > 0 && !hasNg) {
    return {
      status: ValidationStatus.REJECTED_NON_NIGERIAN,
      isValid: false,
      reason: `Explicit non-Nigerian production countries (${countries.join(', ')}) without Nigerian origin`,
      countries,
      originalLanguage: originalLang
    };
  }

  // 4. No country metadata found (countries.length === 0)
  // Check if this is a manually curated or system catalogue entry
  const isCuratedEntry =
    movieOrItem.source === 'system' ||
    movieOrItem.isStarterMovie === true ||
    movieOrItem.isCurated === true ||
    (Array.isArray(movieOrItem.collections) &&
      movieOrItem.collections.some((c: unknown) =>
        typeof c === 'string' && c.trim().toLowerCase() === 'all nigerian titles'
      ));

  if (isCuratedEntry) {
    return {
      status: ValidationStatus.VERIFIED_NIGERIAN,
      isValid: true,
      reason: 'Manually curated Nollywood catalogue entry',
      countries: ['NG'],
      originalLanguage: originalLang || 'en'
    };
  }

  // If candidate has not been enriched yet, report INSUFFICIENT_METADATA rather than rejecting prematurely
  if (!options?.isDetailEnriched) {
    return {
      status: ValidationStatus.INSUFFICIENT_METADATA,
      isValid: false,
      reason: 'Missing production country metadata in discovery response; requires detail enrichment',
      countries,
      originalLanguage: originalLang
    };
  }

  // If already enriched with full details from TMDb, but country metadata is still absent:
  // Accept only if original language is an indigenous Nigerian language with no foreign flags
  if (NIGERIAN_INDIGENOUS_LANGUAGES.includes(originalLang)) {
    return {
      status: ValidationStatus.VERIFIED_NIGERIAN,
      isValid: true,
      reason: `Indigenous Nigerian language (${originalLang}) with verified local origin`,
      countries: ['NG'],
      originalLanguage: originalLang
    };
  }

  // Otherwise, unverifiable movie without country metadata is rejected to prevent foreign leakage
  return {
    status: ValidationStatus.REJECTED_NON_NIGERIAN,
    isValid: false,
    reason: 'Lacks verifiable Nigerian origin or production country metadata after detail enrichment',
    countries,
    originalLanguage: originalLang
  };
}

/**
 * Standard boolean helper for publish/display operations.
 * Evaluates whether a movie is confirmed Nigerian.
 */
export function isNigerianMovie(movieOrItem: any): boolean {
  const result = validateNigerianMovie(movieOrItem, { isDetailEnriched: true });
  return result.isValid;
}

/**
 * Checks if a TMDb discovery candidate is eligible for full metadata enrichment.
 * Returns true if already verified or if more metadata is required to decide.
 * Returns false only if confirmed foreign / blacklisted.
 */
export function isDiscoveryCandidateEligible(candidate: any): boolean {
  const result = validateNigerianMovie(candidate, { isDetailEnriched: false });
  return result.status === ValidationStatus.VERIFIED_NIGERIAN || result.status === ValidationStatus.INSUFFICIENT_METADATA;
}

/**
 * Accurate Language Parsing:
 * Parses spoken_languages directly from TMDb metadata.
 * If missing, maps original_language or defaults to 'English'.
 */
export function parseSpokenLanguages(tmdbData: any): string[] {
  if (!tmdbData || typeof tmdbData !== 'object') return ['English'];

  let langs: string[] = [];

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

  if (langs.length === 0 && Array.isArray(tmdbData.languages) && tmdbData.languages.length > 0) {
    langs = tmdbData.languages
      .map((l: any) => String(l || '').trim())
      .filter((l: string) => l.length > 0);
  }

  const unique = Array.from(new Set(langs));
  return unique.length > 0 ? unique : ['English'];
}
