type DateLike = {
  toDate?: () => unknown
  seconds?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

/**
 * Accept the timestamp shapes an API may send: Date, ISO string, epoch
 * milliseconds, `{ seconds }` or an object with a `toDate()` method. The
 * Firebase Timestamp runtime is not required.
 */
export function toDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  if (typeof value === "number") {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }

  if (typeof value === "string") {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }

  if (isRecord(value)) {
    const candidate = value as DateLike
    if (typeof candidate.toDate === "function") {
      try {
        const date = candidate.toDate()
        if (date instanceof Date && !Number.isNaN(date.getTime())) return date
      } catch {
        return null
      }
    }
    if (typeof candidate.seconds === "number" && Number.isFinite(candidate.seconds)) {
      const date = new Date(candidate.seconds * 1000)
      return Number.isNaN(date.getTime()) ? null : date
    }
  }

  return null
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
