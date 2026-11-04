import type { BucketPoint, DateRange } from "../analytics/types"
import type {
  ApiLimitsConfig,
  AppVersionConfig,
  DwKvkkVersionConfig,
  WeatherTimeSlotsConfig,
} from "../app-config/types"

export type DashboardRangeDays = 1 | 7 | 30 | 90

export interface DashboardActivity {
  id: string
  type: string
  user: string
  amount?: number
  date: string
  status: string
}

export interface DashboardNewUser {
  uid: string
  displayName: string
  email: string
  photoURL?: string
  createdAt: unknown
  platform?: string
  appVersion?: string
  subscription: string
}

export interface DashboardMetric {
  label: string
  value: number | string
  helper?: string
  trend?: string
}

export interface DashboardDistributionPoint {
  name: string
  value: number
  color: string
}

export interface DashboardCreditTrendPoint {
  date: string
  spend: number
  load: number
}

export interface DashboardAiTrendPoint {
  date: string
  savedResults: number
  savedPhotos: number
  wishlist: number
  calendar: number
}

export interface DashboardAppConfigSummary {
  apiLimits: ApiLimitsConfig | null
  appVersion: AppVersionConfig | null
  dwKvkkVersion: DwKvkkVersionConfig | null
  weatherTimeSlots: WeatherTimeSlotsConfig | null
}

/** Which role-restricted sources the overview may include. */
export interface DashboardAccess {
  /** users.read: new-user profiles. */
  users: boolean
  /** users.billing.read: individual credit transactions. */
  billing: boolean
  /** revenue.read: plan distribution and active subscriptions. */
  revenue: boolean
}

export interface DashboardStats {
  range: DateRange
  metrics: {
    totalUsers: number
    newUsers: number
    activeUsers: number
    creditSpend: number
    creditLoad: number
    /** null when the role may not read revenue. */
    activeSubscriptions: number | null
    totalBlogPosts: number
    totalWardrobeItems: number
    estimatedCac: null
  }
  userTrendData: BucketPoint[]
  creditTrendData: DashboardCreditTrendPoint[]
  /** null when the role may not read revenue. */
  subscriptionDistribution: DashboardDistributionPoint[] | null
  creditOperationData: Array<{
    name: string
    label: string
    cost: number
    count: number
  }>
  aiOutputTrendData: DashboardAiTrendPoint[]
  appConfigSummary: DashboardAppConfigSummary
  newUserProfiles: DashboardNewUser[]
  recentActivities: DashboardActivity[]
}
