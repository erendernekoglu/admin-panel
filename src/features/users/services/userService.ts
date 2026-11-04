import { adminRequest } from "../../../lib/api/client"
import type { AdminRole, AdminCursor } from "../../../types/admin"
import {
  demoCountUsers,
  demoCountUsersWhere,
  demoDeleteUser,
  demoFetchUser,
  demoPlanCounts,
  demoSearchUsers,
  demoSumUserField,
  demoUserPage,
  demoUsersByIds,
  demoUsersCreatedBetween,
} from "../../demo/store"
import { isRecord, safeNumber, safeString, toIsoString } from "../../shared/format"
import type { AdminUser, UserSubscription } from "../types"

export type UserListFilter = "all" | "free" | "pro" | "premium" | "test" | "admin"
export type UserPlatformFilter = "all" | "ios" | "android"

export interface UserListFilters {
  userFilter: UserListFilter
  platformFilter: UserPlatformFilter
}

export interface UserPage {
  users: AdminUser[]
  /** Opaque cursor for the next page; null on the last page. */
  nextCursor: AdminCursor | null
}

export const USERS_PAGE_SIZE = 50

function asSubscription(value: unknown): UserSubscription {
  return value === "pro" || value === "premium" ? value : "free"
}

function asRole(value: unknown): AdminRole | undefined {
  if (
    value === "user" ||
    value === "author" ||
    value === "trusted_author" ||
    value === "editor" ||
    value === "admin"
  ) {
    return value
  }
  return undefined
}

function mapUser(value: unknown): AdminUser {
  const data = isRecord(value) ? value : {}
  const userConfig = isRecord(data.userConfig) ? data.userConfig : {}
  const device = isRecord(data.device) ? data.device : {}
  const app = isRecord(data.app) ? data.app : {}

  return {
    uid: safeString(data.uid ?? data.id, ""),
    displayName: safeString(data.displayName ?? data.name, ""),
    email: safeString(data.email, ""),
    status:
      typeof (data.status ?? userConfig.status) === "string"
        ? String(data.status ?? userConfig.status)
        : undefined,
    createdAt: toIsoString(data.createdAt) ?? new Date(0).toISOString(),
    lastLoginAt:
      toIsoString(data.lastLoginAt ?? data.lastLogin ?? data.lastSeenAt) ?? undefined,
    credits: safeNumber(data.credits),
    subscription: asSubscription(data.subscription),
    role: asRole(data.role ?? userConfig.role),
    wardrobeCount: safeNumber(data.wardrobeCount),
    savedResultsCount: safeNumber(data.savedResultsCount),
    weatherCity:
      typeof (data.weatherCity ?? data.city) === "string"
        ? String(data.weatherCity ?? data.city)
        : undefined,
    platform:
      typeof (data.platform ?? device.platform) === "string"
        ? String(data.platform ?? device.platform)
        : undefined,
    appVersion:
      typeof (data.appVersion ?? app.version) === "string"
        ? String(data.appVersion ?? app.version)
        : undefined,
    isTest: data.isTest === true,
    weatherOutfitEnabled: data.weatherOutfitEnabled === true,
    photoURL: typeof data.photoURL === "string" ? data.photoURL : undefined,
  }
}

/** One page of users, newest first, filtered by the adapter. */
export async function fetchUsersPage(
  filters: UserListFilters,
  cursor: AdminCursor | null,
  pageSize = USERS_PAGE_SIZE,
): Promise<UserPage> {
  const payload = { filters, cursor, pageSize }
  return adminRequest<UserPage>("users.list", payload, () => {
    const page = demoUserPage(filters, cursor, pageSize)
    return {
      users: page.users.map(mapUser),
      nextCursor: page.nextCursor,
    }
  })
}

export async function countUsers(filters?: UserListFilters) {
  return adminRequest<number>("users.count", { filters }, () =>
    demoCountUsers(filters),
  )
}

export interface UserPlanCounts {
  total: number
  free: number
  pro: number
  premium: number
  /**
   * Profiles without a recognised `subscription` value. The app treats them as
   * free, but a filtered count cannot match them.
   */
  unassigned: number
}

/** Plan distribution from aggregate counts; no documents are downloaded. */
export async function fetchUserPlanCounts(): Promise<UserPlanCounts> {
  return adminRequest<UserPlanCounts>("users.planCounts", {}, () =>
    demoPlanCounts(),
  )
}

/** Users created inside a date range, newest first. */
export async function fetchUsersCreatedBetween(since: Date, until: Date) {
  const payload = {
    since: since.toISOString(),
    until: until.toISOString(),
  }
  return adminRequest<AdminUser[]>("users.createdBetween", payload, () =>
    demoUsersCreatedBetween(since, until),
  )
}

export async function countUsersWhere(
  field: "wardrobeCount" | "savedResultsCount",
  minimum: number,
) {
  return adminRequest<number>(
    "users.countWhere",
    { field, minimum },
    () => demoCountUsersWhere(field, minimum),
  )
}

export async function sumUserField(field: "wardrobeCount" | "savedResultsCount") {
  return adminRequest<number>("users.sumField", { field }, () =>
    demoSumUserField(field),
  )
}

/** Reads only the given users; the adapter may batch internally. */
export async function fetchUsersByIds(uids: Iterable<string>) {
  const ids = [...new Set(uids)].filter(Boolean)
  if (ids.length === 0) return []
  return adminRequest<AdminUser[]>("users.byIds", { uids: ids }, () =>
    demoUsersByIds(ids),
  )
}

/** Exact UID, e-mail prefix, and display-name prefix search. */
export async function searchUsers(term: string): Promise<AdminUser[]> {
  const value = term.trim()
  if (!value) return []
  return adminRequest<AdminUser[]>("users.search", { term: value }, () =>
    demoSearchUsers(value),
  )
}

export async function fetchUserById(uid: string): Promise<AdminUser | null> {
  if (!uid) return null
  return adminRequest<AdminUser | null>("users.get", { uid }, () =>
    demoFetchUser(uid),
  )
}

export interface DeleteUserInput {
  uid: string
  consolePassword?: string
}

export async function deleteUser(input: string | DeleteUserInput): Promise<void> {
  const params: DeleteUserInput =
    typeof input === "string" ? { uid: input } : input
  await adminRequest<void>("users.delete", params, () =>
    demoDeleteUser(params),
  )
}
