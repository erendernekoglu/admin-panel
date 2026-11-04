import type { AdminRole, IsoDateString } from "../../types/admin"

export type UserSubscription = "free" | "pro" | "premium"

/**
 * Generic admin user view. Dates are ISO strings and no database-specific
 * timestamp type crosses the service boundary.
 */
export interface AdminUser {
  uid: string
  displayName: string
  email: string
  status?: string
  createdAt: IsoDateString
  lastLoginAt?: IsoDateString
  credits: number
  subscription: UserSubscription
  role?: AdminRole
  wardrobeCount: number
  savedResultsCount: number
  weatherCity?: string
  platform?: string
  appVersion?: string
  isTest: boolean
  weatherOutfitEnabled: boolean
  photoURL?: string
}
