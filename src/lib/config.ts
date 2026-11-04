/**
 * Data mode for the independent admin panel.
 *
 * `demo` is the safe default when the variable is absent or empty: every
 * screen renders synthetic, in-memory data and no request leaves the browser.
 * `api` selects the same-origin API adapter. Any other value is a
 * configuration error and stops the app instead of silently falling back to
 * demo, so a typo can never hide a broken live deployment.
 */
export type DataMode = "demo" | "api"

export const DATA_MODES: readonly DataMode[] = ["demo", "api"]

export class DataModeConfigurationError extends Error {
  constructor(value: unknown) {
    super(
      `Invalid VITE_DATA_MODE value: ${JSON.stringify(value)}. Expected "demo" or "api".`,
    )
    this.name = "DataModeConfigurationError"
  }
}

/** Resolve the configured mode; only exact `demo` and `api` are accepted. */
export function resolveDataMode(raw: unknown): DataMode {
  if (raw === undefined || raw === null || raw === "") return "demo"
  if (raw === "demo" || raw === "api") return raw
  throw new DataModeConfigurationError(raw)
}

function readConfiguredMode(): unknown {
  try {
    const env = (import.meta as ImportMeta & { env?: Record<string, unknown> }).env
    return env?.VITE_DATA_MODE
  } catch {
    return undefined
  }
}

export const dataMode: DataMode = resolveDataMode(readConfiguredMode())

/** True when the panel runs on local synthetic data and must not call a server. */
export const isDemoMode: boolean = dataMode === "demo"
