import "server-only";

export type CachedR2UrlEntry = {
  url: string;
  expiresAtMs: number;
};

const DEFAULT_MIN_REMAINING_MS = 60 * 1000;
const MAX_CACHE_ENTRIES = 200;
const cache = new Map<string, CachedR2UrlEntry>();

function nowMs(): number {
  return Date.now();
}

function createCacheKey(input: { purpose: string; key: string }): string {
  return `${input.purpose}:${input.key}`;
}

function isUsableCacheEntry(entry: CachedR2UrlEntry | undefined, minRemainingMs: number): entry is CachedR2UrlEntry {
  return Boolean(entry && entry.expiresAtMs - nowMs() > minRemainingMs);
}

function pruneExpiredEntries(currentMs = nowMs()): void {
  for (const [cacheKey, entry] of cache.entries()) {
    if (entry.expiresAtMs <= currentMs) {
      cache.delete(cacheKey);
    }
  }
}

function pruneOverflowEntries(): void {
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (!oldestKey) return;
    cache.delete(oldestKey);
  }
}

export function getCachedR2Url(input: { purpose: string; key: string; minRemainingMs?: number }): string | null {
  const cacheKey = createCacheKey(input);
  const minRemainingMs = input.minRemainingMs ?? DEFAULT_MIN_REMAINING_MS;
  const cached = cache.get(cacheKey);

  if (isUsableCacheEntry(cached, minRemainingMs)) {
    return cached.url;
  }

  if (cached) {
    cache.delete(cacheKey);
  }

  return null;
}

export function setCachedR2Url(input: { purpose: string; key: string; url: string; expiresInSeconds: number; safetyMarginSeconds?: number }): string {
  const safetyMarginSeconds = input.safetyMarginSeconds ?? 30;
  const effectiveExpiresInSeconds = Math.max(input.expiresInSeconds - safetyMarginSeconds, 1);
  const cacheKey = createCacheKey(input);

  pruneExpiredEntries();

  cache.set(cacheKey, {
    url: input.url,
    expiresAtMs: nowMs() + effectiveExpiresInSeconds * 1000,
  });
  pruneOverflowEntries();

  return input.url;
}

export function deleteCachedR2Url(input: { purpose: string; key: string }): void {
  cache.delete(createCacheKey(input));
}

export function deleteCachedR2UrlsByKey(key: string): void {
  for (const cacheKey of cache.keys()) {
    if (cacheKey.endsWith(`:${key}`)) {
      cache.delete(cacheKey);
    }
  }
}

export function getR2UrlCacheSize(): number {
  pruneExpiredEntries();
  return cache.size;
}
