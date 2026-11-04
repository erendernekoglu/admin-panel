import { useQuery } from "@tanstack/react-query"

import { fetchDailyActiveUsers } from "../services/launchAnalyticsService"
import type { DailyActiveUserFilters } from "../types"

export function useDailyActiveUsers(
  filters: DailyActiveUserFilters | null,
) {
  return useQuery({
    queryKey: ["admin", "analytics", "daily-active-users", filters],
    queryFn: () => fetchDailyActiveUsers(filters!),
    enabled: Boolean(filters),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
