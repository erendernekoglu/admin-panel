import { isDemoMode } from "../config"

/**
 * Shared operation contract for the independent admin panel.
 *
 * Every live call is `POST /api/admin/operations/<encoded operation>` on the
 * same origin, with `credentials: "same-origin"`, a JSON request body and a
 * plain JSON response body. The server must return the operation result
 * directly (no `{ data: ... }` envelope) and must enforce the admin role from
 * the session cookie itself; the browser never sends demo identity to the API.
 *
 * Failures are never retried against the demo callback: if the API is
 * unreachable, times out, redirects, returns a non-2xx status or sends a body
 * that is empty / not JSON, the call rejects.
 */
export const OPERATIONS_PATH = "/api/admin/operations/"

/** Operations may only contain identifier characters; traversal is rejected. */
export const OPERATION_PATTERN = /^[A-Za-z][A-Za-z0-9._-]*$/

/** Default request timeout. Weather sync can pass its own longer value. */
export const DEFAULT_TIMEOUT_MS = 60_000

export interface AdminRequestErrorDetails {
  code?: string
  field?: string
}

export class AdminRequestError extends Error {
  readonly status: number
  readonly operation: string
  /** Machine-readable server code, when the response supplied a safe string. */
  readonly code?: string
  /** Server field name for validation/conflict handling, when safe. */
  readonly field?: string

  constructor(
    operation: string,
    status: number,
    message: string,
    details: AdminRequestErrorDetails = {},
  ) {
    super(message)
    this.name = "AdminRequestError"
    this.operation = operation
    this.status = status
    this.code = details.code
    this.field = details.field
  }
}

function assertOperation(operation: string): string {
  if (typeof operation !== "string" || !OPERATION_PATTERN.test(operation)) {
    throw new AdminRequestError(
      typeof operation === "string" ? operation : "",
      0,
      "Invalid admin operation identifier.",
    )
  }
  return operation
}

function timeoutSignal(timeoutMs: number): AbortSignal {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(timeoutMs)
  }
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeoutMs)
  return controller.signal
}

interface ErrorDetails extends AdminRequestErrorDetails {
  message?: string
}

/** Accept only short, printable strings from a server error body. */
function safeText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const text = value.trim()
  if (!text || text.length > 200) return undefined
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index)
    if (code < 32 || code === 127) return undefined
  }
  return text
}

function detailsFrom(record: Record<string, unknown>): ErrorDetails {
  const nested =
    record.error && typeof record.error === "object" && !Array.isArray(record.error)
      ? (record.error as Record<string, unknown>)
      : null
  const source = nested ?? record

  return {
    message: safeText(nested ? nested.message : record.error) ?? safeText(record.message),
    code: safeText(source.code) ?? safeText(record.code),
    field: safeText(source.field) ?? safeText(record.field),
  }
}

async function readErrorDetails(response: Response): Promise<ErrorDetails> {
  try {
    const text = await response.text()
    if (!text) return {}
    const body: unknown = JSON.parse(text)
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return detailsFrom(body as Record<string, unknown>)
    }
  } catch {
    // A non-JSON error body is not exposed; the status message is used instead.
  }
  return {}
}

/**
 * Run one admin operation.
 *
 * In demo mode the callback runs directly and `fetch` is never touched.
 * In API mode the operation is validated, sent to the same-origin endpoint and
 * the plain JSON result is returned as `T`. The demo callback is only a demo
 * implementation; it is never a fallback for a live failure.
 */
export async function adminRequest<T>(
  operation: string,
  payload: unknown,
  demo: () => T | Promise<T>,
  options: { timeoutMs?: number } = {},
): Promise<T> {
  const safeOperation = assertOperation(operation)

  if (isDemoMode) {
    return demo()
  }

  let body: string
  try {
    body = JSON.stringify(payload ?? null)
  } catch {
    throw new AdminRequestError(safeOperation, 0, "Request payload could not be serialized.")
  }

  let response: Response
  try {
    response = await fetch(`${OPERATIONS_PATH}${encodeURIComponent(safeOperation)}`, {
      method: "POST",
      credentials: "same-origin",
      redirect: "error",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body,
      signal: timeoutSignal(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    })
  } catch {
    throw new AdminRequestError(
      safeOperation,
      0,
      "The admin service could not be reached, timed out or redirected.",
    )
  }

  if (!response.ok) {
    const details = await readErrorDetails(response)
    throw new AdminRequestError(
      safeOperation,
      response.status,
      details.message ?? `Admin operation failed with status ${response.status}.`,
      { code: details.code, field: details.field },
    )
  }

  let text: string
  try {
    text = await response.text()
  } catch {
    throw new AdminRequestError(safeOperation, response.status, "The admin response could not be read.")
  }

  if (!text.trim()) {
    throw new AdminRequestError(safeOperation, response.status, "The admin response was empty.")
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new AdminRequestError(safeOperation, response.status, "The admin response was not valid JSON.")
  }
}
