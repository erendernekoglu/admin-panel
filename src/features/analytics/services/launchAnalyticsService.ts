import { adminRequest } from "../../../lib/api/client"
import { normalizeFunctionError } from "../../../lib/api/adminFunctions"
import {
  demoAppStore,
  demoCollectionCounts,
  demoDailyActiveUsers,
  demoGooglePlay,
  demoLaunchAnalytics,
  demoMarketSnapshots,
  demoOperationalData,
  demoRecentActivations,
  demoUpsertMarketSnapshot,
  demoWardrobeItems,
} from "../../demo/store"
import type {
  AnalyticsResponse,
  LaunchAnalyticsFilters,
  MarketSnapshot,
  GooglePlayAnalyticsData,
  RecentActivationFilters,
  RecentActivationResponse,
  DailyActiveUserFilters,
  DailyActiveUsersResponse,
  AppStoreAnalyticsData,
} from "../types"

/**
 * Analytics operations go through the shared admin adapter: one same-origin
 * `POST /api/admin/operations/<operation>` per call in API mode, and a local
 * synthetic callback in demo mode. Live failures are never retried with demo
 * data.
 */
export async function fetchLaunchAnalytics<T>(
  filters: LaunchAnalyticsFilters,
): Promise<AnalyticsResponse<T>> {
  try {
    return await adminRequest<AnalyticsResponse<T>>(
      "analytics.launch",
      filters,
      () => demoLaunchAnalytics<T>(filters),
    )
  } catch (error) {
    throw normalizeFunctionError(error)
  }
}

export async function fetchRecentActivationUsers(
  filters: RecentActivationFilters,
): Promise<RecentActivationResponse> {
  try {
    return await adminRequest<RecentActivationResponse>(
      "analytics.recentActivations",
      filters,
      () => demoRecentActivations(filters),
    )
  } catch (error) {
    throw normalizeFunctionError(error)
  }
}

export async function fetchDailyActiveUsers(
  filters: DailyActiveUserFilters,
): Promise<DailyActiveUsersResponse> {
  try {
    return await adminRequest<DailyActiveUsersResponse>(
      "analytics.dailyActiveUsers",
      filters,
      () => demoDailyActiveUsers(filters),
    )
  } catch (error) {
    throw normalizeFunctionError(error)
  }
}

export async function fetchMarketSnapshots(startDate: string, endDate: string) {
  try {
    return await adminRequest<MarketSnapshot[]>(
      "analytics.marketSnapshots",
      { startDate, endDate },
      () => demoMarketSnapshots(startDate, endDate),
    )
  } catch (error) {
    throw normalizeFunctionError(error)
  }
}

export async function upsertMarketSnapshot(
  snapshot: Omit<MarketSnapshot, "id">,
) {
  try {
    return await adminRequest<{ id: string }>(
      "analytics.upsertMarketSnapshot",
      snapshot,
      () => demoUpsertMarketSnapshot(snapshot),
    )
  } catch (error) {
    throw normalizeFunctionError(error)
  }
}

export async function fetchAdminCollectionCounts(collectionNames: string[]) {
  try {
    return await adminRequest<Record<string, number>>(
      "analytics.collectionCounts",
      { collectionNames },
      () => demoCollectionCounts(collectionNames),
    )
  } catch (error) {
    throw normalizeFunctionError(error)
  }
}

export async function fetchAdminOperationalAnalytics(
  startDate: Date,
  endDate: Date,
) {
  try {
    return await adminRequest<Record<string, Array<Record<string, unknown>>>>(
      "analytics.operational",
      {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      () =>
        demoOperationalData({
          since: startDate,
          until: endDate,
          granularity: "day",
        }) as unknown as Record<string, Array<Record<string, unknown>>>,
    )
  } catch (error) {
    throw normalizeFunctionError(error)
  }
}

export async function fetchAdminWardrobeItems(limit: number) {
  try {
    return await adminRequest<Array<Record<string, unknown>>>(
      "analytics.wardrobeItems",
      { limit },
      () => demoWardrobeItems(limit) as unknown as Array<Record<string, unknown>>,
    )
  } catch (error) {
    throw normalizeFunctionError(error)
  }
}

export async function fetchGooglePlayAnalytics(startDate: string, endDate: string) {
  try {
    return await adminRequest<GooglePlayAnalyticsData>(
      "analytics.googlePlay",
      { startDate, endDate },
      () => demoGooglePlay(startDate, endDate),
    )
  } catch (error) {
    throw normalizeFunctionError(error)
  }
}

/**
 * Store reports come from an external console, so demo mode cannot sync
 * anything. Reporting fabricated file counts as a successful sync would be a
 * fake remote success; the call rejects with an explicit message instead.
 */
export async function syncGooglePlayAnalytics() {
  try {
    return await adminRequest<{
      fileCount: number
      recordCount: number
      dataThrough: string | null
    }>("analytics.googlePlaySync", {}, () => {
      throw new Error(
        "Play Console report sync requires the admin API; demo mode has no external connection and nothing was synced.",
      )
    })
  } catch (error) {
    throw normalizeFunctionError(error)
  }
}

export async function fetchAppStoreAnalytics(startDate: string, endDate: string) {
  try {
    return await adminRequest<AppStoreAnalyticsData>(
      "analytics.appStore",
      { startDate, endDate },
      () => demoAppStore(startDate, endDate),
    )
  } catch (error) {
    throw normalizeFunctionError(error)
  }
}

/** See `syncGooglePlayAnalytics`: no fabricated remote success in demo mode. */
export async function syncAppStoreAnalytics() {
  try {
    return await adminRequest<{
      instanceCount: number
      newInstanceCount: number
      recordCount: number
      dataThrough: string | null
    }>("analytics.appStoreSync", {}, () => {
      throw new Error(
        "App Store report sync requires the admin API; demo mode has no external connection and nothing was synced.",
      )
    })
  } catch (error) {
    throw normalizeFunctionError(error)
  }
}
