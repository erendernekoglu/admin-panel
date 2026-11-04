/**
 * Provider-neutral date and value helpers.
 *
 * Admin services expose ISO date strings, never database timestamp objects.
 * These helpers still accept legacy shapes so existing screens keep rendering
 * while the adapter is replaced.
 */

export function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    const converted = (value as { toDate: () => Date }).toDate()
    return converted instanceof Date && !Number.isNaN(converted.getTime())
      ? converted
      : null
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    typeof (value as { seconds?: unknown }).seconds === "number"
  ) {
    return new Date((value as { seconds: number }).seconds * 1000)
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }

  return null
}

export function toIsoString(value: unknown): string | null {
  return toDate(value)?.toISOString() ?? null
}

export function toDateString(value: unknown) {
  const date = toDate(value)
  return date ? date.toLocaleDateString("tr-TR") : "—"
}

export function toDateTimeString(value: unknown) {
  const date = toDate(value)
  return date ? date.toLocaleString("tr-TR") : "—"
}

export function safeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

export function safeString(value: unknown, fallback = "—") {
  return typeof value === "string" && value.trim() ? value : fallback
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

/** Deep-copy plain synthetic demo data before handing it to a caller. */
export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function isoNow() {
  return new Date().toISOString()
}
