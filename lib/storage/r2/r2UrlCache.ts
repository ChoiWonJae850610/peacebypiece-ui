import "server-only";

export type R2UrlCachePurpose = "file" | "thumbnail" | "download" | "delete" | (string & {});

export type CachedR2UrlEntry = {
  url: string;
  expiresAtMs: number;
  createdAtMs: number;
};

export type R2UrlCacheState = "HIT" | "MISS";

export type R2CachedUrlResult = {
  url: string;
  cacheState: R2UrlCacheState;
  expiresInSeconds: number;
};

const DEFAULT_MIN_REMAINING_MS = 60 * 1000;
const DEFAULT_SAFETY_MARGIN_SECONDS = 30;
const MAX_CACHE_ENTRIES = 300;
const cache = new Map<string, CachedR2UrlEntry>();

function nowMs(): number {
  return Date.now();
}

function createCacheKey(input: { purpose: R2UrlCachePurpose; key: string }): string {
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

export function getCachedR2Url(input: { purpose: R2UrlCachePurpose; key: string; minRemainingMs?: number }): string | null {
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

export function setCachedR2Url(input: { purpose: R2UrlCachePurpose; key: string; url: string; expiresInSeconds: number; safetyMarginSeconds?: number }): string {
  const safetyMarginSeconds = input.safetyMarginSeconds ?? DEFAULT_SAFETY_MARGIN_SECONDS;
  const effectiveExpiresInSeconds = Math.max(input.expiresInSeconds - safetyMarginSeconds, 1);
  const cacheKey = createCacheKey(input);
  const createdAtMs = nowMs();

  pruneExpiredEntries(createdAtMs);

  cache.set(cacheKey, {
    url: input.url,
    createdAtMs,
    expiresAtMs: createdAtMs + effectiveExpiresInSeconds * 1000,
  });
  pruneOverflowEntries();

  return input.url;
}

export function getOrSetCachedR2Url(input: {
  purpose: R2UrlCachePurpose;
  key: string;
  minRemainingMs?: number;
  createUrl: () => { url: string; expiresInSeconds: number };
}): R2CachedUrlResult {
  const cachedUrl = getCachedR2Url({ purpose: input.purpose, key: input.key, minRemainingMs: input.minRemainingMs });
  if (cachedUrl) {
    return {
      url: cachedUrl,
      cacheState: "HIT",
      expiresInSeconds: Math.max(Math.floor(((cache.get(createCacheKey(input))?.expiresAtMs ?? nowMs()) - nowMs()) / 1000), 0),
    };
  }

  const created = input.createUrl();
  const url = setCachedR2Url({
    purpose: input.purpose,
    key: input.key,
    url: created.url,
    expiresInSeconds: created.expiresInSeconds,
  });

  return {
    url,
    cacheState: "MISS",
    expiresInSeconds: created.expiresInSeconds,
  };
}

export function deleteCachedR2Url(input: { purpose: R2UrlCachePurpose; key: string }): void {
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
