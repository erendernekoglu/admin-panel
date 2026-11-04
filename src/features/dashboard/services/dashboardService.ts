import { toDate, toDateTimeString } from "../../shared/format"
import { adminRequest } from "../../../lib/api/client"
import {
  bucketByGranularity,
  createDateRange,
  dualBucketByGranularity,
  unionUniqueUserIds,
} from "../../../lib/analytics/analyticsUtils"
import {
  getDefaultOperationCost,
  getOperationLabel,
  isCreditLoad,
  isCreditSpend,
} from "../../../lib/credits/creditUtils"
import { CHART_COLORS } from "../../../lib/charts/chartTheme"

import { normalizeFunctionError } from "../../../lib/api/adminFunctions"
import {
  demoCountUsers,
  demoPlanCounts,
  demoUsersCreatedBetween,
} from "../../demo/store"
import {
  fetchUsersCreatedBetween,
  sumUserField,
} from "../../users/services/userService"
import { fetchCreditTransactions } from "../../credits/services/creditService"
import { fetchMediaAnalytics } from "../../media/services/mediaService"
import {
  fetchAnalyticsData,
  fetchCollectionGroupCount,
} from "../../analytics/services/analyticsService"
import { countActiveSubscriptions } from "../../subscriptions/services/subscriptionService"
import { fetchAppConfigGroup } from "../../app-config/services/appConfigService"
import type { DashboardAccess, DashboardRangeDays, DashboardStats } from "../types"

interface UserStats {
  total: number
  newUserCreatedAt: number[]
  /** Only for roles that may read revenue. */
  plans: { free: number; pro: number; premium: number; unassigned: number } | null
}

/**
 * Aggregate user numbers, safe for every console role (no ids or e-mails).
 * Plan counts are only included when the role may read revenue; the demo
 * callback mirrors that rule so the browser never renders a restricted slice.
 */
async function fetchUserStats(
  since: Date,
  until: Date,
  access: DashboardAccess,
): Promise<UserStats> {
  try {
    return await adminRequest<UserStats>(
      "dashboard.userStats",
      { since: since.toISOString(), until: until.toISOString() },
      () => {
        const plans = demoPlanCounts()
        return {
          total: demoCountUsers(),
          newUserCreatedAt: demoUsersCreatedBetween(since, until).map((user) =>
            new Date(user.createdAt).getTime(),
          ),
          plans: access.revenue
            ? {
                free: plans.free,
                pro: plans.pro,
                premium: plans.premium,
                unassigned: plans.unassigned,
              }
            : null,
        }
      },
    )
  } catch (error) {
    throw normalizeFunctionError(error)
  }
}

function sumAmounts(items: Array<{ amount: number }>) {
  return items.reduce((sum, item) => sum + Math.abs(item.amount), 0)
}

/**
 * Each source is fetched only when the role may read it; the server enforces
 * the same table, so asking anyway would only fail the whole overview.
 */
export async function fetchDashboardAnalytics(
  rangeDays: DashboardRangeDays,
  access: DashboardAccess,
): Promise<DashboardStats> {
  const range = createDateRange(rangeDays)

  const [
    userStats,
    newUsers,
    transactions,
    media,
    activeSubscriptions,
    analyticsData,
    totalWardrobeItems,
    apiLimits,
    appVersion,
    dwKvkkVersion,
    weatherTimeSlots,
  ] = await Promise.all([
    fetchUserStats(range.since, range.until, access),
    access.users ? fetchUsersCreatedBetween(range.since, range.until) : [],
    access.billing ? fetchCreditTransactions(100) : [],
    fetchMediaAnalytics(),
    access.revenue ? countActiveSubscriptions() : null,
    fetchAnalyticsData(range),
    fetchCollectionGroupCount("wardrobe").catch(() => 0),
    fetchAppConfigGroup("apiLimits").catch(() => null),
    fetchAppConfigGroup("appVersion").catch(() => null),
    fetchAppConfigGroup("dwKvkkVersion").catch(() => null),
    fetchAppConfigGroup("weatherTimeSlots").catch(() => null),
  ])

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

  const creditOperationData = Object.entries(operationCounts)
    .map(([name, count]) => ({
      name,
      label: getOperationLabel(name),
      cost: getDefaultOperationCost(name),
      count,
    }))
    .sort((a, b) => b.count - a.count)

  const userTrendData = bucketByGranularity(
    userStats.newUserCreatedAt,
    (createdAt) => new Date(createdAt),
    range,
  )
  const planCounts = userStats.plans
  const creditBuckets = dualBucketByGranularity(
    rangeTransactions,
    (transaction) => toDate(transaction.createdAt),
    (transaction) => isCreditSpend(transaction.type, transaction.amount),
    (transaction) => isCreditLoad(transaction.type, transaction.amount),
    range,
  )
  const savedResultsBuckets = bucketByGranularity(
    analyticsData.savedResults,
    (item) => toDate(item.createdAt),
    range,
  )
  const savedPhotosBuckets = bucketByGranularity(
    analyticsData.savedPhotos,
    (item) => toDate(item.createdAt),
    range,
  )
  const wishlistBuckets = bucketByGranularity(
    analyticsData.wishlist,
    (item) => toDate(item.createdAt),
    range,
  )
  const calendarBuckets = bucketByGranularity(
    analyticsData.calendar,
    (item) => toDate(item.createdAt),
    range,
  )

  return {
    range,
    metrics: {
      totalUsers: userStats.total,
      newUsers: userStats.newUserCreatedAt.length,
      activeUsers: activeUserIds.size,
      creditSpend: sumAmounts(creditSpend),
      creditLoad: sumAmounts(creditLoad),
      activeSubscriptions,
      // The summary counts every post; the post list is a capped sample.
      totalBlogPosts: Math.max(media.summary.totalPosts, media.posts.length),
      totalWardrobeItems:
        totalWardrobeItems ||
        (access.users ? await sumUserField("wardrobeCount").catch(() => 0) : 0),
      estimatedCac: null,
    },
    userTrendData,
    creditTrendData: creditBuckets.map((bucket) => ({
      date: bucket.date,
      spend: bucket.a,
      load: bucket.b,
    })),
    subscriptionDistribution: planCounts ? [
      { name: "Free", value: planCounts.free, color: CHART_COLORS.gray },
      { name: "Pro", value: planCounts.pro, color: CHART_COLORS.primary },
      {
        name: "Premium",
        value: planCounts.premium,
        color: CHART_COLORS.black,
      },
      // Profiles with no plan field; a slice keeps the total honest.
      ...(planCounts.unassigned > 0
        ? [{ name: "Plan yok", value: planCounts.unassigned, color: CHART_COLORS.amber }]
        : []),
    ] : null,
    creditOperationData,
    aiOutputTrendData: savedResultsBuckets.map((bucket, index) => ({
      date: bucket.date,
      savedResults: bucket.count,
      savedPhotos: savedPhotosBuckets[index]?.count ?? 0,
      wishlist: wishlistBuckets[index]?.count ?? 0,
      calendar: calendarBuckets[index]?.count ?? 0,
    })),
    appConfigSummary: {
      apiLimits,
      appVersion,
      dwKvkkVersion,
      weatherTimeSlots,
    },
    // Already newest first from the query.
    newUserProfiles: newUsers.map((user) => ({
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
      date: toDateTimeString(transaction.createdAt),
      status: isCreditSpend(transaction.type, transaction.amount)
        ? "Spend"
        : isCreditLoad(transaction.type, transaction.amount)
          ? "Load"
          : transaction.type,
    })),
  }
}
