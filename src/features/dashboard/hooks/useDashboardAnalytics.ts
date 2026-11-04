import { queryOptions, useQuery } from "@tanstack/react-query"

import { roleCan, type ConsoleRole } from "../../../lib/auth/permissions"
import { useAuth } from "../../auth/useAuth"
import { fetchDashboardAnalytics } from "../services/dashboardService"
import type { DashboardAccess, DashboardRangeDays } from "../types"

export const dashboardQueryOptions = (rangeDays: DashboardRangeDays, access: DashboardAccess) =>
  queryOptions({
    queryKey: ["admin", "dashboard", rangeDays, access],
    queryFn: () => fetchDashboardAnalytics(rangeDays, access),
    staleTime: 60_000,
  })

export function useDashboardAccess(): DashboardAccess {
  const { consoleRole } = useAuth()
  return dashboardAccessFor(consoleRole)
}

export function dashboardAccessFor(role: ConsoleRole | null): DashboardAccess {
  return {
    users: roleCan(role, "users.read"),
    billing: roleCan(role, "users.billing.read"),
    revenue: roleCan(role, "revenue.read"),
  }
}

export function useDashboardAnalytics(rangeDays: DashboardRangeDays = 7) {
  return useQuery(dashboardQueryOptions(rangeDays, useDashboardAccess()))
}
