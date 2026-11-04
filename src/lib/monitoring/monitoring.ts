/**
 * Local-only monitoring. The independent panel has no telemetry provider and
 * never sends errors, breadcrumbs or performance data off the device.
 */
function isDevelopment() {
  try {
    return Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV)
  } catch {
    return false
  }
}

/** Kept as a no-op so the app bootstrap stays compatible. */
export async function initMonitoring(): Promise<void> {
  // Intentionally empty: no network, no third-party SDK.
}

/** Optional local console report; disabled outside development. */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (!isDevelopment()) return
  console.error("[admin-panel]", error, context ?? "")
}
