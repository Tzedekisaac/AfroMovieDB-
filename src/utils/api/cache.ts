import {
  CACHE_PREFIX,
  MOVIE_TTL_MS,
  PERSON_TTL_MS,
  SEARCH_TTL_MS,
  LAST_RELEASE_SYNC_KEY,
  RELEASE_SYNC_INTERVAL_MS
} from '../../data/tmdbConfig.ts';
import type { CacheEnvelope } from './types.ts';

export {
  CACHE_PREFIX,
  MOVIE_TTL_MS,
  PERSON_TTL_MS,
  SEARCH_TTL_MS,
  LAST_RELEASE_SYNC_KEY,
  RELEASE_SYNC_INTERVAL_MS
};

export type { CacheEnvelope };

export function getCachedItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const envelope: CacheEnvelope<T> = JSON.parse(raw);
    const now = Date.now();
    if (now - envelope.timestamp > envelope.ttl) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return envelope.data;
  } catch {
    return null;
  }
}

export function setCachedItem<T>(key: string, data: T, ttlMs: number): void {
  try {
    const envelope: CacheEnvelope<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
      version: 1
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(envelope));
  } catch {
    try {
      pruneExpiredCache();
      const envelope: CacheEnvelope<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMs,
        version: 1
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(envelope));
    } catch {
      // Ignore if localStorage unavailable or persistently exceeded
    }
  }
}

export function removeCachedItem(key: string): void {
  try {
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch {
    // Ignore when localStorage is unavailable
  }
}

export function pruneExpiredCache(): void {
  try {
    const now = Date.now();
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) {
        try {
          const val = localStorage.getItem(k);
          if (val) {
            const envelope = JSON.parse(val);
            if (envelope.timestamp && envelope.ttl && now - envelope.timestamp > envelope.ttl) {
              localStorage.removeItem(k);
            }
          }
        } catch {
          // Ignore malformed cache entries
        }
      }
    }
  } catch {
    // Ignore when localStorage is unavailable
  }
}
