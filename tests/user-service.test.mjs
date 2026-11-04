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

/**
 * Explicit TEST-ONLY fixtures. The production store never seeds users, so a
 * test that needs a user row installs this array itself.
 */
const TEST_ONLY_USERS = [
  {
    uid: "fixture-user-01",
    displayName: "Fixture User 01",
    email: "fixture.user.01@example.test",
    status: "active",
    createdAt: "2026-01-01T09:00:00.000Z",
    lastLoginAt: "2026-01-02T09:00:00.000Z",
    credits: 0,
    subscription: "premium",
    role: "admin",
    wardrobeCount: 2,
    savedResultsCount: 1,
    isTest: false,
    weatherOutfitEnabled: false,
    platform: "iOS",
  },
  {
    uid: "fixture-user-02",
    displayName: "Fixture User 02",
    email: "fixture.user.02@example.test",
    status: "active",
    createdAt: "2026-01-02T09:00:00.000Z",
    lastLoginAt: "2026-01-03T09:00:00.000Z",
    credits: 0,
    subscription: "pro",
    role: "editor",
    wardrobeCount: 1,
    savedResultsCount: 0,
    isTest: false,
    weatherOutfitEnabled: true,
    platform: "Android",
  },
  {
    uid: "fixture-user-03",
    displayName: "Fixture User 03",
    email: "fixture.user.03@example.test",
    status: "active",
    createdAt: "2026-01-03T09:00:00.000Z",
    lastLoginAt: "2026-01-04T09:00:00.000Z",
    credits: 0,
    subscription: "pro",
    role: "user",
    wardrobeCount: 0,
    savedResultsCount: 0,
    isTest: true,
    weatherOutfitEnabled: false,
    platform: "iOS",
  },
  {
    uid: "fixture-user-04",
    displayName: "Fixture User 04",
    email: "fixture.user.04@example.test",
    status: "active",
    createdAt: "2026-01-04T09:00:00.000Z",
    lastLoginAt: "2026-01-05T09:00:00.000Z",
    credits: 0,
    subscription: "free",
    role: "user",
    wardrobeCount: 0,
    savedResultsCount: 0,
    isTest: false,
    weatherOutfitEnabled: false,
    platform: "Android",
  },
]

async function loadUserService() {
  const calls = []
  const mocks = new Map([
    [clientMockPath, {
      adminRequest: async (operation, payload, demo) => {
        calls.push({ operation, payload })
        return demo()
      },
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
      // Test fixtures stay in this file; only the VM copy of the store gets a
      // setter, never the production module.
      const testSource = id === storePath
        ? `${source}\nexport function __setDemoUsersForTests(users: AdminUser[]) { demoUsers = clone(users) }\n`
        : source
      const { outputText } = ts.transpileModule(testSource, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      })
      module = new SourceTextModule(outputText, { identifier: id })
    }
    cache.set(id, module)
    return module
  }

  const entry = await getModule(
    path.join(root, "src/features/users/services/userService.ts"),
  )
  await entry.link((specifier, referencing) => getModule(
    specifier.startsWith(".")
      ? path.resolve(path.dirname(referencing.identifier), `${specifier}.ts`)
      : specifier,
  ))
  await entry.evaluate()

  const store = await getModule(storePath)
  if (store.status !== "evaluated") await store.evaluate()
  store.namespace.resetDemoStore()

  return { calls, service: entry.namespace, store: store.namespace }
}

test("users page starts empty and still routes one adapter operation", async () => {
  const { service, calls } = await loadUserService()

  const page = await service.fetchUsersPage({ userFilter: "all", platformFilter: "all" }, null, 10)
  assert.equal(calls[0].operation, "users.list")
  assert.deepEqual(page, { users: [], nextCursor: null })
  assert.equal(await service.countUsers(), 0)
  assert.equal(calls[1].operation, "users.count")

  const plans = await service.fetchUserPlanCounts()
  assert.deepEqual(plans, { total: 0, free: 0, pro: 0, premium: 0, unassigned: 0 })
  assert.equal(calls[2].operation, "users.planCounts")
})

test("users page pages and filters through explicit test-only fixtures", async () => {
  const { service, store } = await loadUserService()
  store.__setDemoUsersForTests(TEST_ONLY_USERS)

  const first = await service.fetchUsersPage({ userFilter: "all", platformFilter: "all" }, null, 2)
  assert.equal(first.users.length, 2)
  assert.equal(typeof first.nextCursor, "string")
  assert.ok(first.users.every((user) => user.createdAt.endsWith("Z")))

  const second = await service.fetchUsersPage(
    { userFilter: "all", platformFilter: "all" },
    first.nextCursor,
    2,
  )
  assert.equal(second.users.length, 2)
  assert.equal(second.nextCursor, null)
  assert.ok(!first.users.some((user) => second.users.some((next) => next.uid === user.uid)))

  const pro = await service.fetchUsersPage({ userFilter: "pro", platformFilter: "all" }, null, 5)
  assert.ok(pro.users.length > 0)
  assert.ok(pro.users.every((user) => user.subscription === "pro"))

  const iosAdmin = await service.fetchUsersPage({ userFilter: "admin", platformFilter: "ios" }, null, 5)
  assert.deepEqual(iosAdmin.users.map((user) => user.uid), ["fixture-user-01"])
})

test("user counts and plan distribution reflect only installed fixtures", async () => {
  const { service, store } = await loadUserService()
  store.__setDemoUsersForTests(TEST_ONLY_USERS)

  const all = await service.countUsers()
  assert.equal(all, TEST_ONLY_USERS.length)

  const plans = await service.fetchUserPlanCounts()
  assert.equal(plans.total, all)
  assert.equal(plans.free + plans.pro + plans.premium + plans.unassigned, plans.total)
  assert.deepEqual(plans, { total: 4, free: 1, pro: 2, premium: 1, unassigned: 0 })

  store.resetDemoStore()
  assert.equal(await service.countUsers(), 0)
})

test("users by id: deduplicated, empty requests stay local, reset stays empty", async () => {
  const { service, calls, store } = await loadUserService()
  store.__setDemoUsersForTests(TEST_ONLY_USERS)
  const all = await service.fetchUsersPage({ userFilter: "all", platformFilter: "all" }, null, 20)
  const ids = all.users.map((user) => user.uid)

  const users = await service.fetchUsersByIds([...ids, ids[0], ""])
  assert.equal(users.length, ids.length)
  assert.deepEqual(await service.fetchUsersByIds([]), [])
  assert.equal(calls.length, 2, "the empty id list makes no adapter request")

  store.resetDemoStore()
  assert.equal(calls.length, 2)
  assert.deepEqual(await service.fetchUsersByIds(ids), [], "reader returns no local records after reset")
})

test("search: exact uid, e-mail prefix and display-name prefix without duplicates", async () => {
  const { service, store } = await loadUserService()
  store.__setDemoUsersForTests(TEST_ONLY_USERS)

  const byName = await service.searchUsers("fixture user 03")
  assert.deepEqual(byName.map((user) => user.uid), ["fixture-user-03"])

  const byEmail = await service.searchUsers("fixture.user.02@")
  assert.deepEqual(byEmail.map((user) => user.uid), ["fixture-user-02"])

  const byUid = await service.searchUsers("fixture-user-04")
  assert.deepEqual(byUid.map((user) => user.uid), ["fixture-user-04"])
  assert.deepEqual(await service.searchUsers("   "), [])

  store.resetDemoStore()
  assert.deepEqual(await service.searchUsers("fixture"), [])
})

test("user detail and delete: mutations read shared state and guard the preview actor", async () => {
  const { service, calls, store } = await loadUserService()
  store.__setDemoUsersForTests(TEST_ONLY_USERS)

  const target = await service.fetchUserById("fixture-user-02")
  assert.equal(target.uid, "fixture-user-02")
  assert.equal(calls[0].operation, "users.get")

  await assert.rejects(
    service.deleteUser({ uid: "fixture-user-02", consolePassword: "" }),
    /Console password/,
  )
  await service.deleteUser({ uid: "fixture-user-02", consolePassword: "demo-password" })
  assert.equal(await service.fetchUserById("fixture-user-02"), null)

  await assert.rejects(
    service.deleteUser({ uid: "preview-admin", consolePassword: "demo-password" }),
    /preview console account/,
  )
  assert.equal(store.demoFetchUser("preview-admin"), null)
  await assert.rejects(
    service.deleteUser({ uid: "missing-fixture-user", consolePassword: "demo-password" }),
    /No demo user exists/,
  )

  store.resetDemoStore()
  assert.equal(await service.fetchUserById("fixture-user-01"), null)
  assert.deepEqual(store.listDemoUsers(), [])
})
