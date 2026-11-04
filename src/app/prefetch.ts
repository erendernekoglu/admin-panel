import type { QueryClient } from "@tanstack/react-query"

import type { ConsoleRole } from "../lib/auth/permissions"
import { pageLoaders as pageModules } from "./routeModules"

interface RoutePrefetch {
  module: () => Promise<unknown>
  /**
   * Prefetches the query the page renders first, with the page's default
   * arguments. Hook modules are imported lazily so the sidebar does not pull
   * page services (and their chart dependencies) into the entry chunk.
   */
  queries?: (client: QueryClient, role: ConsoleRole | null) => Promise<unknown>
}

const routePrefetches: Record<string, RoutePrefetch> = {
  "/dashboard": {
    module: pageModules.dashboard,
    queries: async (client, role) => {
      const { dashboardAccessFor, dashboardQueryOptions } = await import(
        "../features/dashboard/hooks/useDashboardAnalytics"
      )
      return client.prefetchQuery(dashboardQueryOptions(7, dashboardAccessFor(role)))
    },
  },
  "/analytics": { module: pageModules.analytics },
  "/lookbook": { module: pageModules.lookbook },
  "/style-events": { module: pageModules.styleEvents },
  "/boutique": { module: pageModules.boutique },
  "/users": {
    module: pageModules.users,
    queries: async (client) => {
      const { DEFAULT_USER_FILTERS, usersCountQueryOptions, usersPageQueryOptions } =
        await import("../features/users/hooks/useUsers")
      return Promise.all([
        client.prefetchQuery(usersPageQueryOptions(DEFAULT_USER_FILTERS, 0, null)),
        client.prefetchQuery(usersCountQueryOptions(DEFAULT_USER_FILTERS)),
      ])
    },
  },
  "/wardrobe": { module: pageModules.wardrobe },
  "/media": { module: pageModules.media },
  "/weather": { module: pageModules.weather },
  "/subscriptions": { module: pageModules.subscriptions },
  "/credits": { module: pageModules.credits },
  "/redeem-codes": {
    module: pageModules.redeemCodes,
    queries: async (client) => {
      const { redeemCodesQueryOptions } = await import(
        "../features/redeem-codes/hooks/useRedeemCodes"
      )
      return client.prefetchQuery(redeemCodesQueryOptions)
    },
  },
  "/api-keys": {
    module: pageModules.apiKeys,
    queries: async (client) => {
      const { apiKeysQueryOptions } = await import("../features/api-keys/hooks/useApiKeys")
      return client.prefetchQuery(apiKeysQueryOptions)
    },
  },
  "/app-config": { module: pageModules.appConfig },
  "/audit-logs": {
    module: pageModules.auditLogs,
    queries: async (client) => {
      const { auditLogsQueryOptions } = await import(
        "../features/audit-logs/hooks/useAuditLogs"
      )
      return client.prefetchQuery(auditLogsQueryOptions)
    },
  },
  "/team": { module: pageModules.team },
  "/settings": { module: pageModules.settings },
}

/**
 * Warms a sidebar destination's page chunk and first query. Failures are
 * ignored: the page loads and reports errors itself when it is opened.
 */
export function prefetchRoute(href: string, client: QueryClient, role: ConsoleRole | null) {
  const entry = routePrefetches[href]
  if (!entry) return
  void entry.module().catch(() => undefined)
  // prefetchQuery skips data that is still fresh, so repeat hovers are free.
  void entry.queries?.(client, role).catch(() => undefined)
}
