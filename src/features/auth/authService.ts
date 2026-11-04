import { adminRequest } from "../../lib/api/client"
import { isConsoleRole } from "../../lib/auth/permissions"
import { isDemoMode } from "../../lib/config"
import type { AdminUser, AdminProfile } from "../../types/auth"

/**
 * Auth contract used by both modes.
 *
 * API operations (same-origin, cookie session):
 *   auth.session  body {}                  -> { user: User | null, consoleRole: Role | null }
 *   auth.login    body { email, password } -> { user: User, consoleRole: Role }
 *   auth.logout   body {}                  -> { ok: true }
 *
 * `User` is { uid, email, displayName, photoURL? }. The server derives the role
 * from the session; the browser never sends a role, a demo identity or a token.
 * Cookies are the only credential. The server must validate Origin/CSRF and
 * enforce the console role on every operation.
 */
export const AUTH_OPERATIONS = {
  session: "auth.session",
  login: "auth.login",
  logout: "auth.logout",
} as const

export interface AuthSession {
  user: AdminUser
  adminProfile: AdminProfile
}

export class AuthContractError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = "AuthContractError"
    this.code = code
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseUser(value: unknown): AdminUser {
  if (!isRecord(value)) {
    throw new AuthContractError("auth/malformed-session", "The auth response did not contain a valid user.")
  }

  const { uid, email, displayName, photoURL } = value
  if (typeof uid !== "string" || !uid.trim()) {
    throw new AuthContractError("auth/malformed-session", "The auth user is missing a valid uid.")
  }
  if (email !== null && email !== undefined && typeof email !== "string") {
    throw new AuthContractError("auth/malformed-session", "The auth user has an invalid email.")
  }
  if (typeof displayName !== "string" || !displayName.trim()) {
    throw new AuthContractError("auth/malformed-session", "The auth user is missing a display name.")
  }
  if (photoURL !== null && photoURL !== undefined && typeof photoURL !== "string") {
    throw new AuthContractError("auth/malformed-session", "The auth user has an invalid photo URL.")
  }

  return {
    uid: uid.trim(),
    email: typeof email === "string" && email.trim() ? email.trim() : null,
    displayName: displayName.trim(),
    photoURL: typeof photoURL === "string" && photoURL.trim() ? photoURL.trim() : null,
  }
}

function parseRole(value: unknown): AdminProfile["consoleRole"] {
  if (value === null || value === undefined) return null
  if (!isConsoleRole(value)) {
    throw new AuthContractError("auth/unknown-role", "The auth response contained an unknown console role.")
  }
  return value
}

/** Validate a session payload. Unknown roles and malformed users fail closed. */
export function parseAuthSession(value: unknown): AuthSession | null {
  if (!isRecord(value) || !("user" in value)) {
    throw new AuthContractError("auth/malformed-session", "The auth response was not a valid session.")
  }

  if (value.user === null) {
    if (value.consoleRole !== null && value.consoleRole !== undefined) {
      throw new AuthContractError("auth/malformed-session", "A signed-out session must not carry a role.")
    }
    return null
  }

  const user = parseUser(value.user)
  const consoleRole = parseRole(value.consoleRole)

  return {
    user,
    adminProfile: { ...user, consoleRole },
  }
}

/** Validate a login payload; a user without a console role is not allowed in. */
function parseLoginSession(value: unknown): AuthSession {
  const session = parseAuthSession(value)
  if (!session || !session.adminProfile.consoleRole) {
    throw new AuthContractError("auth/not-admin", "This account has no admin console access.")
  }
  return session
}

const DEMO_USER: AdminUser = {
  uid: "preview-admin",
  email: null,
  displayName: "Yerel önizleme",
  photoURL: null,
}

/**
 * Local preview session for the explicit empty-panel entry. It is memory-only,
 * carries no business or team record, and is never sent to an API; the role is
 * labelled local preview in the UI.
 */
export function createDemoSession(): AuthSession {
  return {
    user: { ...DEMO_USER },
    adminProfile: { ...DEMO_USER, consoleRole: "admin" },
  }
}

export async function fetchSession(): Promise<AuthSession | null> {
  // Demo is signed out on load and must not touch fetch at all.
  if (isDemoMode) return null

  const raw = await adminRequest<unknown>(
    AUTH_OPERATIONS.session,
    {},
    () => ({ user: null, consoleRole: null }),
  )
  return parseAuthSession(raw)
}

export async function loginWithEmail(email: string, password: string): Promise<AuthSession> {
  const raw = await adminRequest<unknown>(
    AUTH_OPERATIONS.login,
    { email, password },
    () => {
      throw new AuthContractError(
        "auth/demo-credentials",
        "Email and password sign-in is disabled in demo mode. Use the explicit demo entry.",
      )
    },
  )
  return parseLoginSession(raw)
}

export async function logout(): Promise<void> {
  if (isDemoMode) return

  const result = await adminRequest<unknown>(
    AUTH_OPERATIONS.logout,
    {},
    () => ({ ok: true }),
  )

  if (!isRecord(result) || result.ok !== true) {
    throw new AuthContractError(
      "auth/malformed-logout",
      "The logout response was not confirmed by the server.",
    )
  }
}
