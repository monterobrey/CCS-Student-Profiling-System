const cacheStore = new Map();
const inFlightStore = new Map();

/**
 * Get a cached value if still fresh.
 */
export function getCached(key, staleTimeMs = 5 * 60 * 1000) {
  const entry = cacheStore.get(key);
  if (!entry) return null;

  const isStale = Date.now() - entry.timestamp > staleTimeMs;
  if (isStale) return null;

  return entry.data;
}

/**
 * Set a cached value.
 */
export function setCached(key, data) {
  cacheStore.set(key, {
    data,
    timestamp: Date.now(),
  });
  return data;
}

/**
 * Fetch with in-memory cache and in-flight dedupe.
 * - Reuses fresh cache
 * - Reuses pending identical request
 * - Stores resolved data in cache
 */
export async function fetchWithCache(
  key,
  fetcher,
  { staleTimeMs = 5 * 60 * 1000, force = false } = {}
) {
  if (!force) {
    const cached = getCached(key, staleTimeMs);
    if (cached !== null) return cached;
  }

  if (inFlightStore.has(key)) {
    return inFlightStore.get(key);
  }

  const pending = (async () => {
    try {
      const data = await fetcher();
      return setCached(key, data);
    } finally {
      inFlightStore.delete(key);
    }
  })();

  inFlightStore.set(key, pending);
  return pending;
}

/**
 * Optional invalidation helpers.
 */
export function invalidateCache(key) {
  cacheStore.delete(key);
  inFlightStore.delete(key);
}

export function clearApiCache() {
  cacheStore.clear();
  inFlightStore.clear();
}
