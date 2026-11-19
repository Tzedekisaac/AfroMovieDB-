import { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE } from '../../data/tmdbConfig.ts';

export { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE };

// In-memory reference for the logged-in user's custom TMDb API key
let userCustomTmdbApiKey: string | null = null;

export function setCustomTmdbKey(key: string | null): void {
  userCustomTmdbApiKey = key && key.trim().length > 0 ? key.trim() : null;
}

export function getCustomTmdbKey(): string | null {
  return userCustomTmdbApiKey;
}

export function getActiveTmdbApiKey(): string {
  return userCustomTmdbApiKey || TMDB_API_KEY;
}

export async function testTmdbApiKey(apiKey: string): Promise<{ valid: boolean; message: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { valid: false, message: 'Please enter a valid TMDb API key.' };
  }
  try {
    const url = `${TMDB_BASE_URL}/configuration?api_key=${apiKey.trim()}`;
    const res = await fetch(url);
    if (res.ok) {
      return { valid: true, message: 'TMDb API key is valid and connected!' };
    }
    if (res.status === 401) {
      return { valid: false, message: 'Invalid API key: TMDb returned 401 Unauthorized.' };
    }
    return { valid: false, message: `TMDb responded with status ${res.status}.` };
  } catch {
    return { valid: false, message: 'Network error communicating with TMDb.' };
  }
}

export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError');
  }
}

/**
 * Safe fetch helper with backoff for TMDb rate limits (HTTP 429) and network blips.
 */
export async function safeTmdbFetch(
  url: string,
  retries: number = 2,
  signal?: AbortSignal
): Promise<Response | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    throwIfAborted(signal);
    try {
      const res = await fetch(url, { signal });
      if (res.status === 401 || res.status === 403) {
        console.warn(`[TMDb] Authentication error (${res.status}): Please check API key.`);
        return res;
      }
      if (res.status === 429) {
        const backoff = Math.min(3000, 400 * Math.pow(2, attempt));
        await sleep(backoff);
        continue;
      }
      if (res.status >= 500 && attempt < retries) {
        await sleep(600 * (attempt + 1));
        continue;
      }
      return res;
    } catch (error) {
      if (signal?.aborted) throw error;
      if (attempt === retries) return null;
      await sleep(250 * (attempt + 1));
    }
  }
  throwIfAborted(signal);
  return null;
}
