/** Minimal query-cache surface needed by the auth session lifecycle. */
export interface SessionCache {
  cancelQueries: () => Promise<unknown>
  clear: () => void
}

/**
 * Empty the cache immediately when an identity changes. In-flight reads are
 * cancelled first; clearing removes any results that resolve in the meantime.
 */
export function resetSessionCache(cache: SessionCache): void {
  void Promise.resolve(cache.cancelQueries()).catch(() => undefined)
  cache.clear()
}

/**
 * Apply a fetched session only if its generation is still current. The
 * generation is checked again after cancellation so a slow response from the
 * previous identity cannot populate the next identity's cache.
 */
export async function commitSessionAfterCancel(
  cache: SessionCache,
  generation: number,
  isCurrent: (generation: number) => boolean,
  apply: () => void,
): Promise<boolean> {
  await cache.cancelQueries()
  if (!isCurrent(generation)) return false
  cache.clear()
  apply()
  return true
}
