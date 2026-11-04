import { createContext } from "react"

import type { ConsoleRole, Permission } from "../../lib/auth/permissions"
import type { AdminUser, AdminProfile } from "../../types/auth"
import type { AuthSession } from "./authService"

export interface AuthContextValue {
  user: AdminUser | null
  adminProfile: AdminProfile | null
  loading: boolean
  error: string | null
  /** The signed-in member's console role, or null without console access. */
  consoleRole: ConsoleRole | null
  /** Whether the role's bundle includes `permission`. */
  can: (permission: Permission) => boolean
  loginWithEmail: (email: string, password: string) => Promise<AuthSession>
  /** Explicit local demo entry. Only available when demo mode is active. */
  enterDemo: () => void
  logout: () => Promise<void>
  refreshAdminProfile: () => Promise<AdminProfile | null>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
