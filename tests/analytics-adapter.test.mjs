import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { SourceTextModule, SyntheticModule } from "node:vm"
import test from "node:test"
import ts from "typescript"

const root = fileURLToPath(new URL("../", import.meta.url))
const range = {
  since: new Date("2026-08-01T00:00:00.000Z"),
  until: new Date("2026-08-31T23:59:59.999Z"),
  granularity: "day",
}

const clientPath = path.join(root, "src/lib/api/client.ts")
const storePath = path.join(root, "src/features/demo/store.ts")

/** Build the demo store stand-in shared by every loaded service. */
function createDemoStore() {
  const snapshots = []
  return {
    snapshots,
    module: {
      demoLaunchAnalytics: (filters) => ({
        section: filters.section,
        generatedAt: "2026-08-31T00:00:00.000Z",
        data: { demoSection: filters.section },
      }),
      demoRecentActivations: () => ({ dataThrough: "2026-08-31", journeys: [] }),
      demoDailyActiveUsers: (filters) => ({
        date: filters.date,
        totalUsers: 0,
        identifiedUsers: 0,
        anonymousUsers: 0,
        users: [],
      }),
      demoMarketSnapshots: () => [],
      demoUpsertMarketSnapshot: (snapshot) => {
        snapshots.push(snapshot)
        return { id: "demo-created" }
      },
      demoCollectionCounts: (names) =>
        Object.fromEntries(names.map((name) => [name, 0])),
      demoOperationalData: () => ({
        creditTransactions: [],
        wardrobe: [],
        savedResults: [],
        savedPhotos: [],
        wishlist: [],
        calendar: [],
      }),
      demoWardrobeItems: () => [],
      demoGooglePlay: (startDate, endDate) => ({
        daily: [],
        totals: {
          visitors: 0,
          acquisitions: 0,
          installs: 0,
          uninstalls: 0,
          conversionRate: 0,
        },
        sources: [],
        countries: [],
        integration: { dataThrough: endDate, status: "demo", startDate },
      }),
      demoAppStore: (startDate, endDate) => ({
        daily: [],
        totals: {
          impressions: 0,
          uniqueImpressions: 0,
          productPageViews: 0,
          downloads: 0,
          firstTimeDownloads: 0,
          redownloads: 0,
          conversionRate: 0,
        },
        sources: [],
        countries: [],
        integration: { dataThrough: endDate, status: "demo", startDate },
      }),
      demoCountUsers: () => 0,
      demoPlanCounts: () => ({
        total: 0,
        free: 0,
        pro: 0,
        premium: 0,
        unassigned: 0,
      }),
      demoUsersCreatedBetween: () => [],
    },
  }
}

/**
 * Load a real TS service while replacing the shared admin adapter and any
 * unrelated feature service. `mode` decides whether the adapter touches the
 * network stand-in or runs the demo callback.
 */
async function loadService(relativePath, options = {}) {
  const {
    mode = "live",
    live = async () => null,
    extraMocks = new Map(),
  } = options
  const calls = []
  const network = []
  const demoStore = options.demoStore ?? createDemoStore()

  const adapter = {
    adminRequest: async (operation, payload, demo) => {
      calls.push({ operation, payload })
      if (mode === "demo") return demo()
      network.push({ operation, payload })
      return live(operation, payload)
    },
  }

  const mocks = new Map([
    [clientPath, adapter],
    [storePath, demoStore.module],
    ...extraMocks,
  ])
  const cache = new Map()

  async function getModule(id) {
    if (cache.has(id)) return cache.get(id)
    const mock = mocks.get(id)
    let module
    if (mock) {
      module = new SyntheticModule(Object.keys(mock), function () {
        for (const [key, value] of Object.entries(mock)) this.setExport(key, value)
      }, { identifier: id })
    } else {
      assert.ok(id.startsWith(path.join(root, "src/")), `Unmocked import: ${id}`)
      const source = await readFile(id, "utf8")
      const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      })
      module = new SourceTextModule(outputText, { identifier: id })
    }
    cache.set(id, module)
    return module
  }

  const entry = await getModule(path.join(root, relativePath))
  await entry.link((specifier, referencing) =>
    getModule(
      specifier.startsWith(".")
        ? path.resolve(path.dirname(referencing.identifier), `${specifier}.ts`)
        : specifier,
    ),
  )
  await entry.evaluate()
  return { service: entry.namespace, calls, network, demoStore }
}

const launchService = "src/features/analytics/services/launchAnalyticsService.ts"
const analyticsService = "src/features/analytics/services/analyticsService.ts"
const dashboardService = "src/features/dashboard/services/dashboardService.ts"

test("analytics: operational data keeps its ISO payload and normalized shapes", async () => {
  const live = async (operation) => {
    assert.equal(operation, "analytics.operational")
    return {
      creditTransactions: [
        {
          id: "tx-1",
          userId: "fixture-user",
          type: "spend",
          operation: "tryOn",
          amount: -12,
          createdAt: "2026-08-02T10:00:00.000Z",
        },
      ],
      wardrobe: [{ id: "item-1", userId: "fixture-user", createdAt: 1000 }],
      savedResults: [{ id: "result-1", userId: "fixture-user", createdAt: 2000 }],
      savedPhotos: [],
      wishlist: [{ id: "wish-1" }],
      calendar: [],
    }
  }
  const { service, network } = await loadService(analyticsService, { live })
  const data = await service.fetchAnalyticsData(range)

  assert.deepEqual(network[0].payload, {
    startDate: range.since.toISOString(),
    endDate: range.until.toISOString(),
  })
  assert.equal(data.creditTransactions[0].type, "spend")
  assert.equal(data.creditTransactions[0].balanceBefore, 0)
  assert.equal(data.creditTransactions[0].balanceAfter, 0)
  assert.equal(data.wardrobeItems[0].category, "Other")
  assert.equal(data.savedResults[0].createdAt, 2000)
  assert.equal(data.wishlist[0].id, "wish-1")
})

test("analytics: demo mode never calls the network and uses the shared store", async () => {
  const { service, network } = await loadService(analyticsService, { mode: "demo" })
  const data = await service.fetchAnalyticsData(range)

  assert.equal(network.length, 0)
  assert.deepEqual(data.creditTransactions, [])
  assert.deepEqual(data.wardrobeItems, [])
})

test("launch analytics: filters are sent verbatim and the response is returned as-is", async () => {
  const response = {
    section: "acquisition",
    generatedAt: "2026-08-31T00:00:00.000Z",
    data: { daily: [], sources: [], platforms: [] },
  }
  const { service, network } = await loadService(launchService, {
    live: async (operation, payload) => {
      assert.equal(operation, "analytics.launch")
      assert.equal(payload.startDate, "2026-08-01")
      return response
    },
  })
  const result = await service.fetchLaunchAnalytics({
    section: "acquisition",
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    platform: null,
    language: null,
    notificationStatus: null,
  })

  assert.equal(network.length, 1)
  assert.deepEqual(result, response)
})

test("market snapshots: reading and upserting use their own operations", async () => {
  const { service, network, demoStore } = await loadService(launchService, {
    live: async (operation) => {
      if (operation === "analytics.marketSnapshots") return [{ id: "live-1" }]
      assert.equal(operation, "analytics.upsertMarketSnapshot")
      return { id: "live-created" }
    },
  })

  const rows = await service.fetchMarketSnapshots("2026-08-01", "2026-08-31")
  assert.deepEqual(rows, [{ id: "live-1" }])
  assert.deepEqual(network[0].payload, {
    startDate: "2026-08-01",
    endDate: "2026-08-31",
  })

  const created = await service.upsertMarketSnapshot({
    weekStart: "2026-08-24",
    platform: "IOS",
    impressions: 1000,
    installs: 50,
  })
  assert.deepEqual(created, { id: "live-created" })
  assert.deepEqual(network[1].payload, {
    weekStart: "2026-08-24",
    platform: "IOS",
    impressions: 1000,
    installs: 50,
  })
  assert.equal(demoStore.snapshots.length, 0)
})

test("market snapshots: demo upsert writes to the shared in-memory store", async () => {
  const { service, network, demoStore } = await loadService(launchService, {
    mode: "demo",
  })
  const created = await service.upsertMarketSnapshot({
    weekStart: "2026-08-24",
    platform: "ANDROID",
    impressions: 2000,
    installs: 80,
  })

  assert.deepEqual(created, { id: "demo-created" })
  assert.equal(network.length, 0)
  assert.deepEqual(demoStore.snapshots, [
    { weekStart: "2026-08-24", platform: "ANDROID", impressions: 2000, installs: 80 },
  ])
})

test("store sync rejects honestly in demo mode instead of faking a remote success", async () => {
  const { service, network, calls } = await loadService(launchService, {
    mode: "demo",
  })

  await assert.rejects(service.syncGooglePlayAnalytics(), /requires the admin API/)
  await assert.rejects(service.syncAppStoreAnalytics(), /requires the admin API/)
  assert.equal(network.length, 0)
  assert.deepEqual(calls.map((call) => call.operation), [
    "analytics.googlePlaySync",
    "analytics.appStoreSync",
  ])
})

test("store analytics: live failures are surfaced, never replaced with demo data", async () => {
  const denied = new Error("Analytics access is not allowed")
  const { service } = await loadService(launchService, {
    live: async () => {
      throw denied
    },
  })

  await assert.rejects(service.fetchGooglePlayAnalytics("2026-08-01", "2026-08-31"), (error) => {
    assert.equal(error.message, "Analytics access is not allowed")
    return true
  })
})

test("dashboard: aggregate user stats use one operation and honor role access", async () => {
  const emptyAnalytics = {
    creditTransactions: [],
    wardrobeItems: [],
    savedResults: [],
    savedPhotos: [],
    wishlist: [],
    calendar: [],
  }
  const extraMocks = new Map([
    [path.join(root, "src/features/analytics/services/analyticsService.ts"), {
      fetchAnalyticsData: async () => emptyAnalytics,
      fetchCollectionGroupCount: async () => 0,
    }],
    [path.join(root, "src/features/users/services/userService.ts"), {
      fetchUsersCreatedBetween: async () => [],
      sumUserField: async () => 0,
    }],
    [path.join(root, "src/features/credits/services/creditService.ts"), {
      fetchCreditTransactions: async () => [],
    }],
    [path.join(root, "src/features/media/services/mediaService.ts"), {
      fetchMediaAnalytics: async () => ({ summary: { totalPosts: 0 }, posts: [] }),
    }],
    [path.join(root, "src/features/subscriptions/services/subscriptionService.ts"), {
      countActiveSubscriptions: async () => 5,
    }],
    [path.join(root, "src/features/app-config/services/appConfigService.ts"), {
      fetchAppConfigGroup: async () => null,
    }],
  ])

  const { service, network } = await loadService(dashboardService, {
    extraMocks,
    live: async (operation, payload) => {
      if (operation !== "dashboard.userStats") return null
      assert.match(payload.since, /^\d{4}-\d{2}-\d{2}T.*Z$/)
      assert.match(payload.until, /^\d{4}-\d{2}-\d{2}T.*Z$/)
      assert.ok(new Date(payload.since) < new Date(payload.until))
      return {
        total: 42,
        newUserCreatedAt: [1000, 2000],
        plans: { free: 1, pro: 2, premium: 3, unassigned: 0 },
      }
    },
  })

  const stats = await service.fetchDashboardAnalytics(7, {
    users: true,
    billing: true,
    revenue: true,
  })

  assert.equal(network.length, 1)
  assert.equal(network[0].operation, "dashboard.userStats")
  assert.equal(stats.metrics.totalUsers, 42)
  assert.equal(stats.metrics.newUsers, 2)
  assert.equal(stats.metrics.activeSubscriptions, 5)
  assert.ok(stats.subscriptionDistribution)
  assert.equal(stats.userTrendData.at(-1)?.count ?? 0, 0)
})

test("dashboard: demo user stats come from the shared empty store", async () => {
  const emptyAnalytics = {
    creditTransactions: [],
    wardrobeItems: [],
    savedResults: [],
    savedPhotos: [],
    wishlist: [],
    calendar: [],
  }
  const extraMocks = new Map([
    [path.join(root, "src/features/analytics/services/analyticsService.ts"), {
      fetchAnalyticsData: async () => emptyAnalytics,
      fetchCollectionGroupCount: async () => 0,
    }],
    [path.join(root, "src/features/users/services/userService.ts"), {
      fetchUsersCreatedBetween: async () => [],
      sumUserField: async () => 0,
    }],
    [path.join(root, "src/features/credits/services/creditService.ts"), {
      fetchCreditTransactions: async () => [],
    }],
    [path.join(root, "src/features/media/services/mediaService.ts"), {
      fetchMediaAnalytics: async () => ({ summary: { totalPosts: 0 }, posts: [] }),
    }],
    [path.join(root, "src/features/subscriptions/services/subscriptionService.ts"), {
      countActiveSubscriptions: async () => 0,
    }],
    [path.join(root, "src/features/app-config/services/appConfigService.ts"), {
      fetchAppConfigGroup: async () => null,
    }],
  ])

  const { service, network } = await loadService(dashboardService, {
    mode: "demo",
    extraMocks,
  })
  const stats = await service.fetchDashboardAnalytics(7, {
    users: true,
    billing: false,
    revenue: false,
  })

  assert.equal(network.length, 0)
  assert.equal(stats.metrics.totalUsers, 0)
  assert.equal(stats.metrics.newUsers, 0)
  assert.equal(stats.metrics.activeUsers, 0)
  assert.equal(stats.metrics.creditSpend, 0)
  assert.equal(stats.metrics.creditLoad, 0)
  assert.equal(stats.metrics.activeSubscriptions, null)
  assert.equal(stats.metrics.totalBlogPosts, 0)
  assert.equal(stats.metrics.totalWardrobeItems, 0)
  assert.equal(stats.metrics.estimatedCac, null)
  assert.equal(stats.subscriptionDistribution, null)
  assert.deepEqual(stats.newUserProfiles, [])
  assert.deepEqual(stats.recentActivities, [])
  assert.deepEqual(stats.creditOperationData, [])
})
