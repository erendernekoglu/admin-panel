import type { ConsoleRole } from "../lib/auth/permissions"

/** Plain authenticated user returned by the same-origin admin API. */
export interface AdminUser {
  uid: string
  email: string | null
  displayName: string
  photoURL?: string | null
}

/**
 * Console profile returned by the same-origin admin API. The console role is
 * validated from the server session, not from Firebase or the browser.
 */
export interface AdminProfile extends AdminUser {
  /** Console role from the validated server session; null means no console access. */
  consoleRole: ConsoleRole | null
}
