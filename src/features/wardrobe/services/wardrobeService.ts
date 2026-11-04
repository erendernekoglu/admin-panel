import { adminRequest } from "../../../lib/api/client"
import { demoWardrobeAnalytics } from "../../demo/store"
import type { DateRange } from "../../analytics/types"
import type { WardrobeAnalyticsData } from "../types"

/**
 * `canReadUsers` (users.read) decides whether item owners are looked up. For
 * other roles the live backend replaces owner ids with pseudonyms, and the
 * demo builder returns no user records at all.
 */
export async function fetchWardrobeAnalytics(
  range: DateRange,
  canReadUsers: boolean,
): Promise<WardrobeAnalyticsData> {
  const payload = {
    startDate: range.since.toISOString(),
    endDate: range.until.toISOString(),
    canReadUsers,
  }
  return adminRequest<WardrobeAnalyticsData>("wardrobe.analytics", payload, () =>
    demoWardrobeAnalytics(range, canReadUsers),
  )
}
