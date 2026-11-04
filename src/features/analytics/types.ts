import type { CreditTransaction } from "../credits/types"

export type Granularity = "hour" | "day" | "week"

export interface DateRange {
  since: Date
  until: Date
  granularity: Granularity
}

export interface BucketPoint {
  date: string
  dateObj: Date
  count: number
}

export interface DualBucketPoint extends BucketPoint {
  a: number
  b: number
}

export interface SubcollectionTimelineItem {
  id: string
  userId?: string
  createdAt: unknown
  [key: string]: unknown
}

export interface WardrobeItem {
  id: string
  userId?: string
  category: string
  createdAt: unknown
}

export interface AnalyticsData {
  creditTransactions: CreditTransaction[]
  wardrobeItems: WardrobeItem[]
  savedResults: SubcollectionTimelineItem[]
  savedPhotos: SubcollectionTimelineItem[]
  wishlist: SubcollectionTimelineItem[]
  calendar: SubcollectionTimelineItem[]
}

export type AnalyticsSection =
  | "acquisition"
  | "activation"
  | "retention"
  | "engagement"
  | "reliability"

export type AnalyticsPlatform = "ANDROID" | "IOS"
export type NotificationStatus = "granted" | "denied" | "undetermined"

export interface LaunchAnalyticsFilters {
  section: AnalyticsSection
  startDate: string
  endDate: string
  platform: AnalyticsPlatform | null
  language: "tr" | "en" | null
  notificationStatus: NotificationStatus | null
}

export interface AnalyticsResponse<T = Record<string, unknown>> {
  section: AnalyticsSection
  generatedAt: string
  data: T
}

export interface AcquisitionData {
  daily: Array<{
    d: string
    new_users: number
    dau: number
    wau: number
    mau: number
    provisional: boolean
  }>
  sources: Array<{
    source: string
    medium: string
    new_users: number
    d1_retention_pct: number | null
  }>
  platforms: Array<{ platform: string; users: number }>
}

export interface ActivationData {
  funnel: Array<{
    step_order: number
    step_name: string
    users: number
    conversion_pct: number
  }>
  onboarding: Array<{
    step: number
    name: string
    users: number
    remaining_pct: number
    dropoff_pct: number
  }>
  segments: Array<{
    segment_type: string
    segment_value: string
    users: number
    activated_users: number
    activation_pct: number
  }>
  summary: {
    p50_minutes: number | null
    p90_minutes: number | null
    within_10_min_pct: number | null
    starter_skip_pct: number | null
    notification_allow_pct: number | null
  } | null
}

export type ActivationJourneyStatus = "in_progress" | "dropped" | "completed"

export interface ActivationJourneyEvent {
  eventName: string
  label: string
  occurredAt: string
  step: number | null
  stepName: string | null
  outcome: "success" | "failure" | "neutral"
}

export interface ActivationJourney {
  journeyId: string
  anonymousLabel: string
  profile: {
    uid: string
    displayName: string | null
    email: string | null
    photoURL: string | null
  } | null
  firstOpenAt: string | null
  lastEventAt: string
  platform: string | null
  appVersion: string | null
  language: string | null
  notificationStatus: string | null
  acquisitionSource: string | null
  acquisitionMedium: string | null
  currentStep: {
    order: number
    name: string
  }
  status: ActivationJourneyStatus
  events: ActivationJourneyEvent[]
}

export interface RecentActivationFilters {
  startDate: string
  endDate: string
  platform: AnalyticsPlatform | null
  language: "tr" | "en" | null
  notificationStatus: NotificationStatus | null
  limit: number
}

export interface RecentActivationResponse {
  dataThrough: string | null
  journeys: ActivationJourney[]
}

export interface DailyActiveUserFilters {
  date: string
  platform: AnalyticsPlatform | null
  language: "tr" | "en" | null
  notificationStatus: NotificationStatus | null
  limit: number
}

export interface DailyActiveUser {
  activityId: string
  anonymousLabel: string
  profile: {
    uid: string
    displayName: string | null
    email: string | null
    photoURL: string | null
  } | null
  firstSessionAt: string | null
  lastSessionAt: string | null
  platform: string | null
  appVersion: string | null
}

export interface DailyActiveUsersResponse {
  date: string
  totalUsers: number
  identifiedUsers: number
  anonymousUsers: number
  users: DailyActiveUser[]
}

export interface RetentionData {
  cohorts: Array<{
    cohort_date: string
    day_n: number
    cohort_size: number
    returning_users: number
    retention_pct: number | null
    is_mature: boolean
  }>
  curve: Array<{
    segment: string
    day_n: number
    segment_size: number
    returning_users: number
    retention_pct: number
  }>
  habit: Array<{
    cohort_date: string
    cohort_size: number
    habit_users: number
    habit_rate_pct: number | null
    is_mature: boolean
  }>
  properties: Array<{
    property_name: string
    property_value: string
    cohort_size: number
    d7_retention_pct: number | null
  }>
  stickiness: Array<{
    d: string
    dau: number
    mau: number
    stickiness_pct: number
  }>
}

export interface EngagementData {
  features: Array<Record<string, string | number | null>>
  outfitSources: Array<Record<string, string | number>>
  ai: Array<Record<string, string | number | null>>
  dailyWear: Array<{ d: string; users: number }>
  rejections: Array<Record<string, string | number>>
  funnels: Array<Record<string, string | number>>
  errors: Array<Record<string, string | number>>
}

export interface ReliabilityData {
  daily: Array<Record<string, string | number | null>>
  issues: Array<Record<string, string | number | null>>
  attributes: Array<Record<string, string | number>>
  auth: Array<Record<string, string | number>>
  firstSession: Array<Record<string, string | number | null>>
}

export interface MarketSnapshot {
  id: string
  weekStart: string
  platform: AnalyticsPlatform
  impressions: number
  installs: number
}

export interface GooglePlayAnalyticsData {
  daily: Array<{
    date: string
    visitors: number
    acquisitions: number
    dailyUserInstalls: number
    dailyUserUninstalls: number
    activeDeviceInstalls: number
  }>
  totals: {
    visitors: number
    acquisitions: number
    installs: number
    uninstalls: number
    conversionRate: number
  }
  sources: Array<{ name: string; visitors: number; acquisitions: number }>
  countries: Array<{ name: string; visitors: number; acquisitions: number }>
  integration: {
    dataThrough?: string
    lastSyncAt?: unknown
    status?: string
  } | null
}

export interface AppStoreAnalyticsData {
  daily: Array<{
    date: string
    impressions: number
    uniqueImpressions: number
    productPageViews: number
    downloads: number
    firstTimeDownloads: number
    redownloads: number
  }>
  totals: {
    impressions: number
    uniqueImpressions: number
    productPageViews: number
    downloads: number
    firstTimeDownloads: number
    redownloads: number
    conversionRate: number
  }
  sources: Array<{
    name: string
    impressions: number
    uniqueImpressions: number
    productPageViews: number
    downloads: number
    firstTimeDownloads: number
    redownloads: number
  }>
  countries: Array<{
    name: string
    impressions: number
    downloads: number
  }>
  integration: {
    dataThrough?: string
    lastSyncAt?: unknown
    status?: string
    instanceCount?: number
  } | null
}
