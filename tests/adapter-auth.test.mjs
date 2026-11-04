import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { SourceTextModule, SyntheticModule } from "node:vm"
import test from "node:test"
import ts from "typescript"

const root = fileURLToPath(new URL("../", import.meta.url))

async function loadModule(relativePath, mocks = new Map()) {
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

  const entry = await getModule(path.join(root, relativePath))
  await entry.link((specifier, referencing) => getModule(
    specifier.startsWith(".")
      ? path.resolve(path.dirname(referencing.identifier), `${specifier}.ts`)
      : specifier,
  ))
  await entry.evaluate()
  return entry.namespace
}

function configMock(isDemoMode) {
  return new Map([
    [path.join(root, "src/lib/config.ts"), { isDemoMode, dataMode: isDemoMode ? "demo" : "api" }],
  ])
}

function fakeResponse({ status = 200, body = "" } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  }
}

function captureFetch(handler) {
  const original = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init })
    return handler(url, init)
  }
  return {
    calls,
    restore() {
      globalThis.fetch = original
    },
  }
}

function createHookRuntime() {
  const states = []
  const refs = []
  let effects = []
  let index = 0

  const react = {
    useState(initial) {
      const slot = index++
      if (!(slot in states)) {
        states[slot] = typeof initial === "function" ? initial() : initial
      }
      const set = (next) => {
        states[slot] = typeof next === "function" ? next(states[slot]) : next
      }
      return [states[slot], set]
    },
    useRef(initial) {
      const slot = index++
      if (!(slot in refs)) refs[slot] = { current: initial }
      return refs[slot]
    },
    useEffect(effect) {
      effects.push(effect)
    },
    useCallback(callback) {
      return callback
    },
    useMemo(factory) {
      return factory()
    },
  }

  return {
    react,
    begin() {
      index = 0
      effects = []
    },
    takeEffects() {
      const current = effects
      effects = []
      return current
    },
  }
}

test("config: missing/empty defaults to demo, exact values pass, typos throw", async () => {
  const config = await loadModule("src/lib/config.ts")

  assert.equal(config.resolveDataMode(undefined), "demo")
  assert.equal(config.resolveDataMode(null), "demo")
  assert.equal(config.resolveDataMode(""), "demo")
  assert.equal(config.resolveDataMode("demo"), "demo")
  assert.equal(config.resolveDataMode("api"), "api")
  for (const invalid of ["API", "Demo", "prod", " demo ", 1, false]) {
    assert.throws(
      () => config.resolveDataMode(invalid),
      (error) => error.name === "DataModeConfigurationError" && /Invalid VITE_DATA_MODE/.test(error.message),
    )
  }
  assert.equal(config.isDemoMode, true, "no VITE_DATA_MODE in the test environment")
})

test("client: demo callback runs with zero fetch calls", async () => {
  const client = await loadModule("src/lib/api/client.ts", configMock(true))
  const fetchState = captureFetch(() => {
    throw new Error("fetch must not run in demo mode")
  })

  try {
    let payloadSeen = null
    const result = await client.adminRequest("users.list", { page: 1 }, (payload) => {
      payloadSeen = payload
      return { users: [] }
    })
    assert.deepEqual(result, { users: [] })
    assert.equal(payloadSeen, undefined, "demo callback receives no payload")
    assert.equal(fetchState.calls.length, 0)
  } finally {
    fetchState.restore()
  }
})

test("client: invalid operation identifiers are rejected before any callback or fetch", async () => {
  for (const demo of [true, false]) {
    const client = await loadModule("src/lib/api/client.ts", configMock(demo))
    const fetchState = captureFetch(() => fakeResponse())
    let demoCalls = 0
    try {
      for (const operation of ["../users", "users/delete", "", "1users", "users delete", "users?x"]) {
        await assert.rejects(
          client.adminRequest(operation, {}, () => {
            demoCalls++
            return "demo"
          }),
          (error) => error.name === "AdminRequestError" && error.status === 0,
        )
      }
      assert.equal(demoCalls, 0)
      assert.equal(fetchState.calls.length, 0)
    } finally {
      fetchState.restore()
    }
  }
})

test("client: API 401 surfaces the server code/field and never calls the demo callback", async () => {
  const client = await loadModule("src/lib/api/client.ts", configMock(false))
  const fetchState = captureFetch(() => fakeResponse({
    status: 401,
    body: JSON.stringify({
      error: {
        code: "session_expired",
        field: "session",
        message: "Sign in required.",
        stack: "secret internal stack",
        extra: "must not leak",
      },
    }),
  }))
  let demoCalls = 0

  try {
    await assert.rejects(
      client.adminRequest("users.delete", { uid: "u1" }, () => {
        demoCalls++
        return { ok: true }
      }),
      (error) => {
        assert.equal(error.name, "AdminRequestError")
        assert.equal(error.status, 401)
        assert.equal(error.operation, "users.delete")
        assert.equal(error.code, "session_expired")
        assert.equal(error.field, "session")
        assert.equal(error.message, "Sign in required.")
        assert.equal(error.extra, undefined)
        return true
      },
    )
    assert.equal(demoCalls, 0)
    assert.equal(fetchState.calls.length, 1)
    const [{ url, init }] = fetchState.calls
    assert.equal(url, "/api/admin/operations/users.delete")
    assert.equal(init.method, "POST")
    assert.equal(init.credentials, "same-origin")
    assert.equal(init.redirect, "error")
    assert.equal(init.headers["Content-Type"], "application/json")
    assert.deepEqual(JSON.parse(init.body), { uid: "u1" })
  } finally {
    fetchState.restore()
  }
})

test("client: malformed or empty success bodies fail without demo fallback", async () => {
  for (const body of ["", "   ", "{not json", "<html>"]) {
    const client = await loadModule("src/lib/api/client.ts", configMock(false))
    const fetchState = captureFetch(() => fakeResponse({ status: 200, body }))
    let demoCalls = 0
    try {
      await assert.rejects(
        client.adminRequest("users.list", {}, () => {
          demoCalls++
          return []
        }),
        (error) => error.name === "AdminRequestError" && error.status === 200,
      )
      assert.equal(demoCalls, 0)
    } finally {
      fetchState.restore()
    }
  }
})

test("client: plain JSON result is returned without an envelope", async () => {
  const client = await loadModule("src/lib/api/client.ts", configMock(false))
  const fetchState = captureFetch(() => fakeResponse({
    status: 200,
    body: JSON.stringify({ users: [{ uid: "u1" }] }),
  }))
  try {
    assert.deepEqual(
      await client.adminRequest("users.list", {}, () => []),
      { users: [{ uid: "u1" }] },
    )
  } finally {
    fetchState.restore()
  }
})

test("auth demo: signed out on load, synthetic admin entry, and zero network calls", async () => {
  const auth = await loadModule("src/features/auth/authService.ts", configMock(true))
  const fetchState = captureFetch(() => {
    throw new Error("fetch must not run in demo mode")
  })

  try {
    assert.equal(await auth.fetchSession(), null)
    const session = auth.createDemoSession()
    assert.equal(session.user.uid, "demo-user-01")
    assert.equal(session.adminProfile.uid, "demo-user-01")
    assert.equal(session.adminProfile.consoleRole, "admin")
    await assert.rejects(auth.loginWithEmail("a@b.dev", "secret"), /demo mode/i)
    await auth.logout()
    assert.equal(fetchState.calls.length, 0)
  } finally {
    fetchState.restore()
  }
})

test("auth API: cookie session is read through auth.session and validated", async () => {
  const auth = await loadModule("src/features/auth/authService.ts", configMock(false))
  const fetchState = captureFetch(() => fakeResponse({
    status: 200,
    body: JSON.stringify({
      user: { uid: "u1", email: "editor@example.dev", displayName: "Editor", photoURL: null },
      consoleRole: "editor",
    }),
  }))

  try {
    const session = await auth.fetchSession()
    assert.equal(session.user.uid, "u1")
    assert.equal(session.adminProfile.consoleRole, "editor")
    assert.equal(fetchState.calls.length, 1)
    assert.equal(fetchState.calls[0].url, "/api/admin/operations/auth.session")
    assert.equal(fetchState.calls[0].init.credentials, "same-origin")
    assert.deepEqual(JSON.parse(fetchState.calls[0].init.body), {})
  } finally {
    fetchState.restore()
  }
})

test("auth API: unknown role and malformed sessions fail closed", async () => {
  const responses = [
    { user: { uid: "u1", email: null, displayName: "A" }, consoleRole: "owner" },
    { user: { uid: "", email: null, displayName: "A" }, consoleRole: "admin" },
    { user: { uid: "u1", email: null, displayName: "A", photoURL: 4 }, consoleRole: "admin" },
    { user: null, consoleRole: "admin" },
    { consoleRole: "admin" },
    null,
    [],
  ]

  for (const payload of responses) {
    const auth = await loadModule("src/features/auth/authService.ts", configMock(false))
    const fetchState = captureFetch(() => fakeResponse({ status: 200, body: JSON.stringify(payload) }))
    try {
      await assert.rejects(
        auth.fetchSession(),
        (error) => error.name === "AuthContractError",
      )
    } finally {
      fetchState.restore()
    }
  }
})

test("auth API: login rejects a user without a console role", async () => {
  const auth = await loadModule("src/features/auth/authService.ts", configMock(false))
  const fetchState = captureFetch(() => fakeResponse({
    status: 200,
    body: JSON.stringify({
      user: { uid: "u1", email: "a@b.dev", displayName: "A" },
      consoleRole: null,
    }),
  }))

  try {
    await assert.rejects(
      auth.loginWithEmail("a@b.dev", "secret"),
      (error) => error.name === "AuthContractError" && error.code === "auth/not-admin",
    )
    assert.equal(fetchState.calls[0].url, "/api/admin/operations/auth.login")
  } finally {
    fetchState.restore()
  }
})

test("auth API: logout requires a confirmed { ok: true } response", async () => {
  for (const payload of [{ ok: false }, { ok: "true" }, {}, null, []]) {
    const auth = await loadModule("src/features/auth/authService.ts", configMock(false))
    const fetchState = captureFetch(() => fakeResponse({
      status: 200,
      body: JSON.stringify(payload),
    }))
    try {
      await assert.rejects(
        auth.logout(),
        (error) => error.name === "AuthContractError" && error.code === "auth/malformed-logout",
      )
      assert.equal(fetchState.calls[0].url, "/api/admin/operations/auth.logout")
    } finally {
      fetchState.restore()
    }
  }

  const auth = await loadModule("src/features/auth/authService.ts", configMock(false))
  const fetchState = captureFetch(() => fakeResponse({
    status: 200,
    body: JSON.stringify({ ok: true }),
  }))
  try {
    await auth.logout()
  } finally {
    fetchState.restore()
  }
})

test("auth provider: login during a delayed startup session releases loading and wins identity", async () => {
  let resolveStartup
  let resolveLogin
  const startup = new Promise((resolve) => {
    resolveStartup = resolve
  })
  const login = new Promise((resolve) => {
    resolveLogin = resolve
  })

  const oldSession = {
    user: { uid: "old-user", email: null, displayName: "Old" },
    adminProfile: { uid: "old-user", email: null, displayName: "Old", consoleRole: "viewer" },
  }
  const newSession = {
    user: { uid: "new-user", email: null, displayName: "New" },
    adminProfile: { uid: "new-user", email: null, displayName: "New", consoleRole: "admin" },
  }

  const runtime = createHookRuntime()
  const queryClient = {
    cancelQueries: async () => undefined,
    clear: () => undefined,
  }
  const AuthContext = { Provider: "AuthContextProvider" }
  const authServiceMock = {
    createDemoSession: () => newSession,
    fetchSession: () => startup,
    loginWithEmail: () => login,
    logout: async () => undefined,
  }
  const mocks = new Map([
    ["react", runtime.react],
    ["react/jsx-runtime", {
      jsx: (type, props) => ({ type, props }),
      jsxs: (type, props) => ({ type, props }),
      Fragment: "Fragment",
    }],
    ["@tanstack/react-query", { useQueryClient: () => queryClient }],
    [path.join(root, "src/lib/config.ts"), { isDemoMode: false }],
    [path.join(root, "src/features/auth/AuthContext.ts"), { AuthContext }],
    [path.join(root, "src/features/auth/authService.ts"), authServiceMock],
  ])

  const providerModule = await loadModule("src/features/auth/AuthProvider.tsx", mocks)
  const render = () => {
    runtime.begin()
    const element = providerModule.AuthProvider({ children: null })
    return { value: element.props.value, effects: runtime.takeEffects() }
  }

  let { value, effects } = render()
  assert.equal(value.loading, true)
  for (const effect of effects) effect()

  const loginPromise = value.loginWithEmail("admin@example.dev", "secret")
  resolveLogin(newSession)
  await loginPromise

  ;({ value } = render())
  assert.equal(value.loading, false, "successful login must release the startup loading gate")
  assert.equal(value.user.uid, "new-user")

  // The old startup read finishes after login. It must not restore the old
  // identity or leave the panel stuck in its initial loading state.
  resolveStartup(oldSession)
  await new Promise((resolve) => setTimeout(resolve, 0))

  ;({ value } = render())
  assert.equal(value.user.uid, "new-user")
  assert.equal(value.loading, false)
})

test("session cache: identity change cancels/clears and stale responses never apply", async () => {
  const cacheModule = await loadModule("src/features/auth/sessionCache.ts")
  let cancels = 0
  let clears = 0
  let applied = 0

  const cache = {
    cancelQueries: async () => {
      cancels++
    },
    clear: () => {
      clears++
    },
  }

  cacheModule.resetSessionCache(cache)
  assert.equal(cancels, 1)
  assert.equal(clears, 1)

  let releaseCancel
  const slowCache = {
    cancelQueries: () => new Promise((resolve) => {
      releaseCancel = resolve
    }),
    clear: () => {
      clears++
    },
  }

  let currentGeneration = 2
  const pending = cacheModule.commitSessionAfterCancel(
    slowCache,
    1,
    (generation) => generation === currentGeneration,
    () => {
      applied++
    },
  )

  // Logout happens while the old session read is cancelling.
  currentGeneration = 3
  releaseCancel()
  assert.equal(await pending, false)
  assert.equal(applied, 0, "stale session must not apply")
  assert.equal(clears, 1, "stale commit must not clear the new cache")

  assert.equal(
    await cacheModule.commitSessionAfterCancel(
      cache,
      3,
      (generation) => generation === currentGeneration,
      () => {
        applied++
      },
    ),
    true,
  )
  assert.equal(applied, 1)
  assert.equal(clears, 2)
})
