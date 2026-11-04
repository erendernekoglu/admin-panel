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
      const { outputText } = ts.transpileModule(source, {
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

test("users page: opaque string cursors page through filtered synthetic users", async () => {
  const { service, calls } = await loadUserService()

  const first = await service.fetchUsersPage({ userFilter: "all", platformFilter: "all" }, null, 10)
  assert.equal(calls[0].operation, "users.list")
  assert.equal(first.users.length, 10)
  assert.equal(typeof first.nextCursor, "string")
  assert.ok(first.users.every((user) => user.createdAt.endsWith("Z")))

  const second = await service.fetchUsersPage(
    { userFilter: "all", platformFilter: "all" },
    first.nextCursor,
    10,
  )
  assert.equal(second.users.length, 10)
  assert.ok(!first.users.some((user) => second.users.some((next) => next.uid === user.uid)))

  const pro = await service.fetchUsersPage({ userFilter: "pro", platformFilter: "all" }, null, 5)
  assert.ok(pro.users.length > 0)
  assert.ok(pro.users.every((user) => user.subscription === "pro"))

  const iosAdmin = await service.fetchUsersPage({ userFilter: "admin", platformFilter: "ios" }, null, 5)
  assert.ok(iosAdmin.users.every((user) => user.role === "admin" && user.platform === "iOS"))
})

test("users counts and plan distribution keep unassigned profiles separate", async () => {
  const { service, calls } = await loadUserService()
  const all = await service.countUsers()
  assert.ok(all > 0)
  assert.equal(calls[0].operation, "users.count")

  const plans = await service.fetchUserPlanCounts()
  assert.equal(plans.total, all)
  assert.equal(plans.free + plans.pro + plans.premium + plans.unassigned, plans.total)
  assert.ok(plans.free > 0 && plans.pro > 0 && plans.premium > 0)
  assert.equal(calls[1].operation, "users.planCounts")
})

test("users by id: deduplicated and empty requests stay local", async () => {
  const { service, calls } = await loadUserService()
  const all = await service.fetchUsersPage({ userFilter: "all", platformFilter: "all" }, null, 20)
  const ids = all.users.map((user) => user.uid)

  const users = await service.fetchUsersByIds([...ids, ids[0], ""])
  assert.equal(users.length, ids.length)
  assert.deepEqual(await service.fetchUsersByIds([]), [])
  assert.equal(calls.length, 2, "the empty id list makes no adapter request")
})

test("search: exact uid, e-mail prefix and display-name prefix without duplicates", async () => {
  const { service, calls } = await loadUserService()

  const byName = await service.searchUsers("demo kullanıcı 01")
  assert.deepEqual(byName.map((user) => user.uid), ["demo-user-01"])

  const byEmail = await service.searchUsers("demo.user.42@")
  assert.deepEqual(byEmail.map((user) => user.uid), ["demo-user-42"])

  const byUid = await service.searchUsers("demo-user-07")
  assert.deepEqual(byUid.map((user) => user.uid), ["demo-user-07"])
  assert.deepEqual(await service.searchUsers("   "), [])
  assert.equal(calls.at(-1).operation, "users.search")
})

test("user detail and delete: demo mutations change shared state and guard self deletion", async () => {
  const { service, calls, store } = await loadUserService()

  const target = await service.fetchUserById("demo-user-31")
  assert.equal(target.uid, "demo-user-31")
  assert.equal(calls[0].operation, "users.get")

  await assert.rejects(
    service.deleteUser({ uid: "demo-user-31", consolePassword: "" }),
    /Console password/,
  )
  await service.deleteUser({ uid: "demo-user-31", consolePassword: "demo-password" })
  assert.equal(await service.fetchUserById("demo-user-31"), null)

  await assert.rejects(
    service.deleteUser({ uid: "demo-user-01", consolePassword: "demo-password" }),
    /cannot delete your own/,
  )

  store.resetDemoStore()
  assert.ok(await service.fetchUserById("demo-user-31"))
})
