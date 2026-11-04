import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { createTsLoader } from "./helpers/load-ts.mjs";

const root = path.resolve(import.meta.dirname, "..");
const lookbook = (file) => path.join(root, "src/features/lookbook", file);
const admin = (file) => lookbook(`lib/admin/${file}`);

async function loadDemoGraph() {
  const load = createTsLoader({ env: { VITE_DATA_MODE: "demo" } });
  const demo = await load(admin("demoStore.ts"));
  const contract = await load(admin("contract.ts"));
  const validation = await load(lookbook("lib/looks/validation.ts"));
  const media = await load(lookbook("lib/looks/media.ts"));
  const demoMedia = await load(admin("demoMedia.ts"));
  return { demo: demo.namespace, contract: contract.namespace, validation: validation.namespace, media: media.namespace, demoMedia: demoMedia.namespace };
}

async function loadApiClient() {
  const load = createTsLoader({ env: { VITE_DATA_MODE: "api" } });
  const client = await load(admin("client.ts"));
  return client.namespace;
}

test("demo fixtures are synthetic, valid and keep canonical media ownership", async () => {
  const { demo, validation, media } = await loadDemoGraph();
  const looks = demo.demoLooks();
  assert.equal(looks.length, 6);
  assert.equal(demo.demoCollections().length, 3);

  for (const look of looks) {
    assert.match(look.id, /^[A-Za-z0-9_-]{1,128}$/);
    assert.match(look.code, /^LB-\d{4}$/);
    assert.ok(look.media.length >= 1);
    for (const item of look.media) {
      assert.match(item.url, /^\/api\/look-media\//);
      assert.match(item.storagePath, new RegExp(`^editorialMedia/${look.id}/assets/[A-Za-z0-9_-]+\\.jpg$`));
    }
    const content = {
      title: look.title,
      kind: look.kind,
      media: look.media,
      caption: look.caption,
      tags: look.tags,
      ...(look.parts !== undefined ? { parts: look.parts } : {}),
      ...(look.occasionIds !== undefined ? { occasionIds: look.occasionIds } : {}),
      ...(look.styleNote !== undefined ? { styleNote: look.styleNote } : {}),
      ...(look.relatedLooks !== undefined ? { relatedLooks: look.relatedLooks } : {}),
    };
    const validated = validation.validateLookContent(content);
    media.validateMediaOwnership(validated, look.id);
  }
});

test("demo session uses the shared demo identity and mutations stay isolated", async () => {
  const { demo } = await loadDemoGraph();
  const store = demo.createLookbookDemoStore();
  assert.equal(demo.DEMO_UID, "demo-user-01");
  assert.equal(store.getSession().uid, "demo-user-01");
  assert.equal(store.openSession().uid, "demo-user-01");

  const other = demo.createLookbookDemoStore();
  const created = store.createLook({
    idempotencyKey: "create-1",
    content: { title: "Synthetic draft", kind: "photo", caption: "", tags: [], media: demo.demoLooks()[0].media.slice(0, 1) },
  });
  assert.equal(store.getLook(created.lookId).title, "Synthetic draft");
  assert.throws(() => other.getLook(created.lookId));
  assert.equal(store.listLooks().items.length, 7);
  assert.equal(other.listLooks().items.length, 6);
});

test("prepare -> upload -> create applies the submitted draft and reveals it", async () => {
  const { demo } = await loadDemoGraph();
  const store = demo.createLookbookDemoStore();
  const prepared = store.prepareLook("prepare-key");
  assert.equal(store.listLooks().items.some((look) => look.id === prepared.lookId), false);
  assert.equal(store.getLook(prepared.lookId).title, "");

  const upload = store.upload(prepared.lookId, { role: "look", width: 900, height: 1200 });
  assert.equal(upload.media.width, 900);
  assert.equal(upload.media.role, undefined);

  const created = store.createLook({
    idempotencyKey: "prepare-key",
    content: {
      title: "Completed prepared draft",
      kind: "lookbook",
      caption: "Synthetic caption",
      tags: ["demo"],
      media: [upload.media],
      occasionIds: ["casual"],
      parts: [{ hidden: false, name: "Demo part", imageUrl: upload.media.url, storagePath: upload.media.storagePath }],
    },
  });
  assert.equal(created.lookId, prepared.lookId);

  const completed = store.getLook(prepared.lookId);
  assert.equal(completed.title, "Completed prepared draft");
  assert.equal(completed.kind, "lookbook");
  assert.equal(completed.tags[0], "demo");
  assert.equal(completed.media.length, 1);
  assert.equal(completed.parts.length, 1);
  assert.equal(completed.webPublication.status, "draft");
  assert.equal(store.listLooks().items.some((look) => look.id === prepared.lookId), true);

  // Retrying the same idempotency key returns the same receipt and does not overwrite content.
  const retry = store.createLook({
    idempotencyKey: "prepare-key",
    content: { title: "Should be ignored", kind: "photo", caption: "", tags: [], media: [] },
  });
  assert.equal(retry.lookId, prepared.lookId);
  assert.equal(retry.revision, completed.revision);
  assert.equal(store.getLook(prepared.lookId).title, "Completed prepared draft");
});

test("stale revisions raise a concurrency conflict the UI can act on", async () => {
  const { demo, contract } = await loadDemoGraph();
  const store = demo.createLookbookDemoStore();
  const look = store.getLook("look_linen_layers");

  assert.throws(
    () => store.updateLook(look.id, { expectedRevision: look.revision - 1, content: { ...look, title: "Stale" } }),
    (error) => error.status === 409 && error.field === "revision" && contract.isConcurrencyConflict(error),
  );
  assert.equal(store.getLook(look.id).title, "Linen Layers for Late Summer");

  const updated = store.updateLook(look.id, { expectedRevision: look.revision, content: { ...look, title: "Fresh" } });
  assert.equal(updated.look.revision, look.revision + 1);
  assert.equal(updated.look.title, "Fresh");
});

test("demo image resolution never produces a server URL", async () => {
  const { demoMedia } = await loadDemoGraph();
  const storagePath = "editorialMedia/look_demo/assets/asset_demo.jpg";

  const placeholder = demoMedia.demoPlaceholderDataUrl(storagePath, "Demo <look>");
  assert.match(placeholder, /^data:image\/svg\+xml/);
  assert.equal(placeholder.includes("/api/"), false);
  assert.equal(placeholder.includes("<look>"), false, "labels must be XML-escaped");

  assert.equal(demoMedia.hasDemoMedia(storagePath), false);
  assert.equal(demoMedia.demoMediaSrc(storagePath, "Demo"), demoMedia.demoPlaceholderDataUrl(storagePath, "Demo"));

  demoMedia.registerDemoMedia(storagePath, "blob:local-demo");
  assert.equal(demoMedia.demoMediaSrc(storagePath, "Demo"), "blob:local-demo");
});

test("legacy adminFetch stays same-origin and uses no network in demo mode", async () => {
  const load = createTsLoader({ env: { VITE_DATA_MODE: "demo" } });
  const client = (await load(admin("client.ts"))).namespace;

  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    throw new Error("demo mode must not use fetch");
  };
  try {
    const page = await client.adminFetch("/api/admin/looks");
    assert.equal(page.items.length, 6);
    assert.equal(page.nextCursor, null);

    const created = await client.adminFetch("/api/admin/looks", {
      method: "POST",
      body: {
        idempotencyKey: "legacy-create",
        content: { title: "Legacy adapter", kind: "photo", caption: "", tags: [], media: [] },
      },
    });
    const loaded = await client.adminFetch(`/api/admin/looks/${created.lookId}`);
    assert.equal(loaded.look.title, "Legacy adapter");

    const session = await client.adminFetch("/api/admin/session");
    assert.equal(session.uid, "demo-user-01");

    await assert.rejects(
      client.adminFetch("https://attacker.example/api/admin/session"),
      (error) => error instanceof client.AdminClientError && error.status === 0,
    );
    await assert.rejects(
      client.adminFetch("//attacker.example/api/admin/session"),
      (error) => error instanceof client.AdminClientError && error.status === 0,
    );
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("legacy adminFetch prepare route allocates the draft that create completes", async () => {
  const load = createTsLoader({ env: { VITE_DATA_MODE: "demo" } });
  const client = (await load(admin("client.ts"))).namespace;

  const prepared = await client.adminFetch("/api/admin/looks/prepare", {
    method: "POST",
    body: { idempotencyKey: "legacy-prepare" },
  });
  assert.match(prepared.lookId, /^look_demo_/);

  // A prepared shell is a media target only; it stays out of the visible list.
  const before = await client.adminFetch("/api/admin/looks");
  assert.equal(before.items.some((look) => look.id === prepared.lookId), false);

  await assert.rejects(
    client.adminFetch("/api/admin/looks/prepare", { method: "POST", body: { idempotencyKey: "  " } }),
    (error) => error instanceof client.AdminClientError && error.status === 400,
  );
  await assert.rejects(
    client.adminFetch("/api/admin/looks/prepare", { method: "POST", body: {} }),
    (error) => error instanceof client.AdminClientError && error.status === 400,
  );

  const media = {
    storagePath: `editorialMedia/${prepared.lookId}/assets/asset_1.jpg`,
    url: `/api/look-media/${prepared.lookId}/asset_1`,
    width: 900,
    height: 1200,
  };
  const created = await client.adminFetch("/api/admin/looks", {
    method: "POST",
    body: {
      idempotencyKey: "legacy-prepare",
      content: { title: "Prepared through the adapter", kind: "lookbook", caption: "", tags: ["demo"], media: [media], parts: [] },
    },
  });
  assert.equal(created.lookId, prepared.lookId);

  const saved = await client.adminFetch(`/api/admin/looks/${prepared.lookId}`);
  assert.equal(saved.look.title, "Prepared through the adapter");
  assert.equal(saved.look.media.length, 1);
  assert.equal(saved.look.media[0].storagePath, media.storagePath);
  assert.equal(saved.look.media[0].width, 900);
  assert.equal(saved.look.webPublication.status, "draft");

  const after = await client.adminFetch("/api/admin/looks");
  assert.equal(after.items.some((look) => look.id === prepared.lookId), true);
});

test("live failures keep status, field and code and use the operation endpoint", async () => {
  const client = await loadApiClient();
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return Response.json({ error: { code: "conflict", field: "slug" } }, { status: 409 });
  };
  try {
    await assert.rejects(
      client.adminFetch("/api/admin/collections/col_1", {
        method: "PATCH",
        body: { expectedRevision: 1, content: { title: "Renamed", slug: "quiet-layers", lookIds: [] } },
      }),
      (error) =>
        error instanceof client.AdminClientError &&
        error.status === 409 &&
        error.field === "slug" &&
        error.code === "conflict" &&
        /slug/.test(error.message),
    );

    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, "/api/admin/operations/lookbook.collections.update");
    assert.equal(requests[0].options.method, "POST");
    assert.equal(requests[0].options.credentials, "same-origin");
    const payload = JSON.parse(requests[0].options.body);
    assert.equal(payload.id, "col_1");
    assert.equal(payload.expectedRevision, 1);
    assert.equal(payload.content.slug, "quiet-layers");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("unsupported live operations are reported as unsupported, not as success", async () => {
  const client = await loadApiClient();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ error: { code: "unsupported_operation" } }, { status: 501 });
  try {
    await assert.rejects(
      client.getLookbookSession(),
      (error) => error instanceof client.AdminClientError && client.isUnsupportedOperationError(error),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("live media read uses the media.read operation and returns a data URL", async () => {
  const client = await loadApiClient();
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return Response.json({ dataUrl: "data:image/png;base64,AAAA" });
  };
  try {
    const result = await client.readLookMedia("look_1", "asset_1");
    assert.equal(result.dataUrl, "data:image/png;base64,AAAA");
    assert.equal(requests[0].url, "/api/admin/operations/lookbook.looks.media.read");
    assert.deepEqual(JSON.parse(requests[0].options.body), { lookId: "look_1", assetId: "asset_1" });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("live upload is a JSON operation with truthful progress and no XHR", async () => {
  const client = await loadApiClient();
  const originalFetch = globalThis.fetch;
  const originalFileReader = globalThis.FileReader;
  const originalXhr = globalThis.XMLHttpRequest;
  const requests = [];
  let xhrConstructed = false;

  class FakeFileReader {
    constructor() {
      this.result = null;
      this.onload = null;
      this.onerror = null;
      this.onabort = null;
      this.onprogress = null;
    }
    readAsDataURL() {
      this.onprogress?.({ lengthComputable: true, loaded: 3, total: 3 });
      this.result = "data:image/png;base64,AQID";
      queueMicrotask(() => this.onload?.());
    }
    abort() {
      this.onabort?.();
    }
  }

  globalThis.FileReader = FakeFileReader;
  globalThis.XMLHttpRequest = class {
    constructor() {
      xhrConstructed = true;
      throw new Error("XHR must not be used");
    }
  };
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return Response.json({
      media: { storagePath: "editorialMedia/look_1/assets/asset_1.jpg", url: "/api/look-media/look_1/asset_1", width: 10, height: 20 },
      assetId: "asset_1",
      previewUrl: "",
    });
  };
  try {
    const progress = [];
    const file = new File([new Uint8Array([1, 2, 3])], "demo.png", { type: "image/png" });
    const result = await client.uploadMedia("look_1", file, "try_on", "create-key", (value) => progress.push(value), new AbortController().signal);

    assert.equal(result.assetId, "asset_1");
    assert.deepEqual(progress, [0, 100]);
    assert.equal(xhrConstructed, false);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, "/api/admin/operations/lookbook.looks.media.upload");
    const payload = JSON.parse(requests[0].options.body);
    assert.equal(payload.lookId, "look_1");
    assert.equal(payload.role, "try_on");
    assert.equal(payload.createKey, "create-key");
    assert.equal(payload.base64, "AQID");
    assert.equal(payload.mimeType, "image/png");
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.FileReader = originalFileReader;
    globalThis.XMLHttpRequest = originalXhr;
  }
});

test("demo upload rejects an undecodable image instead of pretending it was accepted", async () => {
  const load = createTsLoader({ env: { VITE_DATA_MODE: "demo" } });
  const client = (await load(admin("client.ts"))).namespace;
  const originalBitmap = globalThis.createImageBitmap;
  const originalCreateObjectURL = URL.createObjectURL;
  let objectUrls = 0;
  globalThis.createImageBitmap = async () => {
    throw new Error("decode failed");
  };
  URL.createObjectURL = () => {
    objectUrls += 1;
    return "blob:unexpected";
  };
  try {
    const file = new File([new Uint8Array([1, 2, 3])], "broken.png", { type: "image/png" });
    await assert.rejects(
      client.uploadMedia("look_1", file, "normal", undefined, () => {}, new AbortController().signal),
      (error) => error instanceof client.AdminClientError && error.status === 415,
    );
    assert.equal(objectUrls, 0);
  } finally {
    globalThis.createImageBitmap = originalBitmap;
    URL.createObjectURL = originalCreateObjectURL;
  }
});
