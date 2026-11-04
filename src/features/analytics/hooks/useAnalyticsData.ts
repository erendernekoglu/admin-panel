import { useQuery } from "@tanstack/react-query"

import { createDateRange } from "../../../lib/analytics/analyticsUtils"
import { fetchAnalyticsData } from "../services/analyticsService"
import type { DateRange } from "../types"

export function useAnalyticsData(range: DateRange = createDateRange(7)) {
  return useQuery({
    queryKey: [
      "admin",
      "analytics",
      "operational",
      range.since.toISOString(),
      range.until.toISOString(),
      range.granularity,
    ],
    queryFn: () => fetchAnalyticsData(range),
    staleTime: 60_000,
  })
}
