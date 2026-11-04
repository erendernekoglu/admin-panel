import { useQuery } from "@tanstack/react-query"

import { fetchLaunchAnalytics } from "../services/launchAnalyticsService"
import type { AnalyticsResponse, LaunchAnalyticsFilters } from "../types"

export function useLaunchAnalytics<T>(filters: LaunchAnalyticsFilters) {
  return useQuery<AnalyticsResponse<T>>({
    queryKey: ["admin", "analytics", "launch", filters],
    queryFn: () => fetchLaunchAnalytics<T>(filters),
    staleTime: 5 * 60_000,
    retry: false,
  })
}
