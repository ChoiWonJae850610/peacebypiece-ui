import "server-only";

export type CachedR2UrlEntry = {
  url: string;
  expiresAtMs: number;
};

const DEFAULT_MIN_REMAINING_MS = 60 * 1000;
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

  cache.set(cacheKey, {
    url: input.url,
    expiresAtMs: nowMs() + effectiveExpiresInSeconds * 1000,
  });

  return input.url;
}

export function getR2UrlCacheSize(): number {
  return cache.size;
}
