/**
 * Synthetic, memory-only demo state.
 *
 * Nothing here is real customer data and nothing leaves the browser. A full
 * page reload rebuilds this module and therefore resets every mutation.
 *
 * The store starts empty: every business dataset is an empty collection and
 * every aggregate is zero. Local mutations (creating a key, a redeem code or a
 * market snapshot, updating a config group) are kept so the screens remain
 * demonstrable, but nothing is pre-seeded and no usage, weather, sync or metric
 * data is invented.
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
} from "../analytics/types"
import type { CreditTransaction } from "../credits/types"
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
import type { AdminUser } from "../users/types"
import type { WardrobeAnalyticsData } from "../wardrobe/types"
import type { WeatherForecast, WeatherLocation } from "../weather/types"
import { clone, isoNow, toIsoString } from "../shared/format"

/**
 * The preview console has a generic actor identity, but it is deliberately not
 * a user or team row. Other demo surfaces may reuse this id instead of
 * inventing a person.
 */
export const PREVIEW_ACTOR_UID = "preview-admin"

const CONFIG_OWNER = PREVIEW_ACTOR_UID

function inRange(value: unknown, range: DateRange) {
  const date = toIsoString(value)
  if (!date) return false
  const time = new Date(date).getTime()
  return time >= range.since.getTime() && time <= range.until.getTime()
}

function assertDateRange(startDate: string, endDate: string) {
  if (!startDate || !endDate) {
    throw new Error("A date range is required.")
  }
}

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */

let demoUsers: AdminUser[] = []

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
  if (input.uid === PREVIEW_ACTOR_UID) {
    throw new Error("You cannot delete your own preview console account.")
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

let demoTeam: DemoTeamMember[] = []

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

  if (input.uid === PREVIEW_ACTOR_UID && input.role !== "admin") {
    throw new Error("You cannot demote or remove your own preview console role.")
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

let apiKeySequence = 0

let demoApiKeys: ApiKey[] = []

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
    createdBy: PREVIEW_ACTOR_UID,
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
  const graceEndsAt = new Date(Date.now() + 7 * 86_400_000).toISOString()
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

/**
 * Usage counters are never fabricated in local mode. A known key therefore
 * reports an empty series rather than a synthetic traffic curve.
 */
export function demoApiKeyUsage(
  keyId: string,
  startDate: string,
  endDate: string,
): ApiKeyUsageDay[] {
  if (!demoApiKeys.some((item) => item.keyId === keyId)) {
    throw new Error("API key was not found.")
  }
  assertDateRange(startDate, endDate)
  return []
}

/* -------------------------------------------------------------------------- */
/* App config                                                                 */
/* -------------------------------------------------------------------------- */

function configMetadata() {
  return { updatedAt: null, updatedBy: null }
}

let demoConfig: Record<AppConfigKey, Record<string, unknown>> = {
  creditCosts: {
    ANALYZE_CLOTHING: 0,
    ANALYZE_OUTFIT: 0,
    CREATE_COMBINATION: 0,
    WEATHER_OUTFIT_SUGGESTION: 0,
    REMOVE_BACKGROUND: 0,
    VIRTUAL_TRY_ON: 0,
    CREATE_AVATAR: 0,
    CABIN_AI_ADVICE: 0,
    CABIN_BULK_REVIEW: 0,
    ...configMetadata(),
  },
  planCredits: {
    free: { name: "Free", initialCredits: 0, monthlyCredits: 0 },
    pro: { name: "Pro", initialCredits: 0, monthlyCredits: 0 },
    premium: { name: "Premium", initialCredits: 0, monthlyCredits: 0 },
    ...configMetadata(),
  },
  planLimits: {
    free: { maxWardrobeItems: 0, maxSavedCombinations: 0 },
    pro: { maxWardrobeItems: 0, maxSavedCombinations: 0 },
    premium: { maxWardrobeItems: 0, maxSavedCombinations: 0 },
    ...configMetadata(),
  },
  apiLimits: {
    gemini: { enabled: false, disabledAt: null, disabledReason: null, message: null },
    openai: { enabled: false, disabledAt: null, disabledReason: null, message: null },
    weather: { enabled: false, disabledAt: null, disabledReason: null, message: null },
    payment: { enabled: false, disabledAt: null, disabledReason: null, message: null },
    ...configMetadata(),
  },
  prompts: {
    analyzeClothing: "",
    analyzeOutfitStyle: "",
    virtualTryOn: "",
    removeBackground: "",
    createAvatar: "",
    ...configMetadata(),
  },
  weatherTimeSlots: {
    morning: { start: 6, end: 11 },
    noon: { start: 11, end: 15 },
    evening: { start: 15, end: 20 },
    night: { start: 20, end: 6 },
    ...configMetadata(),
  },
  dwKvkkVersion: {
    currentVersion: "",
    ...configMetadata(),
  },
  appVersion: {
    latestVersion: "",
    ...configMetadata(),
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

let demoCredits: CreditTransaction[] = []

export function demoCreditTransactions(limitCount = 50) {
  return clone(demoCredits.slice(0, Math.max(0, limitCount)))
}

export function demoCreditTransactionsInRange(range: DateRange) {
  return clone(demoCredits.filter((item) => inRange(item.createdAt, range)))
}

let demoSubscriptions: SubscriptionRecord[] = []

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

export function demoAuditLogs(): AuditLogsResponse {
  const logs: AuditLog[] = []
  return {
    logs,
    sample: { limit: 200, truncated: false },
    note: "No audit log records yet.",
  }
}

/* -------------------------------------------------------------------------- */
/* Operational analytics and wardrobe                                         */
/* -------------------------------------------------------------------------- */

export function demoOperationalData(range: DateRange) {
  return {
    creditTransactions: demoCreditTransactionsInRange(range),
    wardrobe: [],
    savedResults: [],
    savedPhotos: [],
    wishlist: [],
    calendar: [],
  }
}

export function demoCollectionCounts(collectionNames: string[]) {
  return Object.fromEntries(collectionNames.map((name) => [name, 0]))
}

export function demoWardrobeItems(
  limitCount = 500,
): WardrobeAnalyticsData["items"] {
  if (limitCount <= 0) return []
  return []
}

export function demoWardrobeAnalytics(
  range: DateRange,
  canReadUsers: boolean,
): WardrobeAnalyticsData {
  return {
    range,
    users: [],
    activeWardrobeUsers: canReadUsers ? 0 : null,
    items: [],
    newItems: [],
    savedResults: [],
    savedPhotos: [],
    wishlist: [],
    calendar: [],
    counts: {
      wardrobe: 0,
      savedResults: 0,
      savedPhotos: 0,
      wishlist: 0,
      calendar: 0,
    },
  }
}

export function demoAnalyticsData(range: DateRange): AnalyticsData {
  const operational = demoOperationalData(range)
  return {
    creditTransactions: operational.creditTransactions,
    wardrobeItems: operational.wardrobe,
    savedResults: operational.savedResults,
    savedPhotos: operational.savedPhotos,
    wishlist: operational.wishlist,
    calendar: operational.calendar,
  }
}

/* -------------------------------------------------------------------------- */
/* Media                                                                      */
/* -------------------------------------------------------------------------- */

export function demoMediaAnalytics(range?: DateRange): MediaAnalyticsResponse {
  const posts: BlogPost[] = []
  const filtered = range
    ? posts.filter((post) => inRange(post.publishedAt ?? post.createdAt, range))
    : posts
  return {
    posts: clone(filtered),
    summary: {
      totalPosts: 0,
      totalComments: 0,
      totalFollows: 0,
      totalNotifications: 0,
    },
    sample: { limit: 500, truncated: false },
  }
}

/* -------------------------------------------------------------------------- */
/* Weather                                                                    */
/* -------------------------------------------------------------------------- */

let demoLocations: WeatherLocation[] = []
let demoForecasts: WeatherForecast[] = []

export function demoWeatherLocations() {
  return clone(demoLocations)
}

export function demoWeatherForecasts(cutoffDate?: string) {
  return clone(
    cutoffDate
      ? demoForecasts.filter((forecast) => forecast.date >= cutoffDate)
      : demoForecasts,
  )
}

export function demoSyncWeatherLocations(input: { consolePassword: string }): never {
  assertDemoPassword(input.consolePassword)
  throw new Error(
    "Weather location synchronization is unavailable in local preview mode; it requires the connected API.",
  )
}

export function demoTriggerWeatherUpdate(input: { consolePassword: string }): never {
  assertDemoPassword(input.consolePassword)
  throw new Error(
    "Weather updates are unavailable in local preview mode; they require the connected API.",
  )
}

/* -------------------------------------------------------------------------- */
/* Redeem codes                                                               */
/* -------------------------------------------------------------------------- */

let redeemSequence = 0
let demoRedeemCodes: RedeemCode[] = []

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
    createdByAdminId: PREVIEW_ACTOR_UID,
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

function emptyAcquisitionData(): AcquisitionData {
  return { daily: [], sources: [], platforms: [] }
}

function emptyActivationData(): ActivationData {
  return { funnel: [], onboarding: [], segments: [], summary: null }
}

function emptyRetentionData(): RetentionData {
  return { cohorts: [], curve: [], habit: [], properties: [], stickiness: [] }
}

function emptyEngagementData(): EngagementData {
  return {
    features: [],
    outfitSources: [],
    ai: [],
    dailyWear: [],
    rejections: [],
    funnels: [],
    errors: [],
  }
}

function emptyReliabilityData(): ReliabilityData {
  return {
    daily: [],
    issues: [],
    attributes: [],
    auth: [],
    firstSession: [],
  }
}

export function demoLaunchAnalytics<T>(filters: LaunchAnalyticsFilters): AnalyticsResponse<T> {
  const data =
    filters.section === "acquisition"
      ? emptyAcquisitionData()
      : filters.section === "activation"
        ? emptyActivationData()
        : filters.section === "retention"
          ? emptyRetentionData()
          : filters.section === "engagement"
            ? emptyEngagementData()
            : emptyReliabilityData()
  return {
    section: filters.section,
    generatedAt: isoNow(),
    data: data as T,
  }
}

export function demoRecentActivations(filters: RecentActivationFilters): RecentActivationResponse {
  assertDateRange(filters.startDate, filters.endDate)
  return { dataThrough: null, journeys: [] }
}

export function demoDailyActiveUsers(filters: DailyActiveUserFilters): DailyActiveUsersResponse {
  return {
    date: filters.date,
    totalUsers: 0,
    identifiedUsers: 0,
    anonymousUsers: 0,
    users: [],
  }
}

let demoMarketSnapshotRows: MarketSnapshot[] = []

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

export function demoGooglePlay(startDate: string, endDate: string): GooglePlayAnalyticsData {
  assertDateRange(startDate, endDate)
  return {
    daily: [],
    totals: {
      visitors: 0,
      acquisitions: 0,
      installs: 0,
      uninstalls: 0,
      conversionRate: 0,
    },
    sources: [],
    countries: [],
    integration: { lastSyncAt: null, status: "demo" },
  }
}

export function demoSyncGooglePlay() {
  return { fileCount: 0, recordCount: 0, dataThrough: null }
}

export function demoAppStore(startDate: string, endDate: string): AppStoreAnalyticsData {
  assertDateRange(startDate, endDate)
  return {
    daily: [],
    totals: {
      impressions: 0,
      uniqueImpressions: 0,
      productPageViews: 0,
      downloads: 0,
      firstTimeDownloads: 0,
      redownloads: 0,
      conversionRate: 0,
    },
    sources: [],
    countries: [],
    integration: { lastSyncAt: null, status: "demo", instanceCount: 0 },
  }
}

export function demoSyncAppStore() {
  return {
    instanceCount: 0,
    newInstanceCount: 0,
    recordCount: 0,
    dataThrough: null,
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

/** Restore the module to its empty initial state (used by tests only). */
export function resetDemoStore() {
  demoUsers = []
  demoTeam = []
  demoApiKeys = []
  demoCredits = []
  demoSubscriptions = []
  demoLocations = []
  demoForecasts = []
  demoConfig = clone(initialDemoConfig)
  demoMarketSnapshotRows = []
  demoRedeemCodes = []
  apiKeySequence = 0
  redeemSequence = 0
}
