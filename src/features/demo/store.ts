/**
 * Synthetic, memory-only demo state.
 *
 * Nothing here is real customer data and nothing leaves the browser. A full
 * page reload rebuilds this module and therefore resets every mutation.
 */
import { isConsoleRole, type ConsoleRole } from "../../lib/auth/permissions"
import {
  bucketByGranularity,
  createDateRange,
  dualBucketByGranularity,
  unionUniqueUserIds,
} from "../../lib/analytics/analyticsUtils"
import { CHART_COLORS } from "../../lib/charts/chartTheme"
import {
  getDefaultOperationCost,
  getOperationLabel,
  isCreditLoad,
  isCreditSpend,
} from "../../lib/credits/creditUtils"
import type { AdminRole } from "../../types/admin"
import type {
  AcquisitionData,
  ActivationData,
  AnalyticsData,
  AnalyticsResponse,
  AppStoreAnalyticsData,
  DailyActiveUserFilters,
  DailyActiveUsersResponse,
  DateRange,
  EngagementData,
  GooglePlayAnalyticsData,
  LaunchAnalyticsFilters,
  MarketSnapshot,
  RecentActivationFilters,
  RecentActivationResponse,
  ReliabilityData,
  RetentionData,
  SubcollectionTimelineItem,
  WardrobeItem as AnalyticsWardrobeItem,
} from "../analytics/types"
import type { CreditTransaction, CreditTransactionType } from "../credits/types"
import type {
  DashboardAccess,
  DashboardRangeDays,
  DashboardStats,
} from "../dashboard/types"
import type { AuditLog, AuditLogsResponse } from "../audit-logs/types"
import type {
  ApiKey,
  ApiKeyUsageDay,
  CreateApiKeyInput,
  MintedApiKey,
  UpdateApiKeyInput,
} from "../api-keys/types"
import { DEFAULT_SERVICES } from "../api-keys/types"
import type { AppConfigKey } from "../app-config/types"
import type { BlogPost, MediaAnalyticsResponse } from "../media/types"
import type {
  AssignRedeemCodeInput,
  CreateRedeemCodeInput,
  RedeemCode,
} from "../redeem-codes/types"
import type { SubscriptionRecord } from "../subscriptions/types"
import type { AdminUser, UserSubscription } from "../users/types"
import type { WardrobeAnalyticsData } from "../wardrobe/types"
import type { WeatherForecast, WeatherLocation } from "../weather/types"
import { clone, isoNow, toIsoString } from "../shared/format"

const DAY = 86_400_000

function dayIso(offsetDays: number, hour = 10) {
  const date = new Date()
  date.setHours(hour, 0, 0, 0)
  date.setTime(date.getTime() + offsetDays * DAY)
  return date.toISOString()
}

function dateOnly(offsetDays: number) {
  return dayIso(offsetDays, 12).slice(0, 10)
}

function enumerateDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T12:00:00.000Z`)
  const end = new Date(`${endDate}T12:00:00.000Z`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return []
  const days: string[] = []
  const cursor = new Date(start)
  while (cursor <= end && days.length < 180) {
    days.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return days
}

function spreadAcrossRange(range: DateRange, index: number, total: number) {
  const start = range.since.getTime()
  const end = range.until.getTime()
  const ratio = (index + 1) / (total + 1)
  return new Date(start + (end - start) * ratio).toISOString()
}

function inRange(value: unknown, range: DateRange) {
  const date = toIsoString(value)
  if (!date) return false
  const time = new Date(date).getTime()
  return time >= range.since.getTime() && time <= range.until.getTime()
}

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */

const WEATHER_CITIES = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya"]

function planFor(index: number): UserSubscription {
  if (index % 7 === 0) return "premium"
  if (index % 3 === 0) return "pro"
  return "free"
}

function roleFor(index: number): AdminRole {
  if (index === 0) return "admin"
  if (index === 1) return "editor"
  if (index === 2) return "editor"
  return index % 11 === 0 ? "author" : "user"
}

function makeUsers(): AdminUser[] {
  return Array.from({ length: 64 }, (_, index) => {
    const createdOffset = -(index * 2 + 1)
    return {
      uid: `demo-user-${String(index + 1).padStart(2, "0")}`,
      displayName: `Demo Kullanıcı ${String(index + 1).padStart(2, "0")}`,
      email: `demo.user.${String(index + 1).padStart(2, "0")}@example.test`,
      status: "active",
      createdAt: dayIso(createdOffset, 9),
      lastLoginAt: dayIso(-(index % 9), 18),
      credits: 40 + ((index * 17) % 260),
      subscription: planFor(index),
      role: roleFor(index),
      wardrobeCount: index % 9,
      savedResultsCount: index % 6,
      weatherCity: WEATHER_CITIES[index % WEATHER_CITIES.length],
      platform: index % 2 === 0 ? "iOS" : "Android",
      appVersion: index % 4 === 0 ? "3.4.0" : "3.3.2",
      isTest: index % 17 === 0,
      weatherOutfitEnabled: index % 3 === 0,
    }
  })
}

let demoUsers = makeUsers()

export function listDemoUsers() {
  return clone(demoUsers)
}

export function demoUserPage(
  filters: { userFilter: string; platformFilter: string },
  cursor: string | null,
  pageSize: number,
) {
  const filtered = demoUsers
    .filter((user) => {
      if (filters.userFilter === "test") return user.isTest
      if (filters.userFilter === "admin") return user.role === "admin"
      if (filters.userFilter !== "all") {
        return user.subscription === filters.userFilter
      }
      return true
    })
    .filter((user) => {
      if (filters.platformFilter === "all") return true
      return (
        user.platform?.toLowerCase() === filters.platformFilter.toLowerCase()
      )
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

  const startIndex = cursor
    ? Math.max(0, filtered.findIndex((user) => user.uid === cursor) + 1)
    : 0
  const page = filtered.slice(startIndex, startIndex + pageSize)
  const hasMore = startIndex + pageSize < filtered.length

  return {
    users: clone(page),
    nextCursor: hasMore && page.length > 0 ? page[page.length - 1].uid : null,
  }
}

export function demoCountUsers(filters?: {
  userFilter: string
  platformFilter: string
}) {
  if (!filters) return demoUsers.length
  return demoUserPage(filters, null, demoUsers.length + 1).users.length
}

export function demoPlanCounts() {
  return demoUsers.reduce(
    (counts, user) => {
      counts.total += 1
      counts[user.subscription] += 1
      return counts
    },
    { total: 0, free: 0, pro: 0, premium: 0, unassigned: 0 },
  )
}

export function demoUsersCreatedBetween(since: Date, until: Date) {
  const range = { since, until, granularity: "day" as const }
  return clone(demoUsers.filter((user) => inRange(user.createdAt, range)))
}

export function demoCountUsersWhere(
  field: "wardrobeCount" | "savedResultsCount",
  minimum: number,
) {
  return demoUsers.filter((user) => user[field] >= minimum).length
}

export function demoSumUserField(field: "wardrobeCount" | "savedResultsCount") {
  return demoUsers.reduce((sum, user) => sum + user[field], 0)
}

export function demoUsersByIds(uids: string[]) {
  const wanted = new Set(uids)
  return clone(demoUsers.filter((user) => wanted.has(user.uid)))
}

export function demoSearchUsers(term: string) {
  const value = term.trim().toLocaleLowerCase("tr-TR")
  if (!value) return []
  return clone(
    demoUsers
      .filter((user) => {
        return (
          user.uid.toLowerCase() === value ||
          user.email.toLowerCase().startsWith(value) ||
          user.displayName.toLocaleLowerCase("tr-TR").startsWith(value)
        )
      })
      .slice(0, 20),
  )
}

export function demoFetchUser(uid: string) {
  const user = demoUsers.find((item) => item.uid === uid)
  return user ? clone(user) : null
}

export function demoDeleteUser(input: {
  uid: string
  consolePassword?: string
}) {
  if (!input.consolePassword?.trim()) {
    throw new Error("Console password is required.")
  }
  if (input.uid === DEMO_ACTOR_UID) {
    throw new Error("You cannot delete your own demo console account.")
  }
  const existing = demoUsers.find((user) => user.uid === input.uid)
  if (!existing) throw new Error("No demo user exists with this id.")
  demoUsers = demoUsers.filter((user) => user.uid !== input.uid)
  demoTeam = demoTeam.filter((member) => member.uid !== input.uid)
}

/* -------------------------------------------------------------------------- */
/* Team                                                                       */
/* -------------------------------------------------------------------------- */

interface DemoTeamMember {
  uid: string
  role: ConsoleRole
  email: string | null
  displayName: string | null
  disabled: boolean
  updatedAt: string | null
}

let demoTeam: DemoTeamMember[] = [
  { uid: "demo-user-01", role: "admin", email: "demo.admin@example.test", displayName: "Demo Admin", disabled: false, updatedAt: dayIso(-2) },
  { uid: "demo-user-02", role: "support", email: "demo.support@example.test", displayName: "Demo Destek", disabled: false, updatedAt: dayIso(-4) },
  { uid: "demo-user-03", role: "editor", email: "demo.editor@example.test", displayName: "Demo Editör", disabled: false, updatedAt: dayIso(-6) },
  { uid: "demo-user-04", role: "admin", email: "demo.owner@example.test", displayName: "Demo Sahip", disabled: false, updatedAt: dayIso(-9) },
]

export function demoListTeam() {
  return clone(demoTeam)
}

export function demoSetTeamRole(input: {
  uid: string
  role: ConsoleRole | null
  consolePassword: string
}) {
  if (!input.consolePassword.trim()) {
    throw new Error("Console password is required.")
  }
  const member = demoTeam.find((item) => item.uid === input.uid)
  if (input.role !== null && !isConsoleRole(input.role)) {
    throw new Error("Role change is invalid.")
  }
  if (!member) {
    if (input.role === null) {
      throw new Error("This account is not a demo team member.")
    }
    demoAddTeamMember(input.uid, input.role)
    return { uid: input.uid, role: input.role, changed: true }
  }

  // Demo deliberately cannot mint new administrators.
  if (member.role !== "admin" && input.role === "admin") {
    throw new Error("Demo mode does not allow promoting members to admin.")
  }

  const adminCount = demoTeam.filter((item) => item.role === "admin").length
  if (member.role === "admin" && input.role !== "admin" && adminCount <= 1) {
    throw new Error("The last admin cannot be demoted or removed.")
  }

  if (input.uid === DEMO_ACTOR_UID && input.role !== "admin") {
    throw new Error("You cannot demote or remove your own demo console role.")
  }

  if (input.role === null) {
    demoTeam = demoTeam.filter((item) => item.uid !== input.uid)
  } else {
    member.role = input.role
    member.updatedAt = isoNow()
  }
  return { uid: input.uid, role: input.role, changed: true }
}

export function demoAddTeamMember(uid: string, role: ConsoleRole) {
  if (role === "admin") {
    throw new Error("Demo mode does not allow promoting members to admin.")
  }
  const user = demoUsers.find((item) => item.uid === uid)
  if (!user) throw new Error("No demo user exists with this id.")
  if (demoTeam.some((member) => member.uid === uid)) return
  demoTeam.push({
    uid,
    role,
    email: user.email,
    displayName: user.displayName,
    disabled: false,
    updatedAt: isoNow(),
  })
}

/* -------------------------------------------------------------------------- */
/* API keys                                                                   */
/* -------------------------------------------------------------------------- */

let apiKeySequence = 4

function makeApiKey(
  index: number,
  overrides: Partial<ApiKey> = {},
): ApiKey {
  const env = index % 2 === 0 ? "live" : "test"
  const status = index === 3 ? "revoked" : index === 2 ? "disabled" : "active"
  return {
    keyId: `demo-key-${String(index).padStart(3, "0")}`,
    name: `Demo Partner ${index}`,
    ownerEmail: `partner.${index}@example.test`,
    env,
    status,
    displayPrefix: `demo_${env}_${String(index).padStart(3, "0")}`,
    lastFour: "demo",
    scopes: ["outfit:read", "outfit:compute", "image:process"],
    services: clone(DEFAULT_SERVICES),
    allowedOrigins: ["https://partner.example.test"],
    allowedIps: [],
    notes: "Synthetic demo key. It cannot authenticate anywhere.",
    createdAt: dayIso(-(index * 12 + 4)),
    createdBy: "demo-user-01",
    expiresAt: dayIso(30 + index * 10),
    revokedAt: status === "revoked" ? dayIso(-3) : null,
    rotatedFrom: null,
    rotatedTo: null,
    lastUsedAt: dayIso(-(index % 5), 14),
    lastUsedService: index % 2 === 0 ? "outfitEngine" : "imageProcessing",
    ...overrides,
  }
}

let demoApiKeys: ApiKey[] = [
  makeApiKey(1),
  makeApiKey(2),
  makeApiKey(3),
  makeApiKey(4, {
    name: "Demo Legacy Partner",
    status: "revoked",
    revokedAt: dayIso(-8),
    expiresAt: dayIso(-1),
  }),
]

export function demoListApiKeys() {
  return clone(demoApiKeys).sort((left, right) =>
    String(right.createdAt).localeCompare(String(left.createdAt)),
  )
}

export function demoGetApiKey(keyId: string) {
  const key = demoApiKeys.find((item) => item.keyId === keyId)
  if (!key) throw new Error("API key was not found.")
  return clone(key)
}

const DEMO_ACTOR_UID = "demo-user-01"

function assertDemoPassword(value: string) {
  if (!value.trim()) throw new Error("Console password is required.")
}

function nextApiKeyId() {
  apiKeySequence += 1
  return `demo-key-${String(apiKeySequence).padStart(3, "0")}`
}

function fakeSecret(keyId: string) {
  return `sk_demo_${keyId.replace(/[^a-z0-9]/gi, "")}_not_a_real_secret`
}

export function demoCreateApiKey(input: CreateApiKeyInput): MintedApiKey {
  assertDemoPassword(input.consolePassword)
  if (!input.name.trim()) throw new Error("A key name is required.")
  if (!input.ownerEmail.includes("@")) throw new Error("A valid owner e-mail is required.")

  const keyId = nextApiKeyId()
  const env = input.env
  const key: ApiKey = {
    keyId,
    name: input.name.trim(),
    ownerEmail: input.ownerEmail.trim(),
    env,
    status: "active",
    displayPrefix: `demo_${env}_${keyId.slice(-3)}`,
    lastFour: "demo",
    scopes: [...input.scopes],
    services: {
      ...clone(DEFAULT_SERVICES),
      ...(input.services ?? {}),
    },
    allowedOrigins: input.allowedOrigins ?? [],
    allowedIps: input.allowedIps ?? [],
    notes: input.notes ?? "Synthetic demo key.",
    createdAt: isoNow(),
    createdBy: "demo-user-01",
    expiresAt: input.expiresAt ?? null,
    revokedAt: null,
    rotatedFrom: null,
    rotatedTo: null,
    lastUsedAt: null,
    lastUsedService: "",
  }
  demoApiKeys = [key, ...demoApiKeys]
  return {
    keyId,
    plaintext: fakeSecret(keyId),
    consolePasswordEnforced: true,
  }
}

export function demoUpdateApiKey(input: UpdateApiKeyInput): ApiKey {
  const key = demoApiKeys.find((item) => item.keyId === input.keyId)
  if (!key) throw new Error("API key was not found.")
  if (key.status === "revoked") throw new Error("Revoked keys cannot be edited.")

  if (input.name !== undefined) key.name = input.name
  if (input.ownerEmail !== undefined) key.ownerEmail = input.ownerEmail
  if (input.status !== undefined) key.status = input.status
  if (input.scopes !== undefined) key.scopes = [...input.scopes]
  if (input.services !== undefined) {
    key.services = {
      ...(key.services ?? clone(DEFAULT_SERVICES)),
      ...input.services,
    }
  }
  if (input.allowedOrigins !== undefined) key.allowedOrigins = [...input.allowedOrigins]
  if (input.allowedIps !== undefined) key.allowedIps = [...input.allowedIps]
  if (input.expiresAt !== undefined) key.expiresAt = input.expiresAt
  if (input.notes !== undefined) key.notes = input.notes
  return clone(key)
}

export function demoRotateApiKey(input: {
  keyId: string
  consolePassword: string
}): MintedApiKey {
  assertDemoPassword(input.consolePassword)
  const oldKey = demoApiKeys.find((item) => item.keyId === input.keyId)
  if (!oldKey) throw new Error("API key was not found.")
  if (oldKey.status === "revoked") throw new Error("Revoked keys cannot be rotated.")

  const keyId = nextApiKeyId()
  const graceEndsAt = dayIso(7)
  const replacement: ApiKey = {
    ...clone(oldKey),
    keyId,
    status: "active",
    displayPrefix: `demo_${oldKey.env}_${keyId.slice(-3)}`,
    createdAt: isoNow(),
    revokedAt: null,
    rotatedFrom: oldKey.keyId,
    rotatedTo: null,
    lastUsedAt: null,
    lastUsedService: "",
    expiresAt: oldKey.expiresAt,
  }
  oldKey.rotatedTo = keyId
  oldKey.status = "disabled"
  oldKey.expiresAt = graceEndsAt
  demoApiKeys = [replacement, ...demoApiKeys]

  return {
    keyId,
    plaintext: fakeSecret(keyId),
    previousKeyId: oldKey.keyId,
    graceEndsAt,
    consolePasswordEnforced: true,
  }
}

export function demoRevokeApiKey(input: {
  keyId: string
  consolePassword: string
}) {
  assertDemoPassword(input.consolePassword)
  const key = demoApiKeys.find((item) => item.keyId === input.keyId)
  if (!key) throw new Error("API key was not found.")
  if (key.status === "revoked") throw new Error("This key is already revoked.")
  key.status = "revoked"
  key.revokedAt = isoNow()
  key.rotatedTo = null
  return clone(key)
}

export function demoApiKeyUsage(
  keyId: string,
  startDate: string,
  endDate: string,
): ApiKeyUsageDay[] {
  if (!demoApiKeys.some((item) => item.keyId === keyId)) {
    throw new Error("API key was not found.")
  }
  return enumerateDays(startDate, endDate).map((date, index) => {
    const look = 20 + ((index * 13) % 80)
    const image = 5 + ((index * 7) % 30)
    const taxonomy = 2 + (index % 11)
    return {
      date,
      total: look + image + taxonomy,
      byService: {
        outfitEngine: look,
        imageProcessing: image,
        taxonomy,
      },
    }
  })
}

/* -------------------------------------------------------------------------- */
/* App config                                                                 */
/* -------------------------------------------------------------------------- */

const CONFIG_OWNER = "Demo Admin"

function configMetadata(offset: number) {
  return { updatedAt: dayIso(offset), updatedBy: CONFIG_OWNER }
}

let demoConfig: Record<AppConfigKey, Record<string, unknown>> = {
  creditCosts: {
    ANALYZE_CLOTHING: 1,
    ANALYZE_OUTFIT: 1,
    CREATE_COMBINATION: 2,
    WEATHER_OUTFIT_SUGGESTION: 2,
    REMOVE_BACKGROUND: 10,
    VIRTUAL_TRY_ON: 10,
    CREATE_AVATAR: 30,
    CABIN_AI_ADVICE: 3,
    CABIN_BULK_REVIEW: 5,
    ...configMetadata(-5),
  },
  planCredits: {
    free: { name: "Free", initialCredits: 30, monthlyCredits: 0 },
    pro: { name: "Pro", initialCredits: 100, monthlyCredits: 50 },
    premium: { name: "Premium", initialCredits: 300, monthlyCredits: 180 },
    ...configMetadata(-7),
  },
  planLimits: {
    free: { maxWardrobeItems: 40, maxSavedCombinations: 10 },
    pro: { maxWardrobeItems: 150, maxSavedCombinations: 50 },
    premium: { maxWardrobeItems: 400, maxSavedCombinations: 150 },
    ...configMetadata(-7),
  },
  apiLimits: {
    gemini: { enabled: true, disabledAt: null, disabledReason: null, message: null },
    openai: { enabled: false, disabledAt: dayIso(-12), disabledReason: "manual", message: "Demo: disabled." },
    weather: { enabled: true, disabledAt: null, disabledReason: null, message: null },
    payment: { enabled: true, disabledAt: null, disabledReason: null, message: null },
    ...configMetadata(-2),
  },
  prompts: {
    analyzeClothing: "Describe the garment using neutral fashion terms.",
    analyzeOutfitStyle: "Summarise the outfit style without personal data.",
    virtualTryOn: "Render a synthetic try-on preview.",
    removeBackground: "Remove the background and return a transparent cut-out.",
    createAvatar: "Create a neutral demo avatar.",
    ...configMetadata(-20),
  },
  weatherTimeSlots: {
    morning: { start: 6, end: 11 },
    noon: { start: 11, end: 15 },
    evening: { start: 15, end: 20 },
    night: { start: 20, end: 6 },
    ...configMetadata(-15),
  },
  dwKvkkVersion: {
    currentVersion: "demo-2026.1",
    ...configMetadata(-30),
  },
  appVersion: {
    latestVersion: "3.4.0",
    ...configMetadata(-1),
  },
}

const initialDemoConfig = clone(demoConfig)

export function demoFetchAppConfig(key: AppConfigKey) {
  return demoConfig[key] ? clone(demoConfig[key]) : null
}

export function demoUpdateAppConfig(input: {
  configId: AppConfigKey
  data: Record<string, unknown>
  consolePassword: string
}) {
  assertDemoPassword(input.consolePassword)
  const existing = demoConfig[input.configId] ?? {}
  demoConfig = {
    ...demoConfig,
    [input.configId]: {
      ...existing,
      ...input.data,
      updatedAt: isoNow(),
      updatedBy: CONFIG_OWNER,
    },
  }
}

/* -------------------------------------------------------------------------- */
/* Credits and subscriptions                                                  */
/* -------------------------------------------------------------------------- */

function makeCredits(): CreditTransaction[] {
  const operations = [
    "ANALYZE_CLOTHING",
    "ANALYZE_OUTFIT",
    "CREATE_COMBINATION",
    "WEATHER_OUTFIT_SUGGESTION",
    "REMOVE_BACKGROUND",
    "VIRTUAL_TRY_ON",
    "CREATE_AVATAR",
  ]
  return Array.from({ length: 72 }, (_, index) => {
    const user = demoUsers[index % demoUsers.length]
    const isLoad = index % 4 === 0
    const operation = operations[index % operations.length]
    const amount = isLoad ? 50 + (index % 5) * 25 : -(1 + (index % 6))
    const type: CreditTransactionType = isLoad
      ? index % 8 === 0
        ? "purchase"
        : "renewal"
      : "spend"
    return {
      id: `demo-credit-${String(index + 1).padStart(3, "0")}`,
      userId: user.uid,
      displayName: user.displayName,
      type,
      operation: isLoad ? undefined : operation,
      amount,
      cost: isLoad ? undefined : Math.abs(amount),
      balanceBefore: 100 + index,
      balanceAfter: 100 + index + amount,
      reason: isLoad ? "Synthetic demo load" : getOperationLabel(operation),
      details: { email: user.email, source: "demo" },
      createdAt: dayIso(-(index % 45), 8 + (index % 12)),
    }
  }).sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

let demoCredits = makeCredits()

export function demoCreditTransactions(limitCount = 50) {
  return clone(demoCredits.slice(0, Math.max(0, limitCount)))
}

export function demoCreditTransactionsInRange(range: DateRange) {
  return clone(demoCredits.filter((item) => inRange(item.createdAt, range)))
}

function makeSubscriptions(): SubscriptionRecord[] {
  return Array.from({ length: 18 }, (_, index) => {
    const user = demoUsers[index * 2 % demoUsers.length]
    const plan = index % 5 === 0 ? "premium" : index % 2 === 0 ? "pro" : "free"
    const expired = index % 7 === 0
    const cancelled = !expired && index % 6 === 0
    return {
      purchaseToken: `demo-purchase-${String(index + 1).padStart(3, "0")}`,
      userId: user.uid,
      displayName: index % 4 === 0 ? undefined : user.displayName,
      email: index % 5 === 0 ? undefined : user.email,
      productId: `demo_${plan}_monthly`,
      basePlanId: plan,
      status: expired ? "expired" : cancelled ? "cancelled" : "active",
      isActive: !expired && !cancelled,
      autoRenewing: !cancelled && !expired,
      platform: index % 2 === 0 ? "ios" : "android",
      provider: index % 2 === 0 ? "app_store" : "play_store",
      price: plan === "premium" ? 19.99 : plan === "pro" ? 9.99 : 0,
      currency: "USD",
      startedAt: dayIso(-(60 + index * 3)),
      expiryTime: dayIso(expired ? -5 : 20 + index),
      lastNotificationType: index % 13,
      wasRevoked: false,
      createdAt: dayIso(-(70 + index * 3)),
      updatedAt: dayIso(-(index % 10)),
    }
  })
}

let demoSubscriptions = makeSubscriptions()

export function demoListSubscriptions() {
  return clone(demoSubscriptions)
}

export function demoActiveSubscriptionCount() {
  return demoSubscriptions.filter((item) => item.isActive).length
}

export function demoSubscriptionsInRange(range: DateRange) {
  return clone(demoSubscriptions.filter((item) => inRange(item.updatedAt, range)))
}

/* -------------------------------------------------------------------------- */
/* Audit logs                                                                 */
/* -------------------------------------------------------------------------- */

const AUDIT_ACTIONS = [
  ["config_change", "Updated app version configuration", "config", "appVersion", "success"],
  ["role_change", "Changed a console role", "team", "demo-user-02", "success"],
  ["api_key_operation", "Rotated an API key", "apiKey", "demo-key-002", "success"],
  ["redeem_operation", "Created a redeem code", "redeemCode", "demo-code-003", "success"],
  ["credit_operation", "Adjusted demo credits", "user", "demo-user-08", "success"],
  ["weather_operation", "Triggered a demo forecast refresh", "weather", "demo-location-01", "success"],
  ["delete", "Deleted a synthetic demo user", "user", "demo-user-31", "failed"],
  ["login", "Signed in to the demo console", "session", "demo-user-01", "success"],
] as const

export function demoAuditLogs(): AuditLogsResponse {
  const logs: AuditLog[] = Array.from({ length: 28 }, (_, index) => {
    const action = AUDIT_ACTIONS[index % AUDIT_ACTIONS.length]
    return {
      id: `demo-audit-${String(index + 1).padStart(3, "0")}`,
      adminId: demoTeam[index % demoTeam.length].uid,
      action: action[1],
      actionType: action[0],
      targetType: action[2],
      targetId: action[3],
      status: action[4],
      createdAt: dayIso(-(index % 20), 9 + (index % 9)),
    }
  })
  return {
    logs,
    sample: { limit: 200, truncated: false },
    note: "Synthetic demo audit trail; no real administrative actions.",
  }
}

/* -------------------------------------------------------------------------- */
/* Operational analytics and wardrobe                                         */
/* -------------------------------------------------------------------------- */

function timeline(prefix: string, range: DateRange, count = 14) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${String(index + 1).padStart(3, "0")}`,
    userId: demoUsers[index % demoUsers.length].uid,
    createdAt: spreadAcrossRange(range, index, count),
  }))
}

export function demoOperationalData(range: DateRange) {
  const wardrobe = timeline("demo-wardrobe", range, 18).map((item, index) => ({
    ...item,
    category: ["Tops", "Shoes", "Outerwear", "Accessories"][index % 4],
    title: `Demo parça ${index + 1}`,
    color: ["Ink", "Sand", "Olive", "Clay"][index % 4],
    brand: "Demo Atelier",
    source: "demo-upload",
    status: "ready",
  }))
  return {
    creditTransactions: clone(demoCredits.filter((item) => inRange(item.createdAt, range))),
    wardrobe,
    savedResults: timeline("demo-result", range, 12),
    savedPhotos: timeline("demo-photo", range, 10),
    wishlist: timeline("demo-wish", range, 8),
    calendar: timeline("demo-calendar", range, 9),
  }
}

export function demoCollectionCounts(collectionNames: string[]) {
  const counts: Record<string, number> = {
    wardrobe: 128,
    savedResults: 74,
    savedPhotos: 52,
    wishlist: 36,
    calendar: 41,
  }
  return Object.fromEntries(
    collectionNames.map((name) => [name, counts[name] ?? 0]),
  )
}

const WARDROBE_CATEGORIES = ["Tops", "Shoes", "Outerwear", "Accessories", "Dresses"]

export function demoWardrobeItems(limitCount = 500) {
  return Array.from({ length: Math.min(36, Math.max(0, limitCount)) }, (_, index) => {
    const user = demoUsers[index % demoUsers.length]
    return {
      id: `demo-item-${String(index + 1).padStart(3, "0")}`,
      userId: user.uid,
      title: `Demo kıyafet ${index + 1}`,
      category: WARDROBE_CATEGORIES[index % WARDROBE_CATEGORIES.length],
      color: ["Ink", "Sand", "Olive", "Clay", "Stone"][index % 5],
      brand: "Demo Atelier",
      source: "demo-upload",
      status: "ready",
      createdAt: dayIso(-(index % 30), 10),
    }
  })
}

export function demoWardrobeAnalytics(
  range: DateRange,
  canReadUsers: boolean,
): WardrobeAnalyticsData {
  const items = demoWardrobeItems(500)
  const operational = demoOperationalData(range)
  const ownerIds = [...new Set(items.map((item) => item.userId))]
  const users = canReadUsers
    ? demoUsers
        .filter((user) => ownerIds.includes(user.uid))
        .map((user) => ({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          wardrobeCount: user.wardrobeCount,
          savedResultsCount: user.savedResultsCount,
        }))
    : []
  const usersById = new Map(users.map((user) => [user.uid, user]))
  const enrich = <T extends { userId?: string }>(item: T) => {
    const owner = item.userId ? usersById.get(item.userId) : undefined
    return {
      ...item,
      userDisplayName: owner?.displayName,
      userEmail: owner?.email,
    }
  }
  return {
    range,
    users,
    activeWardrobeUsers: canReadUsers
      ? demoUsers.filter((user) => user.wardrobeCount > 0).length
      : null,
    items: items.map(enrich),
    newItems: operational.wardrobe.map(enrich),
    savedResults: operational.savedResults,
    savedPhotos: operational.savedPhotos,
    wishlist: operational.wishlist,
    calendar: operational.calendar,
    counts: {
      wardrobe: demoCollectionCounts(["wardrobe"]).wardrobe,
      savedResults: demoCollectionCounts(["savedResults"]).savedResults,
      savedPhotos: demoCollectionCounts(["savedPhotos"]).savedPhotos,
      wishlist: demoCollectionCounts(["wishlist"]).wishlist,
      calendar: demoCollectionCounts(["calendar"]).calendar,
    },
  }
}

export function demoAnalyticsData(range: DateRange): AnalyticsData {
  const operational = demoOperationalData(range)
  const timelineItems = (items: Array<Record<string, unknown>>) =>
    items.map<SubcollectionTimelineItem>((item) => ({
      id: String(item.id ?? ""),
      userId: typeof item.userId === "string" ? item.userId : undefined,
      createdAt: String(item.createdAt ?? ""),
    }))
  return {
    creditTransactions: operational.creditTransactions.map((item) => ({
      ...item,
      type: item.type as CreditTransactionType,
      createdAt: item.createdAt,
    })),
    wardrobeItems: operational.wardrobe.map<AnalyticsWardrobeItem>((item) => ({
      id: item.id,
      userId: item.userId,
      category: item.category,
      createdAt: item.createdAt,
    })),
    savedResults: timelineItems(operational.savedResults),
    savedPhotos: timelineItems(operational.savedPhotos),
    wishlist: timelineItems(operational.wishlist),
    calendar: timelineItems(operational.calendar),
  }
}

/* -------------------------------------------------------------------------- */
/* Media                                                                      */
/* -------------------------------------------------------------------------- */

let demoMediaPosts: BlogPost[] = Array.from({ length: 10 }, (_, index) => ({
  id: `demo-post-${String(index + 1).padStart(2, "0")}`,
  title: `Demo editorial ${index + 1}`,
  author: {
    displayName: `Demo Editör ${index + 1}`,
    username: `demo_editor_${index + 1}`,
  },
  category: ["Style", "Wardrobe", "Sustainability", "Culture"][index % 4],
  status: index % 5 === 0 ? "draft" : "published",
  stats: {
    views: 120 + index * 37,
    likes: 12 + index * 3,
    comments: 3 + (index % 7),
    bookmarks: 5 + (index % 9),
    readingTime: 3 + (index % 6),
  },
  publishedAt: index % 5 === 0 ? null : dayIso(-(index % 14), 11),
  createdAt: dayIso(-(index + 2), 9),
}))

const initialDemoMediaPosts = clone(demoMediaPosts)

export function demoMediaAnalytics(range?: DateRange): MediaAnalyticsResponse {
  const posts = range
    ? demoMediaPosts.filter((post) => inRange(post.publishedAt ?? post.createdAt, range))
    : demoMediaPosts
  return {
    posts: clone(posts),
    summary: {
      totalPosts: demoMediaPosts.length,
      totalComments: demoMediaPosts.reduce((sum, post) => sum + post.stats.comments, 0),
      totalFollows: 284,
      totalNotifications: 96,
    },
    sample: { limit: 500, truncated: false },
  }
}

/* -------------------------------------------------------------------------- */
/* Weather                                                                    */
/* -------------------------------------------------------------------------- */

const WEATHER_LOCATIONS = [
  { city: "İstanbul", district: "Kadıköy", lat: 40.99, lon: 29.03 },
  { city: "Ankara", district: "Çankaya", lat: 39.93, lon: 32.86 },
  { city: "İzmir", district: "Konak", lat: 38.42, lon: 27.14 },
  { city: "Bursa", district: "Nilüfer", lat: 40.21, lon: 28.98 },
  { city: "Antalya", district: "Muratpaşa", lat: 36.89, lon: 30.71 },
  { city: "Eskişehir", district: "Odunpazarı", lat: 39.77, lon: 30.52 },
]

let demoLocations: WeatherLocation[] = WEATHER_LOCATIONS.map((item, index) => ({
  id: `demo-location-${String(index + 1).padStart(2, "0")}`,
  city: item.city,
  country: "TR",
  district: item.district,
  coordinates: { lat: item.lat, lon: item.lon },
  active: index !== 5,
  userCount: 30 + index * 17,
  lastUpdated: dayIso(-1, 20),
  updatedAt: dayIso(-1, 20),
  createdAt: dayIso(-120),
}))

const CONDITIONS = ["Sunny", "Partly cloudy", "Cloudy", "Light rain"]

function makeForecast(location: WeatherLocation, offset: number): WeatherForecast {
  const base = 12 + offset + (location.userCount % 5)
  const condition = CONDITIONS[(offset + location.userCount) % CONDITIONS.length]
  const slot = (delta: number) => ({
    temperature: base + delta,
    feelsLike: base + delta - 1,
    condition,
    icon: condition.toLowerCase().replace(/\s+/g, "-"),
    humidity: 45 + ((offset * 7) % 30),
    windSpeed: 6 + ((offset * 3) % 12),
  })
  return {
    id: `demo-forecast-${location.id}-${dateOnly(offset)}`,
    locationId: location.id,
    locationName: `${location.district}, ${location.city}`,
    date: dateOnly(offset),
    timeSlot: "daily",
    morning: slot(-3),
    noon: slot(2),
    evening: slot(1),
    night: slot(-5),
    daytimeAverage: base,
    dailyHigh: base + 4,
    dailyLow: base - 5,
    dominantCondition: condition,
    dominantIcon: condition.toLowerCase().replace(/\s+/g, "-"),
    lastUpdated: dayIso(-1, 20),
    updatedAt: dayIso(-1, 20),
    createdAt: dayIso(-1, 20),
  }
}

let demoForecasts: WeatherForecast[] = demoLocations.flatMap((location) =>
  Array.from({ length: 7 }, (_, offset) => makeForecast(location, offset)),
)

export function demoWeatherLocations() {
  return clone(demoLocations)
}

export function demoWeatherForecasts(cutoffDate?: string) {
  const cutoff = cutoffDate ?? dateOnly(0)
  return clone(demoForecasts.filter((forecast) => forecast.date >= cutoff))
}

export function demoSyncWeatherLocations(input: { consolePassword: string }) {
  assertDemoPassword(input.consolePassword)
  const now = isoNow()
  demoLocations = demoLocations.map((location) => ({
    ...location,
    lastUpdated: now,
    updatedAt: now,
  }))
  return { success: true, synced: demoLocations.length }
}

export function demoTriggerWeatherUpdate(input: { consolePassword: string }) {
  assertDemoPassword(input.consolePassword)
  const now = isoNow()
  demoForecasts = demoForecasts.map((forecast) => ({
    ...forecast,
    lastUpdated: now,
    updatedAt: now,
  }))
  return {
    success: demoLocations.length,
    total: demoLocations.length,
    failed: 0,
    totalDaysProcessed: demoForecasts.length,
    deletedOldForecasts: 0,
    results: demoLocations.map((location) => ({
      locationId: location.id,
      success: true,
      daysProcessed: 7,
    })),
  }
}

/* -------------------------------------------------------------------------- */
/* Redeem codes                                                               */
/* -------------------------------------------------------------------------- */

const CODE_TYPES = ["credit", "subscription", "discount", "wardrobe", "custom"] as const

let redeemSequence = 6
let demoRedeemCodes: RedeemCode[] = Array.from({ length: 5 }, (_, index) => {
  const type = CODE_TYPES[index % CODE_TYPES.length]
  const status = index === 4 ? "disabled" : index === 3 ? "expired" : "active"
  return {
    id: `demo-code-${String(index + 1).padStart(3, "0")}`,
    code: `DEMO-${100 + index}`,
    type,
    value: type === "credit" ? `${25 + index * 10}` : type === "subscription" ? "pro_30d" : `${10 + index}%`,
    assignedUserId: index === 2 ? demoUsers[5].uid : undefined,
    assignedUserEmail: index === 2 ? demoUsers[5].email : undefined,
    maxUsage: 3 + index,
    usedCount: index,
    usageLabel: `${index} / ${3 + index}`,
    status,
    rawStatus: status,
    expiresAt: dayIso(status === "expired" ? -4 : 20 + index),
    createdByAdminId: "demo-user-01",
    createdAt: dayIso(-(index * 4 + 3)),
    updatedAt: dayIso(-(index * 2 + 1)),
    usedAt: index > 0 ? dayIso(-(index + 1)) : undefined,
    redemptionCount: index,
    sourceCollection: "promoCodes",
  }
})

const initialDemoRedeemCodes = clone(demoRedeemCodes)

export function demoListRedeemCodes() {
  return clone(demoRedeemCodes).sort((left, right) =>
    String(right.createdAt).localeCompare(String(left.createdAt)),
  )
}

export function demoCreateRedeemCode(input: CreateRedeemCodeInput): RedeemCode {
  const code = input.code.trim().toUpperCase()
  if (!code) throw new Error("A code is required.")
  if (demoRedeemCodes.some((item) => item.code.toUpperCase() === code)) {
    throw new Error("This demo code already exists.")
  }
  if (!Number.isFinite(input.maxUsage) || input.maxUsage <= 0) {
    throw new Error("Usage limit must be greater than zero.")
  }
  redeemSequence += 1
  const expiresAt = toIsoString(input.expiresAt) ?? isoNow()
  const created: RedeemCode = {
    id: `demo-code-${String(redeemSequence).padStart(3, "0")}`,
    code,
    type: input.type,
    value: String(input.value),
    maxUsage: input.maxUsage,
    usedCount: 0,
    usageLabel: `0 / ${input.maxUsage}`,
    status: new Date(expiresAt).getTime() < Date.now() ? "expired" : "active",
    rawStatus: "active",
    expiresAt,
    createdByAdminId: "demo-user-01",
    createdAt: isoNow(),
    updatedAt: isoNow(),
    redemptionCount: 0,
    sourceCollection: "promoCodes",
  }
  demoRedeemCodes = [created, ...demoRedeemCodes]
  return clone(created)
}

export function demoAssignRedeemCode(input: AssignRedeemCodeInput): RedeemCode {
  const code = demoRedeemCodes.find((item) => item.id === input.codeId)
  if (!code) throw new Error("Redeem code was not found.")
  if (code.status === "disabled" || code.status === "expired") {
    throw new Error("This demo code cannot be assigned.")
  }
  code.assignedUserId = input.userId
  code.assignedUserEmail = input.userEmail
  code.updatedAt = isoNow()
  return clone(code)
}

export function demoDisableRedeemCode(id: string): RedeemCode {
  const code = demoRedeemCodes.find((item) => item.id === id)
  if (!code) throw new Error("Redeem code was not found.")
  code.status = "disabled"
  code.rawStatus = "disabled"
  code.updatedAt = isoNow()
  return clone(code)
}

/* -------------------------------------------------------------------------- */
/* Launch analytics                                                           */
/* -------------------------------------------------------------------------- */

function acquisitionData(days: string[]): AcquisitionData {
  return {
    daily: days.map((d, index) => ({
      d,
      new_users: 14 + ((index * 7) % 23),
      dau: 120 + ((index * 11) % 90),
      wau: 410 + index * 4,
      mau: 980 + index * 9,
      provisional: index === days.length - 1,
    })),
    sources: [
      { source: "organic", medium: "store_search", new_users: 148, d1_retention_pct: 27.4 },
      { source: "referral", medium: "share_link", new_users: 96, d1_retention_pct: 34.1 },
      { source: "paid", medium: "campaign", new_users: 72, d1_retention_pct: 18.8 },
      { source: "direct", medium: "(none)", new_users: 61, d1_retention_pct: 22.5 },
    ],
    platforms: [
      { platform: "ANDROID", users: 214 },
      { platform: "IOS", users: 163 },
    ],
  }
}

function activationData(): ActivationData {
  return {
    funnel: [
      { step_order: 1, step_name: "First open", users: 420, conversion_pct: 100 },
      { step_order: 2, step_name: "Onboarding complete", users: 336, conversion_pct: 80 },
      { step_order: 3, step_name: "Sign up / login", users: 295, conversion_pct: 70.2 },
      { step_order: 4, step_name: "First garment", users: 241, conversion_pct: 57.4 },
      { step_order: 5, step_name: "Wardrobe ready", users: 198, conversion_pct: 47.1 },
      { step_order: 6, step_name: "Outfit created", users: 164, conversion_pct: 39 },
      { step_order: 7, step_name: "Wear confirmed", users: 121, conversion_pct: 28.8 },
    ],
    onboarding: [
      { step: 1, name: "Welcome", users: 420, remaining_pct: 100, dropoff_pct: 0 },
      { step: 2, name: "Style questions", users: 361, remaining_pct: 86, dropoff_pct: 14 },
      { step: 3, name: "First upload", users: 308, remaining_pct: 73.3, dropoff_pct: 14.7 },
      { step: 4, name: "Notification opt-in", users: 276, remaining_pct: 65.7, dropoff_pct: 10.4 },
    ],
    segments: [
      { segment_type: "platform", segment_value: "iOS", users: 163, activated_users: 78, activation_pct: 47.9 },
      { segment_type: "platform", segment_value: "Android", users: 214, activated_users: 92, activation_pct: 43 },
      { segment_type: "source", segment_value: "organic", users: 148, activated_users: 71, activation_pct: 48 },
      { segment_type: "source", segment_value: "paid", users: 72, activated_users: 24, activation_pct: 33.3 },
    ],
    summary: {
      p50_minutes: 7,
      p90_minutes: 23,
      within_10_min_pct: 63.4,
      starter_skip_pct: 18.2,
      notification_allow_pct: 54.6,
    },
  }
}

function retentionData(days: string[]): RetentionData {
  const cohortDates = days.slice(-14)
  const cohortRows = cohortDates.flatMap((cohort_date, cohortIndex) =>
    Array.from({ length: 31 }, (_, day) => ({
      cohort_date,
      day_n: day,
      cohort_size: 28 + cohortIndex * 3,
      returning_users: Math.max(0, Math.round((28 + cohortIndex * 3) * (0.42 ** day))),
      retention_pct: Number((100 * 0.42 ** day).toFixed(1)),
      is_mature: cohortIndex + day <= cohortDates.length + 15,
    })),
  )
  return {
    cohorts: cohortRows,
    curve: ["activated", "not_activated"].flatMap((segment) =>
      Array.from({ length: 31 }, (_, day) => {
        const base = segment === "activated" ? 100 : 100
        const decay = segment === "activated" ? 0.53 : 0.25
        return {
          segment,
          day_n: day,
          segment_size: segment === "activated" ? 190 : 230,
          returning_users: Math.max(1, Math.round(base * decay ** day)),
          retention_pct: Number((base * decay ** day).toFixed(1)),
        }
      }),
    ),
    habit: cohortDates.map((cohort_date, index) => ({
      cohort_date,
      cohort_size: 28 + index * 3,
      habit_users: 6 + (index % 5),
      habit_rate_pct: Number((16 + (index % 7)).toFixed(1)),
      is_mature: true,
    })),
    properties: [
      { property_name: "platform", property_value: "iOS", cohort_size: 190, d7_retention_pct: 13.4 },
      { property_name: "platform", property_value: "Android", cohort_size: 210, d7_retention_pct: 11.2 },
      { property_name: "source", property_value: "organic", cohort_size: 148, d7_retention_pct: 15.1 },
      { property_name: "source", property_value: "paid", cohort_size: 72, d7_retention_pct: 7.8 },
      { property_name: "notifications", property_value: "granted", cohort_size: 236, d7_retention_pct: 16.7 },
    ],
    stickiness: days.map((d, index) => {
      const dau = 120 + ((index * 11) % 90)
      const mau = 980 + index * 9
      return { d, dau, mau, stickiness_pct: Number(((dau / mau) * 100).toFixed(1)) }
    }),
  }
}

function engagementData(days: string[]): EngagementData {
  return {
    features: [
      { feature: "Wardrobe", adoption_pct: 78.4, adopter_d7_pct: 18.6, retention_lift: 1.8 },
      { feature: "AI outfit", adoption_pct: 54.2, adopter_d7_pct: 22.3, retention_lift: 2.1 },
      { feature: "Weather outfit", adoption_pct: 41.8, adopter_d7_pct: 20.1, retention_lift: 1.7 },
      { feature: "Calendar", adoption_pct: 29.6, adopter_d7_pct: 17.4, retention_lift: 1.3 },
    ],
    outfitSources: [
      { source: "wardrobe", outfits: 640 },
      { source: "weather", outfits: 412 },
      { source: "manual", outfits: 188 },
    ],
    ai: [
      { feature: "Outfit generation", started: 820, success_pct: 96.4, p50_duration_ms: 2200, p90_duration_ms: 5100 },
      { feature: "Garment analysis", started: 610, success_pct: 98.1, p50_duration_ms: 1500, p90_duration_ms: 3800 },
      { feature: "Background removal", started: 344, success_pct: 94.2, p50_duration_ms: 3100, p90_duration_ms: 7200 },
    ],
    dailyWear: days.map((d, index) => ({ d, users: 36 + ((index * 5) % 34) })),
    rejections: [
      { reason: "Too formal", count: 44 },
      { reason: "Wrong weather", count: 31 },
      { reason: "No matching shoes", count: 19 },
    ],
    funnels: [
      { step: "Open outfit", users: 820 },
      { step: "Generate", users: 646 },
      { step: "Save", users: 322 },
    ],
    errors: [
      { event_name: "outfit_generate_failed", error_code: "timeout", affected_users: 18, occurrences: 23 },
      { event_name: "image_upload_failed", error_code: "too_large", affected_users: 11, occurrences: 13 },
      { event_name: "weather_fetch_failed", error_code: "upstream", affected_users: 7, occurrences: 8 },
    ],
  }
}

function reliabilityData(days: string[]): ReliabilityData {
  return {
    daily: days.map((d, index) => ({
      d,
      fatal_events: index % 6,
      non_fatal_events: 8 + (index % 11),
      crash_free_users_pct: 99.2 + (index % 5) / 10,
      crash_free_sessions_pct: 99.5 + (index % 4) / 10,
    })),
    issues: [
      { issue_title: "Outfit render timeout", platform: "Android", affected_users: 19, occurrences: 24 },
      { issue_title: "Upload memory pressure", platform: "iOS", affected_users: 12, occurrences: 15 },
      { issue_title: "Forecast cache miss", platform: "Android", affected_users: 8, occurrences: 9 },
    ],
    attributes: [
      { version: "3.4.0", platform: "iOS", users: 210 },
      { version: "3.3.2", platform: "Android", users: 187 },
    ],
    auth: [
      { d: days.at(-1) ?? dateOnly(0), reason: "session_timeout", affected_users: 6, occurrences: 7 },
      { d: days.at(-2) ?? dateOnly(-1), reason: "network_reset", affected_users: 4, occurrences: 5 },
    ],
    firstSession: [
      { version: "3.4.0", users: 74, crash_free_pct: 99.4 },
      { version: "3.3.2", users: 58, crash_free_pct: 98.9 },
    ],
  }
}

export function demoLaunchAnalytics<T>(filters: LaunchAnalyticsFilters): AnalyticsResponse<T> {
  const days = enumerateDays(filters.startDate, filters.endDate)
  const data =
    filters.section === "acquisition"
      ? acquisitionData(days)
      : filters.section === "activation"
        ? activationData()
        : filters.section === "retention"
          ? retentionData(days)
          : filters.section === "engagement"
            ? engagementData(days)
            : reliabilityData(days)
  return {
    section: filters.section,
    generatedAt: isoNow(),
    data: data as T,
  }
}

export function demoRecentActivations(filters: RecentActivationFilters): RecentActivationResponse {
  const start = [filters.startDate, "T12:00:00.000Z"].join("")
  const steps = [
    "First open",
    "Onboarding start",
    "Onboarding complete",
    "Sign up / login",
    "First garment",
    "Wardrobe ready",
    "Outfit created",
    "Wear confirmed",
  ]
  const journeys = Array.from({ length: Math.min(filters.limit, 8) }, (_, index) => {
    const user = demoUsers[index * 3 % demoUsers.length]
    const stepIndex = 2 + (index % 6)
    const identified = index % 3 !== 0
    return {
      journeyId: `demo-journey-${index + 1}`,
      anonymousLabel: `Demo ziyaretçi ${index + 1}`,
      profile: identified
        ? {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: null,
          }
        : null,
      firstOpenAt: new Date(new Date(start).getTime() + index * DAY).toISOString(),
      lastEventAt: new Date(new Date(start).getTime() + index * DAY + 3_600_000).toISOString(),
      platform: index % 2 === 0 ? "iOS" : "Android",
      appVersion: "3.4.0",
      language: "tr",
      notificationStatus: index % 2 === 0 ? "granted" : "denied",
      acquisitionSource: ["organic", "referral", "paid"][index % 3],
      acquisitionMedium: ["store_search", "share_link", "campaign"][index % 3],
      currentStep: {
        order: stepIndex + 1,
        name: steps[stepIndex],
      },
      status: (index % 4 === 0 ? "dropped" : index % 3 === 0 ? "in_progress" : "completed") as "dropped" | "in_progress" | "completed",
      events: steps.slice(0, stepIndex + 1).map((name, eventIndex) => ({
        eventName: name.toLowerCase().replace(/[^a-z]+/g, "_"),
        label: name,
        occurredAt: new Date(
          new Date(start).getTime() + index * DAY + eventIndex * 600_000,
        ).toISOString(),
        step: eventIndex + 1,
        stepName: name,
        outcome: (eventIndex === 1 && index % 5 === 0 ? "failure" : "success") as "failure" | "success",
      })),
    }
  })
  return { dataThrough: isoNow(), journeys }
}

export function demoDailyActiveUsers(filters: DailyActiveUserFilters): DailyActiveUsersResponse {
  const users = demoUsers.slice(0, 14).map((user, index) => ({
    activityId: `demo-activity-${index + 1}`,
    anonymousLabel: `Demo oturum ${index + 1}`,
    profile:
      index % 4 === 0
        ? null
        : {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: null,
          },
    firstSessionAt: `${filters.date}T08:10:00.000Z`,
    lastSessionAt: `${filters.date}T18:${String(10 + index).padStart(2, "0")}:00.000Z`,
    platform: index % 2 === 0 ? "iOS" : "Android",
    appVersion: "3.4.0",
  }))
  return {
    date: filters.date,
    totalUsers: users.length,
    identifiedUsers: users.filter((user) => user.profile).length,
    anonymousUsers: users.filter((user) => !user.profile).length,
    users,
  }
}

let demoMarketSnapshotRows: MarketSnapshot[] = [
  { id: "demo-market-1", weekStart: dateOnly(-14), platform: "IOS", impressions: 42000, installs: 1800 },
  { id: "demo-market-2", weekStart: dateOnly(-7), platform: "ANDROID", impressions: 51000, installs: 2400 },
  { id: "demo-market-3", weekStart: dateOnly(0), platform: "IOS", impressions: 39000, installs: 1700 },
]

const initialDemoMarketSnapshots = clone(demoMarketSnapshotRows)
const initialDemoLocations = clone(demoLocations)

export function demoMarketSnapshots(startDate: string, endDate: string) {
  return clone(
    demoMarketSnapshotRows.filter(
      (item) => item.weekStart >= startDate && item.weekStart <= endDate,
    ),
  )
}

export function demoUpsertMarketSnapshot(
  snapshot: Omit<MarketSnapshot, "id">,
): { id: string } {
  const existing = demoMarketSnapshotRows.find(
    (item) =>
      item.weekStart === snapshot.weekStart && item.platform === snapshot.platform,
  )
  if (existing) {
    existing.impressions = snapshot.impressions
    existing.installs = snapshot.installs
    return { id: existing.id }
  }
  const created = {
    ...snapshot,
    id: `demo-market-${demoMarketSnapshotRows.length + 1}`,
  }
  demoMarketSnapshotRows = [created, ...demoMarketSnapshotRows]
  return { id: created.id }
}

let demoGooglePlaySyncedAt: string | null = dayIso(-1)

export function demoGooglePlay(startDate: string, endDate: string): GooglePlayAnalyticsData {
  const days = enumerateDays(startDate, endDate)
  return {
    daily: days.map((date, index) => ({
      date,
      visitors: 420 + ((index * 31) % 180),
      acquisitions: 58 + ((index * 7) % 40),
      dailyUserInstalls: 62 + ((index * 5) % 35),
      dailyUserUninstalls: 8 + (index % 6),
      activeDeviceInstalls: 1800 + index * 11,
    })),
    totals: {
      visitors: 12400,
      acquisitions: 1860,
      installs: 1932,
      uninstalls: 214,
      conversionRate: 0.15,
    },
    sources: [
      { name: "Play search", visitors: 6200, acquisitions: 980 },
      { name: "Play explore", visitors: 3900, acquisitions: 540 },
      { name: "External referral", visitors: 2300, acquisitions: 340 },
    ],
    countries: [
      { name: "TR", visitors: 7800, acquisitions: 1180 },
      { name: "DE", visitors: 2100, acquisitions: 260 },
      { name: "NL", visitors: 1400, acquisitions: 190 },
    ],
    integration: { dataThrough: endDate, lastSyncAt: demoGooglePlaySyncedAt, status: "demo" },
  }
}

export function demoSyncGooglePlay() {
  demoGooglePlaySyncedAt = isoNow()
  return { fileCount: 7, recordCount: 210, dataThrough: dateOnly(-1) }
}

let demoAppStoreSyncedAt: string | null = dayIso(-2)

export function demoAppStore(startDate: string, endDate: string): AppStoreAnalyticsData {
  const days = enumerateDays(startDate, endDate)
  return {
    daily: days.map((date, index) => ({
      date,
      impressions: 3800 + ((index * 73) % 900),
      uniqueImpressions: 2900 + ((index * 61) % 700),
      productPageViews: 940 + ((index * 17) % 320),
      downloads: 96 + ((index * 7) % 44),
      firstTimeDownloads: 84 + ((index * 5) % 36),
      redownloads: 12 + (index % 9),
    })),
    totals: {
      impressions: 118000,
      uniqueImpressions: 92000,
      productPageViews: 31200,
      downloads: 3210,
      firstTimeDownloads: 2840,
      redownloads: 370,
      conversionRate: 0.027,
    },
    sources: [
      { name: "App Store search", impressions: 52000, uniqueImpressions: 40000, productPageViews: 14200, downloads: 1480, firstTimeDownloads: 1300, redownloads: 180 },
      { name: "App Store browse", impressions: 39000, uniqueImpressions: 31000, productPageViews: 10800, downloads: 1080, firstTimeDownloads: 960, redownloads: 120 },
      { name: "Web referrer", impressions: 27000, uniqueImpressions: 21000, productPageViews: 6200, downloads: 650, firstTimeDownloads: 580, redownloads: 70 },
    ],
    countries: [
      { name: "TR", impressions: 68000, downloads: 1880 },
      { name: "DE", impressions: 22000, downloads: 640 },
      { name: "NL", impressions: 16000, downloads: 430 },
    ],
    integration: { dataThrough: endDate, lastSyncAt: demoAppStoreSyncedAt, status: "demo", instanceCount: 1 },
  }
}

export function demoSyncAppStore() {
  demoAppStoreSyncedAt = isoNow()
  return {
    instanceCount: 1,
    newInstanceCount: 0,
    recordCount: 210,
    dataThrough: dateOnly(-1),
  }
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export function demoDashboardAnalytics(
  rangeDays: DashboardRangeDays,
  access: DashboardAccess,
): DashboardStats {
  const range = createDateRange(rangeDays)
  const newUsers = access.users
    ? demoUsers.filter((user) => inRange(user.createdAt, range))
    : []
  const transactions = access.billing ? demoCreditTransactions(100) : []
  const media = demoMediaAnalytics()
  const analyticsData = demoAnalyticsData(range)
  const plans = demoPlanCounts()
  const rangeTransactions = analyticsData.creditTransactions
  const creditSpend = rangeTransactions.filter((transaction) =>
    isCreditSpend(transaction.type, transaction.amount),
  )
  const creditLoad = rangeTransactions.filter((transaction) =>
    isCreditLoad(transaction.type, transaction.amount),
  )
  const activeUserIds = unionUniqueUserIds(
    rangeTransactions.map((transaction) => transaction.userId),
    analyticsData.wardrobeItems.map((item) => item.userId),
    analyticsData.savedResults.map((item) => item.userId),
    analyticsData.savedPhotos.map((item) => item.userId),
  )
  const operationCounts = transactions.reduce<Record<string, number>>(
    (acc, transaction) => {
      if (transaction.operation) {
        acc[transaction.operation] = (acc[transaction.operation] ?? 0) + 1
      }
      return acc
    },
    {},
  )
  const userTrendData = bucketByGranularity(
    demoUsers
      .filter((user) => inRange(user.createdAt, range))
      .map((user) => new Date(user.createdAt).getTime()),
    (createdAt) => new Date(createdAt),
    range,
  )
  const creditBuckets = dualBucketByGranularity(
    rangeTransactions,
    (transaction) => (transaction.createdAt ? new Date(transaction.createdAt) : null),
    (transaction) => isCreditSpend(transaction.type, transaction.amount),
    (transaction) => isCreditLoad(transaction.type, transaction.amount),
    range,
  )
  const savedResultsBuckets = bucketByGranularity(
    analyticsData.savedResults,
    (item) => new Date(String(item.createdAt)),
    range,
  )
  const savedPhotosBuckets = bucketByGranularity(
    analyticsData.savedPhotos,
    (item) => new Date(String(item.createdAt)),
    range,
  )
  const wishlistBuckets = bucketByGranularity(
    analyticsData.wishlist,
    (item) => new Date(String(item.createdAt)),
    range,
  )
  const calendarBuckets = bucketByGranularity(
    analyticsData.calendar,
    (item) => new Date(String(item.createdAt)),
    range,
  )
  const totalWardrobeItems = demoCollectionCounts(["wardrobe"]).wardrobe

  return {
    range,
    metrics: {
      totalUsers: demoUsers.length,
      newUsers: newUsers.length,
      activeUsers: activeUserIds.size,
      creditSpend: creditSpend.reduce((sum, item) => sum + Math.abs(item.amount), 0),
      creditLoad: creditLoad.reduce((sum, item) => sum + Math.abs(item.amount), 0),
      activeSubscriptions: access.revenue ? demoActiveSubscriptionCount() : null,
      totalBlogPosts: Math.max(media.summary.totalPosts, media.posts.length),
      totalWardrobeItems,
      estimatedCac: null,
    },
    userTrendData,
    creditTrendData: creditBuckets.map((bucket) => ({
      date: bucket.date,
      spend: bucket.a,
      load: bucket.b,
    })),
    subscriptionDistribution: access.revenue
      ? [
          { name: "Free", value: plans.free, color: CHART_COLORS.gray },
          { name: "Pro", value: plans.pro, color: CHART_COLORS.primary },
          { name: "Premium", value: plans.premium, color: CHART_COLORS.black },
          ...(plans.unassigned > 0
            ? [{ name: "Plan yok", value: plans.unassigned, color: CHART_COLORS.amber }]
            : []),
        ]
      : null,
    creditOperationData: Object.entries(operationCounts)
      .map(([name, count]) => ({
        name,
        label: getOperationLabel(name),
        cost: getDefaultOperationCost(name),
        count,
      }))
      .sort((left, right) => right.count - left.count),
    aiOutputTrendData: savedResultsBuckets.map((bucket, index) => ({
      date: bucket.date,
      savedResults: bucket.count,
      savedPhotos: savedPhotosBuckets[index]?.count ?? 0,
      wishlist: wishlistBuckets[index]?.count ?? 0,
      calendar: calendarBuckets[index]?.count ?? 0,
    })),
    appConfigSummary: {
      apiLimits: demoConfig.apiLimits as unknown as DashboardStats["appConfigSummary"]["apiLimits"],
      appVersion: demoConfig.appVersion as unknown as DashboardStats["appConfigSummary"]["appVersion"],
      dwKvkkVersion: demoConfig.dwKvkkVersion as unknown as DashboardStats["appConfigSummary"]["dwKvkkVersion"],
      weatherTimeSlots: demoConfig.weatherTimeSlots as unknown as DashboardStats["appConfigSummary"]["weatherTimeSlots"],
    },
    newUserProfiles: newUsers.slice(0, 8).map((user) => ({
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      createdAt: user.createdAt,
      platform: user.platform,
      appVersion: user.appVersion,
      subscription: user.subscription,
    })),
    recentActivities: transactions.slice(0, 8).map((transaction) => ({
      id: transaction.id,
      type: transaction.operation
        ? getOperationLabel(transaction.operation)
        : transaction.type,
      user: transaction.displayName || transaction.userId.slice(0, 8),
      amount: transaction.amount,
      date: transaction.createdAt,
      status: isCreditSpend(transaction.type, transaction.amount)
        ? "Spend"
        : isCreditLoad(transaction.type, transaction.amount)
          ? "Load"
          : transaction.type,
    })),
  }
}

/* -------------------------------------------------------------------------- */
/* Test helper                                                                */
/* -------------------------------------------------------------------------- */

/** Restore the module to its initial synthetic state (used by tests only). */
export function resetDemoStore() {
  demoUsers = makeUsers()
  demoTeam = [
    { uid: "demo-user-01", role: "admin", email: "demo.admin@example.test", displayName: "Demo Admin", disabled: false, updatedAt: dayIso(-2) },
    { uid: "demo-user-02", role: "support", email: "demo.support@example.test", displayName: "Demo Destek", disabled: false, updatedAt: dayIso(-4) },
    { uid: "demo-user-03", role: "editor", email: "demo.editor@example.test", displayName: "Demo Editör", disabled: false, updatedAt: dayIso(-6) },
    { uid: "demo-user-04", role: "admin", email: "demo.owner@example.test", displayName: "Demo Sahip", disabled: false, updatedAt: dayIso(-9) },
  ]
  demoApiKeys = [
    makeApiKey(1),
    makeApiKey(2),
    makeApiKey(3),
    makeApiKey(4, {
      name: "Demo Legacy Partner",
      status: "revoked",
      revokedAt: dayIso(-8),
      expiresAt: dayIso(-1),
    }),
  ]
  demoCredits = makeCredits()
  demoSubscriptions = makeSubscriptions()
  demoLocations = clone(initialDemoLocations)
  demoForecasts = demoLocations.flatMap((location) =>
    Array.from({ length: 7 }, (_, offset) => makeForecast(location, offset)),
  )
  demoConfig = clone(initialDemoConfig)
  demoMarketSnapshotRows = clone(initialDemoMarketSnapshots)
  demoGooglePlaySyncedAt = dayIso(-1)
  demoAppStoreSyncedAt = dayIso(-2)
  apiKeySequence = 4
  redeemSequence = 6
  demoRedeemCodes = clone(initialDemoRedeemCodes)
  demoMediaPosts = clone(initialDemoMediaPosts)
}
