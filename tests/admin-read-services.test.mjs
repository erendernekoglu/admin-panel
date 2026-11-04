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

async function loadService(relativePath, { respond } = {}) {
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

  const entryId = path.join(root, relativePath)
  const entry = await getModule(entryId)
  await entry.link((specifier, referencing) => getModule(
    specifier.startsWith(".")
      ? path.resolve(path.dirname(referencing.identifier), `${specifier}.ts`)
      : specifier,
  ))
  await entry.evaluate()

  const storeModule = await getModule(storePath)
  if (storeModule.status !== "evaluated") await storeModule.evaluate()

  return {
    calls,
    namespace: entry.namespace,
    store: storeModule.namespace,
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

test("demo launch analytics and dashboard expose nonempty chart shapes", async () => {
  const { namespace: store } = await loadService("src/features/demo/store.ts")
  store.resetDemoStore()
  const filters = {
    startDate: new Date(Date.now() - 29 * day).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    platform: null,
    language: null,
    notificationStatus: null,
  }
  const checks = {
    acquisition: (data) => data.daily.length > 0 && data.sources.length > 0 && data.platforms.length > 0,
    activation: (data) => data.funnel.length > 0 && data.onboarding.length > 0 && data.summary,
    retention: (data) => data.cohorts.length > 0 && data.curve.length > 0 && data.stickiness.length > 0,
    engagement: (data) => data.features.length > 0 && data.dailyWear.length > 0 && data.ai.length > 0,
    reliability: (data) => data.daily.length > 0 && data.issues.length > 0 && data.auth.length > 0,
  }
  for (const [section, valid] of Object.entries(checks)) {
    const response = store.demoLaunchAnalytics({ ...filters, section })
    assert.equal(response.section, section)
    assert.ok(valid(response.data), `${section} demo data must not be empty`)
  }

  const dashboard = store.demoDashboardAnalytics(30, { users: true, billing: true, revenue: true })
  assert.ok(dashboard.userTrendData.length > 0)
  assert.ok(dashboard.creditTrendData.length > 0)
  assert.ok(dashboard.aiOutputTrendData.length > 0)
  assert.ok(dashboard.subscriptionDistribution.length > 0)
  assert.ok(dashboard.recentActivities.length > 0)
  assert.equal(dashboard.metrics.estimatedCac, null)
})

test("API keys: demo create, rotate, update, revoke and usage really mutate shared state", async () => {
  const { namespace: service, calls, store } = await loadService(apiKeyService)
  store.resetDemoStore()

  const initial = await service.fetchApiKeys()
  assert.ok(initial.length > 0)
  assert.equal(calls[0].operation, "apiKeys.list")

  const minted = await service.createApiKey({
    name: "Demo Partner New",
    ownerEmail: "partner.new@example.test",
    env: "live",
    scopes: ["outfit:read", "outfit:compute"],
    consolePassword: "demo-password",
  })
  assert.match(minted.plaintext, /^sk_demo_.*_not_a_real_secret$/)
  assert.ok((await service.fetchApiKeys()).some((key) => key.keyId === minted.keyId))

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

  const usage = await service.fetchApiKeyUsage({
    keyId: initial[0].keyId,
    startDate: new Date(Date.now() - 6 * day).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
  })
  assert.ok(usage.length >= 7)
  assert.ok(usage.every((day) => day.total > 0 && day.byService.outfitEngine > 0))
})

test("team: demo role changes add members but refuse privilege escalation and self demotion", async () => {
  const { namespace: service, calls, store } = await loadService(teamService)
  store.resetDemoStore()

  const team = await service.fetchTeam()
  assert.ok(team.some((member) => member.role === "admin"))
  assert.equal(calls[0].operation, "team.list")

  const added = await service.setTeamRole({
    uid: "demo-user-10",
    role: "viewer",
    consolePassword: "demo-password",
  })
  assert.equal(added.changed, true)
  assert.ok((await service.fetchTeam()).some((member) => member.uid === "demo-user-10"))

  await assert.rejects(
    service.setTeamRole({ uid: "demo-user-10", role: "admin", consolePassword: "demo-password" }),
    /does not allow promoting/,
  )
  await assert.rejects(
    service.setTeamRole({ uid: "demo-user-01", role: null, consolePassword: "demo-password" }),
    /cannot demote or remove your own/,
  )
  await assert.rejects(
    service.setTeamRole({ uid: "demo-user-02", role: "support", consolePassword: "" }),
    /Console password/,
  )
})

test("app config: demo update persists until reload reset", async () => {
  const { namespace: service, calls, store } = await loadService(appConfigService)
  store.resetDemoStore()

  const before = await service.fetchAppConfigGroup("appVersion")
  assert.equal(before.latestVersion, "3.4.0")
  assert.equal(calls[0].operation, "appConfig.get")

  await service.updateAppConfig({
    configId: "appVersion",
    data: { latestVersion: "9.9.9" },
    consolePassword: "demo-password",
  })
  const after = await service.fetchAppConfigGroup("appVersion")
  assert.equal(after.latestVersion, "9.9.9")
  assert.ok(after.updatedAt)
  assert.equal(calls[1].operation, "appConfig.update")

  store.resetDemoStore()
  assert.equal((await service.fetchAppConfigGroup("appVersion")).latestVersion, "3.4.0")
})

test("audit, credits, media, subscriptions and weather return synthetic nonempty data", async () => {
  const audit = await loadService(auditService)
  const logs = await audit.namespace.fetchAuditLogs()
  assert.ok(logs.logs.length > 0)
  assert.equal(audit.calls[0].operation, "auditLogs.list")
  assert.ok(logs.logs.every((log) => !Number.isNaN(new Date(log.createdAt).getTime())))

  const credits = await loadService(creditService)
  const transactions = await credits.namespace.fetchCreditTransactionsInRange(range)
  assert.ok(transactions.length > 0)
  assert.ok(transactions.every((item) => typeof item.createdAt === "string"))
  assert.ok(transactions[0].createdAt >= transactions.at(-1).createdAt)

  const media = await loadService(mediaService)
  const mediaData = await media.namespace.fetchMediaAnalytics()
  assert.ok(mediaData.posts.length > 0)
  assert.ok(mediaData.summary.totalPosts >= mediaData.posts.length)
  assert.equal(media.calls[0].operation, "media.analytics")

  const subscriptions = await loadService(subscriptionService)
  const records = await subscriptions.namespace.fetchSubscriptions()
  assert.ok(records.length > 0)
  assert.ok(await subscriptions.namespace.countActiveSubscriptions() > 0)
  assert.ok((await subscriptions.namespace.fetchSubscriptionsInRange(range)).length > 0)

  const weather = await loadService(weatherService)
  const locations = await weather.namespace.fetchWeatherLocations()
  const forecasts = await weather.namespace.fetchWeatherForecasts()
  assert.ok(locations.length > 0)
  assert.ok(forecasts.length > 0)
  assert.ok(forecasts.every((forecast) => forecast.date && forecast.updatedAt))
  await assert.rejects(
    weather.namespace.syncWeatherLocations({ consolePassword: "" }),
    /Console password/,
  )
  const synced = await weather.namespace.syncWeatherLocations({ consolePassword: "demo-password" })
  assert.equal(synced.synced, locations.length)
  const update = await weather.namespace.triggerWeatherUpdate({ consolePassword: "demo-password" })
  assert.equal(update.failed, 0)
  assert.ok(update.results.length === locations.length)
})

test("wardrobe: demo analytics respects users.read and remains nonempty", async () => {
  const { namespace: service, calls } = await loadService(wardrobeService)
  const full = await service.fetchWardrobeAnalytics(range, true)
  assert.equal(calls[0].operation, "wardrobe.analytics")
  assert.ok(full.items.length > 0)
  assert.ok(full.users.length > 0)
  assert.ok(full.activeWardrobeUsers > 0)
  assert.ok(full.items[0].userDisplayName)

  const restricted = await service.fetchWardrobeAnalytics(range, false)
  assert.deepEqual(restricted.users, [])
  assert.equal(restricted.activeWardrobeUsers, null)
  assert.equal(restricted.items[0].userDisplayName, undefined)
  assert.ok(restricted.items.length > 0)
})

test("redeem codes: demo create, assign and disable mutate shared state", async () => {
  const { namespace: service, calls, store } = await loadService(redeemService)
  store.resetDemoStore()

  const initial = await service.fetchRedeemCodes()
  assert.ok(initial.length > 0)
  assert.equal(calls[0].operation, "redeemCodes.list")

  const created = await service.createRedeemCode({
    code: "FOCUS-DEMO",
    type: "credit",
    value: 25,
    maxUsage: 2,
    expiresAt: new Date(Date.now() + 7 * day).toISOString(),
  })
  assert.equal(created.code, "FOCUS-DEMO")
  assert.ok((await service.fetchRedeemCodes()).some((code) => code.id === created.id))

  const assigned = await service.assignRedeemCode({
    codeId: created.id,
    code: created.code,
    userEmail: "demo.user.12@example.test",
  })
  assert.equal(assigned.assignedUserEmail, "demo.user.12@example.test")

  const disabled = await service.disableRedeemCode(created.id)
  assert.equal(disabled.status, "disabled")
  await assert.rejects(
    service.assignRedeemCode({ codeId: created.id, code: created.code, userId: "demo-user-12" }),
    /cannot be assigned/,
  )
})
