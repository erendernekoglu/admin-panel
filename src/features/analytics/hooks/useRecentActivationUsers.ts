import { useQuery } from "@tanstack/react-query"

import { fetchRecentActivationUsers } from "../services/launchAnalyticsService"
import type { RecentActivationFilters } from "../types"

export function useRecentActivationUsers(filters: RecentActivationFilters) {
  return useQuery({
    queryKey: ["admin", "analytics", "recent-activation-users", filters],
    queryFn: () => fetchRecentActivationUsers(filters),
    staleTime: 60_000,
    retry: false,
  })
}
