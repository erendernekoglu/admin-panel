const RELOAD_KEY = "admin-panel:stale-chunk-reload"

// After a deploy, a tab still running the old build asks for page chunks whose
// hashed names no longer exist. Reload once to pick up the new build instead of
// showing the router's error screen; a second failure within a minute is a real error.
function reloadOnStaleChunk<T>(load: () => Promise<T>): () => Promise<T> {
  return () =>
    load().catch((error: unknown) => {
      let last = 0
      try {
        last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0
        if (Date.now() - last > 60_000) sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
      } catch {
        // Storage unavailable: still reload once per page load.
      }
      if (Date.now() - last > 60_000) {
        window.location.reload()
        return new Promise<T>(() => {})
      }
      throw error
    })
}

// Page chunk loaders shared by the router (React.lazy) and link prefetching,
// so hovering a link warms the exact module the route will render. Prefetching
// uses these raw loaders: a hover must never reload the page.
export const pageLoaders = {
  lookbook: () => import("../routes/LookbookPage"),
  styleEvents: () => import("../routes/StyleEventsPage"),
  accessDenied: () => import("../routes/AccessDeniedPage"),
  analytics: () => import("../routes/AnalyticsPage"),
  apiKeyDetail: () => import("../routes/ApiKeyDetailPage"),
  apiKeys: () => import("../routes/ApiKeysPage"),
  appConfig: () => import("../routes/AppConfigPage"),
  auditLogs: () => import("../routes/AuditLogsPage"),
  boutique: () => import("../routes/BoutiquePage"),
  credits: () => import("../routes/CreditsPage"),
  dashboard: () => import("../routes/DashboardPage"),
  login: () => import("../routes/LoginPage"),
  media: () => import("../routes/MediaPage"),
  notFound: () => import("../routes/NotFoundPage"),
  redeemCodes: () => import("../routes/RedeemCodesPage"),
  routeError: () => import("../routes/RouteErrorPage"),
  settings: () => import("../routes/SettingsPage"),
  subscriptions: () => import("../routes/SubscriptionsPage"),
  userDetail: () => import("../routes/UserDetailPage"),
  users: () => import("../routes/UsersPage"),
  wardrobe: () => import("../routes/WardrobePage"),
  weather: () => import("../routes/WeatherPage"),
  team: () => import("../routes/TeamPage"),
}

export const pageModules = Object.fromEntries(
  Object.entries(pageLoaders).map(([name, load]) => [
    name,
    reloadOnStaleChunk(load as () => Promise<unknown>),
  ]),
) as unknown as typeof pageLoaders
