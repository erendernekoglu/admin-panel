import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { SourceTextModule, SyntheticModule } from "node:vm"
import test from "node:test"
import ts from "typescript"

const root = fileURLToPath(new URL("../", import.meta.url))
const clientMockPath = path.join(root, "src/lib/api/client.ts")
const storePath = path.join(root, "src/features/demo/store.ts")

const day = 86_400_000
const range = {
  since: new Date(Date.now() - 60 * day),
  until: new Date(Date.now() + day),
  granularity: "day",
}

const TEST_ONLY_USER = {
  uid: "fixture-team-user",
  displayName: "Fixture Team User",
  email: "fixture.team.user@example.test",
  status: "active",
  createdAt: "2026-01-01T09:00:00.000Z",
  lastLoginAt: "2026-01-02T09:00:00.000Z",
  credits: 0,
  subscription: "free",
  role: "user",
  wardrobeCount: 0,
  savedResultsCount: 0,
  isTest: false,
  weatherOutfitEnabled: false,
  platform: "iOS",
}

async function loadService(relativePath, { respond, extraMocks = new Map(), loadStore = true } = {}) {
  const calls = []
  const mocks = new Map([
    [clientMockPath, {
      adminRequest: async (operation, payload, demo) => {
        calls.push({ operation, payload })
        const override = respond?.(operation, payload)
        return override === undefined ? demo() : override
      },
    }],
    ["@tanstack/react-query", {
      queryOptions: (options) => options,
      useQuery: () => { throw new Error("Hooks are not used by service tests") },
      useMutation: () => { throw new Error("Hooks are not used by service tests") },
      useQueryClient: () => { throw new Error("Hooks are not used by service tests") },
    }],
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
      // Test fixtures stay in tests: instrument only the store module with a
      // fixture setter so the production source never exports one.
      const testSource = id === storePath
        ? `${source}\nexport function __setDemoUsersForTests(users: AdminUser[]) { demoUsers = clone(users) }\n`
        : source
      const { outputText } = ts.transpileModule(testSource, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
        },
      })
      module = new SourceTextModule(outputText, { identifier: id })
    }
    cache.set(id, module)
    return module
  }

  const entryId = path.join(root, relativePath)
  const entry = await getModule(entryId)
  await entry.link((specifier, referencing) => getModule(
    specifier.startsWith(".")
      ? path.resolve(path.dirname(referencing.identifier), `${specifier}.ts`)
      : specifier,
  ))
  await entry.evaluate()

  const storeModule = loadStore ? await getModule(storePath) : null
  if (storeModule && storeModule.status !== "evaluated") await storeModule.evaluate()

  return {
    calls,
    namespace: entry.namespace,
    store: storeModule?.namespace ?? null,
  }
}

const apiKeyService = "src/features/api-keys/services/apiKeyService.ts"
const appConfigService = "src/features/app-config/services/appConfigService.ts"
const auditService = "src/features/audit-logs/services/auditLogService.ts"
const creditService = "src/features/credits/services/creditService.ts"
const mediaService = "src/features/media/services/mediaService.ts"
const redeemService = "src/features/redeem-codes/services/redeemCodeService.ts"
const subscriptionService = "src/features/subscriptions/services/subscriptionService.ts"
const teamService = "src/features/team/teamService.ts"
const weatherService = "src/features/weather/services/weatherService.ts"
const wardrobeService = "src/features/wardrobe/services/wardrobeService.ts"

test("demo store starts empty across every business dataset", async () => {
  const { namespace: store } = await loadService("src/features/demo/store.ts")
  store.resetDemoStore()

  assert.equal(store.PREVIEW_ACTOR_UID, "preview-admin")
  assert.deepEqual(store.listDemoUsers(), [])
  assert.deepEqual(store.demoUserPage({ userFilter: "all", platformFilter: "all" }, null, 10), {
    users: [],
    nextCursor: null,
  })
  assert.equal(store.demoCountUsers(), 0)
  assert.deepEqual(store.demoPlanCounts(), {
    total: 0,
    free: 0,
    pro: 0,
    premium: 0,
    unassigned: 0,
  })
  assert.deepEqual(store.demoUsersCreatedBetween(range.since, range.until), [])
  assert.equal(store.demoCountUsersWhere("wardrobeCount", 0), 0)
  assert.equal(store.demoSumUserField("wardrobeCount"), 0)
  assert.deepEqual(store.demoUsersByIds(["preview-admin"]), [])
  assert.deepEqual(store.demoSearchUsers("fixture"), [])
  assert.equal(store.demoFetchUser("preview-admin"), null)
  assert.deepEqual(store.demoListTeam(), [])
  assert.ok(!store.demoListTeam().some((member) => member.uid === store.PREVIEW_ACTOR_UID))

  assert.deepEqual(store.demoListApiKeys(), [])
  assert.deepEqual(store.demoListSubscriptions(), [])
  assert.equal(store.demoActiveSubscriptionCount(), 0)
  assert.deepEqual(store.demoSubscriptionsInRange(range), [])
  assert.deepEqual(store.demoCreditTransactions(), [])
  assert.deepEqual(store.demoCreditTransactionsInRange(range), [])

  const audits = store.demoAuditLogs()
  assert.deepEqual(audits.logs, [])
  assert.deepEqual(audits.sample, { limit: 200, truncated: false })

  const operational = store.demoOperationalData(range)
  for (const key of ["creditTransactions", "wardrobe", "savedResults", "savedPhotos", "wishlist", "calendar"]) {
    assert.deepEqual(operational[key], [], `${key} must start empty`)
  }
  assert.deepEqual(store.demoCollectionCounts(["wardrobe", "savedResults"]), {
    wardrobe: 0,
    savedResults: 0,
  })
  assert.deepEqual(store.demoWardrobeItems(), [])
  const analyticsData = store.demoAnalyticsData(range)
  for (const key of ["creditTransactions", "wardrobeItems", "savedResults", "savedPhotos", "wishlist", "calendar"]) {
    assert.deepEqual(analyticsData[key], [], `${key} must start empty`)
  }

  const wardrobe = store.demoWardrobeAnalytics(range, true)
  assert.deepEqual(wardrobe.users, [])
  assert.deepEqual(wardrobe.items, [])
  assert.deepEqual(wardrobe.newItems, [])
  assert.equal(wardrobe.activeWardrobeUsers, 0)
  assert.deepEqual(wardrobe.counts, {
    wardrobe: 0,
    savedResults: 0,
    savedPhotos: 0,
    wishlist: 0,
    calendar: 0,
  })
  const restricted = store.demoWardrobeAnalytics(range, false)
  assert.deepEqual(restricted.users, [])
  assert.deepEqual(restricted.items, [])
  assert.equal(restricted.activeWardrobeUsers, null)

  const media = store.demoMediaAnalytics()
  assert.deepEqual(media.posts, [])
  assert.deepEqual(media.summary, {
    totalPosts: 0,
    totalComments: 0,
    totalFollows: 0,
    totalNotifications: 0,
  })

  assert.deepEqual(store.demoWeatherLocations(), [])
  assert.deepEqual(store.demoWeatherForecasts(), [])

  assert.deepEqual(store.demoListRedeemCodes(), [])
  assert.deepEqual(store.demoMarketSnapshots("2026-01-01", "2026-12-31"), [])

  const filters = {
    startDate: new Date(Date.now() - 29 * day).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    platform: null,
    language: null,
    notificationStatus: null,
  }
  assert.deepEqual(store.demoLaunchAnalytics({ ...filters, section: "acquisition" }).data, {
    daily: [],
    sources: [],
    platforms: [],
  })
  assert.deepEqual(store.demoLaunchAnalytics({ ...filters, section: "activation" }).data, {
    funnel: [],
    onboarding: [],
    segments: [],
    summary: null,
  })
  assert.deepEqual(store.demoLaunchAnalytics({ ...filters, section: "retention" }).data, {
    cohorts: [],
    curve: [],
    habit: [],
    properties: [],
    stickiness: [],
  })
  assert.deepEqual(store.demoLaunchAnalytics({ ...filters, section: "engagement" }).data, {
    features: [],
    outfitSources: [],
    ai: [],
    dailyWear: [],
    rejections: [],
    funnels: [],
    errors: [],
  })
  assert.deepEqual(store.demoLaunchAnalytics({ ...filters, section: "reliability" }).data, {
    daily: [],
    issues: [],
    attributes: [],
    auth: [],
    firstSession: [],
  })
  assert.deepEqual(store.demoRecentActivations({ ...filters, limit: 20 }).journeys, [])
  assert.equal(store.demoRecentActivations({ ...filters, limit: 20 }).dataThrough, null)
  const dau = store.demoDailyActiveUsers({ date: filters.endDate, platform: null, language: null, notificationStatus: null, limit: 20 })
  assert.deepEqual(
    { totalUsers: dau.totalUsers, identifiedUsers: dau.identifiedUsers, anonymousUsers: dau.anonymousUsers, users: dau.users },
    { totalUsers: 0, identifiedUsers: 0, anonymousUsers: 0, users: [] },
  )

  const play = store.demoGooglePlay("2026-08-01", "2026-08-31")
  assert.deepEqual(play.daily, [])
  assert.deepEqual(play.sources, [])
  assert.deepEqual(play.countries, [])
  assert.deepEqual(play.totals, {
    visitors: 0,
    acquisitions: 0,
    installs: 0,
    uninstalls: 0,
    conversionRate: 0,
  })
  assert.equal(play.integration.lastSyncAt, null)
  const appStore = store.demoAppStore("2026-08-01", "2026-08-31")
  assert.deepEqual(appStore.daily, [])
  assert.deepEqual(appStore.sources, [])
  assert.deepEqual(appStore.countries, [])
  assert.deepEqual(appStore.totals, {
    impressions: 0,
    uniqueImpressions: 0,
    productPageViews: 0,
    downloads: 0,
    firstTimeDownloads: 0,
    redownloads: 0,
    conversionRate: 0,
  })
  assert.equal(appStore.integration.lastSyncAt, null)
  assert.deepEqual(store.demoSyncGooglePlay(), { fileCount: 0, recordCount: 0, dataThrough: null })
  assert.deepEqual(store.demoSyncAppStore(), {
    instanceCount: 0,
    newInstanceCount: 0,
    recordCount: 0,
    dataThrough: null,
  })
})

test("dashboard starts at zero for every role and never divides by zero", async () => {
  const { namespace: store } = await loadService("src/features/demo/store.ts")
  store.resetDemoStore()

  const full = store.demoDashboardAnalytics(30, { users: true, billing: true, revenue: true })
  assert.deepEqual(full.metrics, {
    totalUsers: 0,
    newUsers: 0,
    activeUsers: 0,
    creditSpend: 0,
    creditLoad: 0,
    activeSubscriptions: 0,
    totalBlogPosts: 0,
    totalWardrobeItems: 0,
    estimatedCac: null,
  })
  assert.ok(full.userTrendData.length > 0)
  assert.ok(full.userTrendData.every((bucket) => bucket.count === 0))
  assert.ok(full.creditTrendData.length > 0)
  assert.ok(full.creditTrendData.every((bucket) => bucket.spend === 0 && bucket.load === 0))
  assert.ok(full.aiOutputTrendData.length > 0)
  assert.ok(full.aiOutputTrendData.every((bucket) =>
    bucket.savedResults === 0 && bucket.savedPhotos === 0 && bucket.wishlist === 0 && bucket.calendar === 0,
  ))
  assert.deepEqual(full.creditOperationData, [])
  assert.ok(full.subscriptionDistribution.length > 0)
  assert.ok(full.subscriptionDistribution.every((slice) => slice.value === 0))
  assert.deepEqual(full.newUserProfiles, [])
  assert.deepEqual(full.recentActivities, [])
  assert.ok(!JSON.stringify(full).includes("NaN"))

  const restricted = store.demoDashboardAnalytics(7, { users: false, billing: false, revenue: false })
  assert.equal(restricted.metrics.totalUsers, 0)
  assert.equal(restricted.metrics.activeSubscriptions, null)
  assert.equal(restricted.subscriptionDistribution, null)
  assert.deepEqual(restricted.newUserProfiles, [])
  assert.deepEqual(restricted.recentActivities, [])
  assert.ok(restricted.userTrendData.every((bucket) => bucket.count === 0))
})

test("app config keeps neutral shape-safe defaults and local updates persist until reset", async () => {
  const { namespace: service, calls, store } = await loadService(appConfigService)
  store.resetDemoStore()

  const before = await service.fetchAppConfigGroup("appVersion")
  assert.equal(before.latestVersion, "")
  assert.equal(before.updatedAt, null)
  assert.equal(before.updatedBy, null)
  assert.equal(calls[0].operation, "appConfig.get")

  const apiLimits = await service.fetchAppConfigGroup("apiLimits")
  for (const serviceKey of ["gemini", "openai", "weather", "payment"]) {
    assert.equal(apiLimits[serviceKey].enabled, false)
  }

  await service.updateAppConfig({
    configId: "appVersion",
    data: { latestVersion: "9.9.9" },
    consolePassword: "demo-password",
  })
  const after = await service.fetchAppConfigGroup("appVersion")
  assert.equal(after.latestVersion, "9.9.9")
  assert.ok(after.updatedAt)
  assert.equal(after.updatedBy, "preview-admin")
  assert.ok(calls.some((call) => call.operation === "appConfig.update"))

  store.resetDemoStore()
  assert.equal((await service.fetchAppConfigGroup("appVersion")).latestVersion, "")
})

test("dashboard app config summary tolerates null metadata and flags empty versions", async () => {
  const element = (type, props) => {
    if (typeof type === "function") return type(props)
    return { type: typeof type === "symbol" ? "Fragment" : type, props }
  }
  const icon = (props) => ({ type: "Icon", props })
  const extraMocks = new Map([
    ["react/jsx-runtime", {
      jsx: element,
      jsxs: element,
      Fragment: Symbol.for("react.fragment"),
    }],
    ["react-router", { Link: (props) => ({ type: "Link", props }) }],
    [path.join(root, "src/components/atoms/Badge/Badge.ts"), {
      Badge: (props) => ({ type: "Badge", props }),
    }],
    [path.join(root, "src/components/molecules/Card.ts"), {
      Card: (props) => ({ type: "Card", props }),
      CardHeader: (props) => ({ type: "CardHeader", props }),
    }],
    ["lucide-react", {
      Cloud: icon,
      FileCheck2: icon,
      Settings2: icon,
      ShieldCheck: icon,
    }],
  ])
  const { namespace } = await loadService(
    "src/features/dashboard/components/AppConfigSummary.tsx",
    { extraMocks, loadStore: false },
  )
  const tree = namespace.AppConfigSummary({
    summary: {
      apiLimits: {
        gemini: { enabled: true, disabledAt: null, disabledReason: null, message: null },
        updatedAt: null,
        updatedBy: null,
      },
      appVersion: { latestVersion: "", updatedAt: null, updatedBy: null },
      dwKvkkVersion: { currentVersion: "   ", updatedAt: null, updatedBy: null },
      weatherTimeSlots: {
        morning: { start: 6, end: 11 },
        noon: { start: 11, end: 15 },
        evening: { start: 15, end: 20 },
        night: { start: 20, end: 6 },
        updatedAt: null,
        updatedBy: null,
      },
    },
  })
  const serialized = JSON.stringify(tree)
  const count = (needle) => serialized.split(needle).length - 1
  assert.match(serialized, /1\/1 servis açık/)
  assert.match(serialized, /4 zaman dilimi tanımlı/)
  assert.equal(count('"children":"Bilgi yok"'), 2)
  assert.equal(count('"children":"Eksik"'), 2)
  assert.equal(count('"children":"Ayarlı"'), 1)
})

test("API keys: local create, rotate, update and revoke mutate shared empty state", async () => {
  const { namespace: service, calls, store } = await loadService(apiKeyService)
  store.resetDemoStore()

  const initial = await service.fetchApiKeys()
  assert.deepEqual(initial, [])
  assert.equal(calls[0].operation, "apiKeys.list")

  const minted = await service.createApiKey({
    name: "Demo Partner New",
    ownerEmail: "partner.new@example.test",
    env: "live",
    scopes: ["outfit:read", "outfit:compute"],
    consolePassword: "demo-password",
  })
  assert.match(minted.plaintext, /^sk_demo_.*_not_a_real_secret$/)
  assert.deepEqual(
    (await service.fetchApiKeys()).map((key) => key.createdBy),
    ["preview-admin"],
  )
  assert.ok((await service.fetchApiKeys()).some((key) => key.keyId === minted.keyId))

  const usage = await service.fetchApiKeyUsage({
    keyId: minted.keyId,
    startDate: new Date(Date.now() - 6 * day).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
  })
  assert.deepEqual(usage, [], "local usage is not fabricated")

  const rotated = await service.rotateApiKey({
    keyId: minted.keyId,
    consolePassword: "demo-password",
  })
  assert.ok(rotated.previousKeyId === minted.keyId)
  assert.match(rotated.plaintext, /^sk_demo_/)
  assert.equal((await service.fetchApiKey(minted.keyId)).status, "disabled")

  const updated = await service.updateApiKey({
    keyId: rotated.keyId,
    notes: "Updated in demo",
    scopes: ["outfit:read"],
  })
  assert.equal(updated.notes, "Updated in demo")
  assert.deepEqual(updated.scopes, ["outfit:read"])

  const revoked = await service.revokeApiKey({
    keyId: rotated.keyId,
    consolePassword: "demo-password",
  })
  assert.equal(revoked.status, "revoked")
  await assert.rejects(
    service.revokeApiKey({ keyId: rotated.keyId, consolePassword: "demo-password" }),
    /already revoked/,
  )
  await assert.rejects(
    service.createApiKey({
      name: "Missing password",
      ownerEmail: "partner.new@example.test",
      env: "test",
      scopes: ["outfit:read"],
      consolePassword: "",
    }),
    /Console password/,
  )
})

test("team: empty until a user fixture is installed, then role changes stay local", async () => {
  const { namespace: service, calls, store } = await loadService(teamService)
  store.resetDemoStore()

  assert.deepEqual(await service.fetchTeam(), [])
  assert.equal(calls[0].operation, "team.list")

  store.__setDemoUsersForTests([TEST_ONLY_USER])
  const added = await service.setTeamRole({
    uid: TEST_ONLY_USER.uid,
    role: "viewer",
    consolePassword: "demo-password",
  })
  assert.equal(added.changed, true)
  const team = await service.fetchTeam()
  assert.ok(team.some((member) => member.uid === TEST_ONLY_USER.uid))
  assert.ok(!team.some((member) => member.uid === "preview-admin"))

  await assert.rejects(
    service.setTeamRole({ uid: TEST_ONLY_USER.uid, role: "admin", consolePassword: "demo-password" }),
    /does not allow promoting/,
  )
  await assert.rejects(
    service.setTeamRole({ uid: "missing-fixture-user", role: "viewer", consolePassword: "demo-password" }),
    /No demo user exists/,
  )
  await assert.rejects(
    service.setTeamRole({ uid: TEST_ONLY_USER.uid, role: "support", consolePassword: "" }),
    /Console password/,
  )
  await service.setTeamRole({ uid: TEST_ONLY_USER.uid, role: null, consolePassword: "demo-password" })
  assert.deepEqual(await service.fetchTeam(), [])

  store.resetDemoStore()
  assert.deepEqual(await service.fetchTeam(), [])
})

test("audit, credits, media, subscriptions and weather start empty", async () => {
  const audit = await loadService(auditService)
  audit.store.resetDemoStore()
  const logs = await audit.namespace.fetchAuditLogs()
  assert.deepEqual(logs.logs, [])
  assert.equal(audit.calls[0].operation, "auditLogs.list")

  const credits = await loadService(creditService)
  credits.store.resetDemoStore()
  assert.deepEqual(await credits.namespace.fetchCreditTransactionsInRange(range), [])
  assert.deepEqual(await credits.namespace.fetchCreditTransactions(100), [])

  const media = await loadService(mediaService)
  media.store.resetDemoStore()
  const mediaData = await media.namespace.fetchMediaAnalytics()
  assert.deepEqual(mediaData.posts, [])
  assert.equal(mediaData.summary.totalPosts, 0)
  assert.equal(mediaData.summary.totalComments, 0)
  assert.equal(mediaData.summary.totalFollows, 0)
  assert.equal(mediaData.summary.totalNotifications, 0)
  assert.equal(media.calls[0].operation, "media.analytics")

  const subscriptions = await loadService(subscriptionService)
  subscriptions.store.resetDemoStore()
  assert.deepEqual(await subscriptions.namespace.fetchSubscriptions(), [])
  assert.equal(await subscriptions.namespace.countActiveSubscriptions(), 0)
  assert.deepEqual(await subscriptions.namespace.fetchSubscriptionsInRange(range), [])

  const weather = await loadService(weatherService)
  weather.store.resetDemoStore()
  assert.deepEqual(await weather.namespace.fetchWeatherLocations(), [])
  assert.deepEqual(await weather.namespace.fetchWeatherForecasts(), [])
  await assert.rejects(
    weather.namespace.syncWeatherLocations({ consolePassword: "" }),
    /Console password/,
  )
  await assert.rejects(
    weather.namespace.syncWeatherLocations({ consolePassword: "demo-password" }),
    /unavailable in local preview mode.*connected API/,
  )
  await assert.rejects(
    weather.namespace.triggerWeatherUpdate({ consolePassword: "demo-password" }),
    /unavailable in local preview mode.*connected API/,
  )
  assert.deepEqual(await weather.namespace.fetchWeatherLocations(), [])
  assert.deepEqual(await weather.namespace.fetchWeatherForecasts(), [])
})

test("wardrobe: empty analytics still honors users.read permissions", async () => {
  const { namespace: service, calls, store } = await loadService(wardrobeService)
  store.resetDemoStore()
  const full = await service.fetchWardrobeAnalytics(range, true)
  assert.equal(calls[0].operation, "wardrobe.analytics")
  assert.deepEqual(full.items, [])
  assert.deepEqual(full.users, [])
  assert.equal(full.activeWardrobeUsers, 0)
  assert.deepEqual(full.counts, {
    wardrobe: 0,
    savedResults: 0,
    savedPhotos: 0,
    wishlist: 0,
    calendar: 0,
  })

  const restricted = await service.fetchWardrobeAnalytics(range, false)
  assert.deepEqual(restricted.users, [])
  assert.equal(restricted.activeWardrobeUsers, null)
  assert.deepEqual(restricted.items, [])
})

test("redeem codes: empty start, then local create, assign and disable mutate state", async () => {
  const { namespace: service, calls, store } = await loadService(redeemService)
  store.resetDemoStore()

  const initial = await service.fetchRedeemCodes()
  assert.deepEqual(initial, [])
  assert.equal(calls[0].operation, "redeemCodes.list")

  const created = await service.createRedeemCode({
    code: "FOCUS-DEMO",
    type: "credit",
    value: 25,
    maxUsage: 2,
    expiresAt: new Date(Date.now() + 7 * day).toISOString(),
  })
  assert.equal(created.code, "FOCUS-DEMO")
  assert.equal(created.createdByAdminId, "preview-admin")
  assert.ok((await service.fetchRedeemCodes()).some((code) => code.id === created.id))

  const assigned = await service.assignRedeemCode({
    codeId: created.id,
    code: created.code,
    userEmail: "fixture.user.12@example.test",
  })
  assert.equal(assigned.assignedUserEmail, "fixture.user.12@example.test")

  const disabled = await service.disableRedeemCode(created.id)
  assert.equal(disabled.status, "disabled")
  await assert.rejects(
    service.assignRedeemCode({ codeId: created.id, code: created.code, userId: "fixture-user-12" }),
    /cannot be assigned/,
  )
})
