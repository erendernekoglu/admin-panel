import { adminRequest } from "../../../lib/api/client"
import { demoMediaAnalytics } from "../../demo/store"
import type { DateRange } from "../../analytics/types"
import type { MediaAnalyticsResponse } from "../types"

export async function fetchMediaAnalytics(
  range?: DateRange,
): Promise<MediaAnalyticsResponse> {
  const payload = {
    limit: 500,
    ...(range
      ? {
          startDate: range.since.toISOString(),
          endDate: range.until.toISOString(),
        }
      : {}),
  }

  const result = await adminRequest<MediaAnalyticsResponse>(
    "media.analytics",
    payload,
    () => demoMediaAnalytics(range),
  )

  if (
    !result ||
    !Array.isArray(result.posts) ||
    typeof result.summary !== "object" ||
    result.summary === null ||
    typeof result.sample !== "object" ||
    result.sample === null
  ) {
    throw new Error("Media analytics returned a malformed response.")
  }
  return result
}

export async function fetchBlogPosts(range?: DateRange) {
  return (await fetchMediaAnalytics(range)).posts
}
