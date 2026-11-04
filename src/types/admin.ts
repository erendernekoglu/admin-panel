export type AppEnvironment = "production" | "staging"

export type AdminRole =
  | "user"
  | "author"
  | "trusted_author"
  | "editor"
  | "admin"

/** ISO-8601 date-time string exchanged at the admin adapter boundary. */
export type IsoDateString = string

/** Opaque cursor returned by a paginated admin operation. */
export type AdminCursor = string

export interface CursorPage<T> {
  items: T[]
  nextCursor: AdminCursor | null
}

export interface AdminFunctionResult {
  success?: boolean
  message?: string
}
