import type { PersonProfileData } from '../../types.ts';
import {
  TMDB_BASE_URL,
  TMDB_IMAGE_BASE,
  KNOWN_PERSON_HEADSHOTS,
  PERSON_TTL_MS
} from '../../data/tmdbConfig.ts';
import { getCachedItem, setCachedItem } from './cache.ts';
import { getActiveTmdbApiKey, safeTmdbFetch } from './tmdbClient.ts';

export { KNOWN_PERSON_HEADSHOTS };

// In-memory cache for fast repeated person profile views
const personProfileCache = new Map<string, PersonProfileData>();

export function buildTmdbPosterUrl(posterPath?: unknown, existingUrl?: unknown): string {
  if (typeof existingUrl === 'string' && existingUrl.trim().startsWith('http')) {
    return existingUrl.trim();
  }
  if (typeof posterPath === 'string' && posterPath.trim()) {
    return `${TMDB_IMAGE_BASE}/w780${posterPath.trim()}`;
  }
  return '';
}

export function buildTmdbBackdropUrl(
  backdropPath?: unknown,
  existingUrl?: unknown,
  fallbackPosterUrl: string = ''
): string {
  if (typeof existingUrl === 'string' && existingUrl.trim().startsWith('http')) {
    return existingUrl.trim();
  }
  if (typeof backdropPath === 'string' && backdropPath.trim()) {
    return `${TMDB_IMAGE_BASE}/original${backdropPath.trim()}`;
  }
  return fallbackPosterUrl;
}

export function buildTmdbAvatarUrl(
  profilePath?: unknown,
  existingUrl?: unknown,
  size: 'w185' | 'w342' | 'w500' | 'h632' = 'w185'
): string {
  if (typeof existingUrl === 'string' && existingUrl.trim()) {
    return existingUrl.trim();
  }
  if (typeof profilePath === 'string' && profilePath.trim()) {
    return `${TMDB_IMAGE_BASE}/${size}${profilePath.trim()}`;
  }
  return '';
}

export function normalizePersonName(name: string): string {
  return name
    .replace(/\(.*?\)/g, '')
    .replace(/&.*$/, '')
    .replace(/\b(dir|director|starring|featuring)\b/gi, '')
    .trim();
}

export function resolveKnownPersonHeadshot(personName: string): string | undefined {
  const clean = personName.toLowerCase().trim();
  if (KNOWN_PERSON_HEADSHOTS[clean]) {
    return KNOWN_PERSON_HEADSHOTS[clean];
  }
  const normalized = normalizePersonName(personName).toLowerCase();
  return KNOWN_PERSON_HEADSHOTS[normalized];
}

/**
 * Fetches official profile data, biography, and TMDb headshot image for actors & directors
 * with 24-hour tiered localStorage caching and on-demand forceRefresh support.
 */
export async function fetchPersonProfile(
  personName: string,
  tmdbId?: number,
  forceRefresh: boolean = false
): Promise<PersonProfileData> {
  const trimmedName = personName.trim();
  const cacheKey = tmdbId
    ? `person_id_${tmdbId}`
    : `person_name_${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

  if (!forceRefresh) {
    if (personProfileCache.has(cacheKey)) {
      return personProfileCache.get(cacheKey)!;
    }
    const localCached = getCachedItem<PersonProfileData>(cacheKey);
    if (localCached) {
      personProfileCache.set(cacheKey, localCached);
      return localCached;
    }
  }

  const normalized = normalizePersonName(trimmedName);
  let resolvedId = tmdbId;
  let initialResult: any = null;
  const apiKey = getActiveTmdbApiKey();

  try {
    if (apiKey && !resolvedId) {
      const searchUrl = `${TMDB_BASE_URL}/search/person?api_key=${apiKey}&query=${encodeURIComponent(normalized)}`;
      const sRes = await safeTmdbFetch(searchUrl);
      if (sRes && sRes.ok) {
        const sData = await sRes.json();
        const results: any[] = sData.results || [];
        if (results.length > 0) {
          const matchWithPhoto = results.find(r => !!r.profile_path);
          initialResult = matchWithPhoto || results[0];
          resolvedId = initialResult.id;
        }
      }
    }

    if (apiKey && resolvedId) {
      const detailUrl = `${TMDB_BASE_URL}/person/${resolvedId}?api_key=${apiKey}&append_to_response=combined_credits`;
      const pRes = await safeTmdbFetch(detailUrl);
      if (pRes && pRes.ok) {
        const pData = await pRes.json();
        const rawCredits = pData.combined_credits?.cast || [];
        const rawCrew = pData.combined_credits?.crew || [];
        const allKnown = [...rawCredits, ...rawCrew].slice(0, 12).map((k: any) => ({
          id: k.id,
          title: k.title || k.name,
          name: k.name || k.title,
          posterPath: k.poster_path ? `${TMDB_IMAGE_BASE}/w342${k.poster_path}` : undefined,
          releaseDate: k.release_date || k.first_air_date,
          character: k.character || k.job,
          mediaType: k.media_type || 'movie'
        }));

        const avatarUrl =
          buildTmdbAvatarUrl(pData.profile_path, undefined, 'h632') ||
          resolveKnownPersonHeadshot(trimmedName);

        const profile: PersonProfileData = {
          id: resolvedId,
          name: pData.name || trimmedName,
          biography: pData.biography?.trim() ? pData.biography.trim() : undefined,
          birthday: pData.birthday || undefined,
          deathday: pData.deathday || null,
          placeOfBirth: pData.place_of_birth || undefined,
          department:
            pData.known_for_department ||
            (rawCrew.some((c: any) => c.department === 'Directing') ? 'Directing' : 'Acting'),
          avatarUrl: avatarUrl || undefined,
          imdbId: pData.imdb_id || undefined,
          knownFor: allKnown
        };

        personProfileCache.set(cacheKey, profile);
        setCachedItem(cacheKey, profile, PERSON_TTL_MS);
        return profile;
      }
    }
  } catch (err) {
    console.warn(`Failed to fetch person profile for ${trimmedName}:`, err);
  }

  const fallbackAvatar =
    resolveKnownPersonHeadshot(trimmedName) ||
    (initialResult?.profile_path
      ? buildTmdbAvatarUrl(initialResult.profile_path, undefined, 'h632')
      : undefined);

  const fallbackProfile: PersonProfileData = {
    id: resolvedId,
    name: trimmedName,
    avatarUrl: fallbackAvatar || undefined,
    department: 'Acting & Directing'
  };
  personProfileCache.set(cacheKey, fallbackProfile);
  setCachedItem(cacheKey, fallbackProfile, PERSON_TTL_MS);
  return fallbackProfile;
}

/**
 * Quick helper to resolve an actor or director's official profile headshot URL from TMDb.
 */
export async function fetchPersonHeadshot(
  personName: string,
  tmdbId?: number,
  forceRefresh: boolean = false
): Promise<string | null> {
  const known = resolveKnownPersonHeadshot(personName);
  if (known) {
    return known;
  }
  try {
    const profile = await fetchPersonProfile(personName, tmdbId, forceRefresh);
    return profile.avatarUrl || null;
  } catch {
    return null;
  }
}
