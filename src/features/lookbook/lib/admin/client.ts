import {
  AdminRequestError,
  adminRequest as sharedAdminRequest,
} from "../../../../lib/api/client";
import { isDemoMode } from "../../../../lib/config";
import {
  AdminClientError,
  assertSameOriginAdminPath,
  responseError,
  type AdminRecordDto,
  type AppPublicationRequest,
  type AppPublicationResult,
  type CollectionDto,
  type DeleteMediaDto,
  type EditorialLookContent,
  type LookCollectionContent,
  type LookDto,
  type PageDto,
  type PublicationAction,
  type Resource,
  type UploadDto,
} from "./contract";
import { createLookbookDemoStore } from "./demoStore";
import { registerDemoMedia } from "./demoMedia";

export {
  AdminClientError,
  isConcurrencyConflict,
  isUnsupportedOperationError,
} from "./contract";
export type {
  AdminRecordDto,
  AppFeedStatus,
  AppPublicationAction,
  AppPublicationDto,
  AppPublicationOutcome,
  AppPublicationRequest,
  AppPublicationResult,
  CollectionDto,
  DeleteMediaDto,
  EditorialFeedMedia,
  EditorialLookContent,
  LookCollectionContent,
  LookDto,
  PageDto,
  PublicationAction,
  PublicationDto,
  Resource,
  UploadDto,
} from "./contract";

/**
 * Independent Lookbook API operations.
 *
 * Live mode: the shared `adminRequest` adapter POSTs JSON to the same-origin
 * `/api/admin/operations/<operation>` endpoint with the admin session cookie.
 * Demo mode: `adminRequest` invokes the local callback below instead, so this
 * feature never talks to a vendor SDK or a production host.
 */
export const LOOKBOOK_OPERATIONS = {
  sessionRead: "lookbook.session.read",
  sessionOpen: "lookbook.session.open",
  looksList: "lookbook.looks.list",
  looksGet: "lookbook.looks.get",
  looksCreate: "lookbook.looks.create",
  looksUpdate: "lookbook.looks.update",
  looksPublish: "lookbook.looks.publish",
  looksArchive: "lookbook.looks.archive",
  looksAppPublication: "lookbook.looks.appPublication",
  looksPrepare: "lookbook.looks.prepare",
  looksMediaUpload: "lookbook.looks.media.upload",
  looksMediaRead: "lookbook.looks.media.read",
  looksMediaDelete: "lookbook.looks.media.delete",
  collectionsList: "lookbook.collections.list",
  collectionsGet: "lookbook.collections.get",
  collectionsCreate: "lookbook.collections.create",
  collectionsUpdate: "lookbook.collections.update",
  collectionsPublish: "lookbook.collections.publish",
  collectionsArchive: "lookbook.collections.archive",
} as const;

export interface LookbookSession {
  uid: string;
  appChannelEnabled: boolean;
}

export type LookbookContent = EditorialLookContent | LookCollectionContent;
type RevisionedContent = LookbookContent & AdminRecordDto;

/** One module-level store: demo edits persist until the page reloads, then reset. */
const demoStore = createLookbookDemoStore();

function mapRequestError(error: AdminRequestError): AdminClientError {
  if (error.code === "unsupported_operation" || error.status === 405 || error.status === 501) {
    return new AdminClientError(
      error.status,
      "Bu yönetim API'si istenen işlemi uygulamıyor. Sunucu tarafında desteklenmesi gerekiyor.",
      error.field,
      error.code ?? "unsupported_operation",
    );
  }
  return responseError(error.status, {
    error: {
      ...(error.code ? { code: error.code } : {}),
      ...(error.field ? { field: error.field } : {}),
    },
  });
}

/** Run one operation through the shared contract and keep UI error metadata. */
async function request<T>(
  operation: string,
  payload: unknown,
  demo: () => T | Promise<T>,
  timeoutMs?: number,
): Promise<T> {
  try {
    return await sharedAdminRequest(operation, payload, demo, timeoutMs ? { timeoutMs } : {});
  } catch (error) {
    if (error instanceof AdminRequestError) throw mapRequestError(error);
    throw error;
  }
}

export function getLookbookSession(): Promise<LookbookSession> {
  return request<LookbookSession>(LOOKBOOK_OPERATIONS.sessionRead, {}, () => demoStore.getSession());
}

/**
 * Ask the admin API to (re)open the editor session. The API owns credential
 * verification; the browser never mints a session itself. In demo mode the
 * local store returns its synthetic editor.
 */
export function openLookbookSession(credentials: { password?: string } = {}): Promise<LookbookSession> {
  return request<LookbookSession>(
    LOOKBOOK_OPERATIONS.sessionOpen,
    { password: credentials.password ?? null },
    () => demoStore.openSession(),
  );
}

export function listRecords<T>(resource: Resource, cursor?: string, signal?: AbortSignal): Promise<PageDto<T>> {
  const payload = { cursor: cursor ?? null, limit: 20 };
  const work =
    resource === "looks"
      ? request<PageDto<T>>(LOOKBOOK_OPERATIONS.looksList, payload, () => demoStore.listLooks(cursor) as unknown as PageDto<T>)
      : request<PageDto<T>>(LOOKBOOK_OPERATIONS.collectionsList, payload, () => demoStore.listCollections(cursor) as unknown as PageDto<T>);
  return withSignal(work, signal);
}

export function getRecord<T extends LookbookContent>(resource: Resource, id: string, signal?: AbortSignal): Promise<T & AdminRecordDto> {
  const work =
    resource === "looks"
      ? request<T & AdminRecordDto>(LOOKBOOK_OPERATIONS.looksGet, { id }, () => demoStore.getLook(id) as unknown as T & AdminRecordDto)
      : request<T & AdminRecordDto>(LOOKBOOK_OPERATIONS.collectionsGet, { id }, () => demoStore.getCollection(id) as unknown as T & AdminRecordDto);
  return withSignal(work, signal);
}

export function prepareLook(idempotencyKey: string): Promise<{ lookId: string }> {
  return request<{ lookId: string }>(LOOKBOOK_OPERATIONS.looksPrepare, { idempotencyKey }, () => demoStore.prepareLook(idempotencyKey));
}

export function createLook(input: { idempotencyKey: string; content: EditorialLookContent }): Promise<{ lookId: string; code: string; revision: number }> {
  return request(LOOKBOOK_OPERATIONS.looksCreate, input, () => demoStore.createLook(input));
}

export function createCollection(input: { idempotencyKey: string; content: LookCollectionContent }): Promise<{ collection: CollectionDto }> {
  return request(LOOKBOOK_OPERATIONS.collectionsCreate, input, () => demoStore.createCollection(input));
}

export function updateRecord<T extends LookbookContent>(
  resource: Resource,
  id: string,
  input: { expectedRevision: number; content: T },
): Promise<T & AdminRecordDto> {
  if (resource === "looks") {
    const lookInput = { expectedRevision: input.expectedRevision, content: input.content as EditorialLookContent };
    return request<T & AdminRecordDto>(LOOKBOOK_OPERATIONS.looksUpdate, { id, ...lookInput }, () => demoStore.updateLook(id, lookInput).look as unknown as T & AdminRecordDto);
  }
  const collectionInput = { expectedRevision: input.expectedRevision, content: input.content as LookCollectionContent };
  return request<T & AdminRecordDto>(LOOKBOOK_OPERATIONS.collectionsUpdate, { id, ...collectionInput }, () => demoStore.updateCollection(id, collectionInput).collection as unknown as T & AdminRecordDto);
}

export function publishRecord<T extends LookbookContent>(
  resource: Resource,
  id: string,
  body: { expectedRevision: number; idempotencyKey: string },
): Promise<T & AdminRecordDto> {
  if (resource === "looks") {
    return request<T & AdminRecordDto>(LOOKBOOK_OPERATIONS.looksPublish, { id, ...body }, () => demoStore.publishLook(id, body).look as unknown as T & AdminRecordDto);
  }
  return request<T & AdminRecordDto>(LOOKBOOK_OPERATIONS.collectionsPublish, { id, ...body }, () => demoStore.publishCollection(id, body).collection as unknown as T & AdminRecordDto);
}

export function archiveRecord<T extends LookbookContent>(
  resource: Resource,
  id: string,
  body: { expectedRevision: number; idempotencyKey: string },
): Promise<T & AdminRecordDto> {
  if (resource === "looks") {
    return request<T & AdminRecordDto>(LOOKBOOK_OPERATIONS.looksArchive, { id, ...body }, () => demoStore.archiveLook(id, body).look as unknown as T & AdminRecordDto);
  }
  return request<T & AdminRecordDto>(LOOKBOOK_OPERATIONS.collectionsArchive, { id, ...body }, () => demoStore.archiveCollection(id, body).collection as unknown as T & AdminRecordDto);
}

export function actOnPublication(
  resource: Resource,
  id: string,
  action: PublicationAction,
  body: { expectedRevision: number; idempotencyKey: string },
): Promise<RevisionedContent> {
  return action === "publish" ? publishRecord(resource, id, body) : archiveRecord(resource, id, body);
}

export function actOnAppPublication(id: string, requestBody: AppPublicationRequest): Promise<{ result: AppPublicationResult; look: LookDto }> {
  return request(LOOKBOOK_OPERATIONS.looksAppPublication, { id, ...requestBody }, () => demoStore.actOnAppPublication(id, requestBody));
}

export function deleteLookMedia(lookId: string, assetId: string): Promise<DeleteMediaDto> {
  return request<DeleteMediaDto>(LOOKBOOK_OPERATIONS.looksMediaDelete, { lookId, assetId }, () => demoStore.deleteMedia(lookId, assetId));
}

/**
 * Read a private gallery image as a data URL.
 *
 * The independent API must implement this operation; the panel never performs
 * a bare GET against an image endpoint (that would bypass the operation
 * contract and its authorization/error reporting).
 */
export function readLookMedia(lookId: string, assetId: string): Promise<{ dataUrl: string }> {
  return request<{ dataUrl: string }>(
    LOOKBOOK_OPERATIONS.looksMediaRead,
    { lookId, assetId },
    () => {
      throw new AdminClientError(501, "Demo modunda görsel okuma yerel kayıtlardan yapılır; canlı API işlemi çağrılmaz.");
    },
  );
}

// ---------------------------------------------------------------------------
// Legacy virtual-path adapter
//
// The editor and list components were written against a small virtual REST
// surface (`/api/admin/looks/:id`, `/api/admin/session`, ...). They keep those
// call sites; this adapter maps each one onto the operation contract so there
// is exactly one transport and no second network path.
// ---------------------------------------------------------------------------

export interface AdminFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export function resourcePath(resource: Resource, id?: string): string {
  return `/api/admin/${resource}${id ? `/${encodeURIComponent(id)}` : ""}`;
}

async function withSignal<T>(work: Promise<T>, signal?: AbortSignal): Promise<T> {
  const value = await work;
  // The shared contract has no cancellation channel; callers only need to know
  // that their component unmounted so they can ignore the result.
  if (signal?.aborted) throw new DOMException("The operation was aborted.", "AbortError");
  return value;
}

function unsupportedPath(path: string): AdminClientError {
  return new AdminClientError(501, `Bu yönetim API'si "${path}" yolunu uygulamıyor. İşlem desteklenmiyor.`);
}

export async function adminFetch<T>(path: string, options: AdminFetchOptions = {}): Promise<T> {
  const safePath = assertSameOriginAdminPath(path);
  const url = new URL(safePath, "https://admin.invalid");
  const segments = url.pathname.split("/").filter(Boolean).slice(2);
  const method = options.method ?? "GET";
  const body = options.body as Record<string, unknown> | undefined;
  const work = (async (): Promise<unknown> => {
    if (segments.length === 1 && segments[0] === "session") {
      if (method === "GET") return getLookbookSession();
      if (method === "POST") return openLookbookSession({ password: typeof body?.password === "string" ? body.password : undefined });
      throw unsupportedPath(path);
    }

    if (segments[0] === "looks" || segments[0] === "collections") {
      const resource = segments[0] as Resource;
      if (segments.length === 1) {
        if (method === "GET") return listRecords(resource, url.searchParams.get("cursor") ?? undefined);
        if (method === "POST") {
          const input = body as { idempotencyKey?: unknown; content?: unknown };
          if (typeof input?.idempotencyKey !== "string" || !input.content) throw new AdminClientError(400, "Oluşturma isteği eksik veya geçersiz.");
          if (resource === "looks") return createLook({ idempotencyKey: input.idempotencyKey, content: input.content as EditorialLookContent });
          return createCollection({ idempotencyKey: input.idempotencyKey, content: input.content as LookCollectionContent });
        }
        throw unsupportedPath(path);
      }

      // Preparing allocates a media target before the draft is created, so the
      // "prepare" keyword must be matched before the generic record branch.
      if (segments.length === 2 && segments[1] === "prepare" && resource === "looks") {
        if (method !== "POST") throw unsupportedPath(path);
        if (typeof body?.idempotencyKey !== "string" || !body.idempotencyKey.trim()) {
          throw new AdminClientError(400, "Hazırlık anahtarı eksik veya geçersiz.");
        }
        return prepareLook(body.idempotencyKey);
      }

      const id = decodeURIComponent(segments[1]);
      if (segments.length === 2) {
        if (method === "GET") {
          const record = await getRecord(resource, id);
          return resource === "looks" ? { look: record } : { collection: record };
        }
        if (method === "PATCH") {
          if (!body || typeof body.expectedRevision !== "number" || !body.content) throw new AdminClientError(400, "Güncelleme isteği eksik veya geçersiz.");
          const record = await updateRecord(resource, id, { expectedRevision: body.expectedRevision, content: body.content as LookbookContent });
          return resource === "looks" ? { look: record } : { collection: record };
        }
        throw unsupportedPath(path);
      }

      if (segments.length === 3 && (segments[2] === "publish" || segments[2] === "archive")) {
        if (method !== "POST" || !body || typeof body.expectedRevision !== "number" || typeof body.idempotencyKey !== "string") {
          throw new AdminClientError(400, "Yayın isteği eksik veya geçersiz.");
        }
        const record = await actOnPublication(resource, id, segments[2], {
          expectedRevision: body.expectedRevision,
          idempotencyKey: body.idempotencyKey,
        });
        return resource === "looks" ? { look: record } : { collection: record };
      }

      if (segments.length === 3 && segments[2] === "app-publication" && resource === "looks") {
        if (method !== "POST" || !body) throw new AdminClientError(400, "Uygulama yayın isteği eksik.");
        return actOnAppPublication(id, body as unknown as AppPublicationRequest);
      }

      if (segments.length === 4 && segments[2] === "media" && resource === "looks" && method === "DELETE") {
        return deleteLookMedia(id, decodeURIComponent(segments[3]));
      }
    }

    throw unsupportedPath(path);
  })();

  return withSignal(work, options.signal) as Promise<T>;
}

// ---------------------------------------------------------------------------
// Media upload
// ---------------------------------------------------------------------------

const UPLOAD_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

async function measureDemoImage(file: File): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap !== "function") {
    throw new AdminClientError(415, "Bu tarayıcı görsel boyutlarını okuyamıyor. Görsel doğrulanmadan yüklenmedi.");
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new AdminClientError(415, "Görsel çözülemedi veya bozuk. Geçerli bir JPEG, PNG veya WebP seçin.");
  }
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  if (!Number.isFinite(size.width) || !Number.isFinite(size.height) || size.width <= 0 || size.height <= 0) {
    throw new AdminClientError(415, "Görsel boyutları okunamadı. Geçerli bir görsel seçin.");
  }
  return size;
}

function readFileAsBase64(file: File, onProgress: (percent: number) => void, signal: AbortSignal): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    if (typeof FileReader !== "function") {
      reject(new AdminClientError(501, "Bu tarayıcı dosya okumayı desteklemiyor; görsel yüklenemedi."));
      return;
    }
    const reader = new FileReader();
    const abort = () => reader.abort();
    const cleanup = () => signal.removeEventListener("abort", abort);
    reader.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    reader.onerror = () => {
      cleanup();
      reject(new AdminClientError(415, "Görsel okunamadı. Dosyayı kontrol edip yeniden deneyin."));
    };
    reader.onabort = () => {
      cleanup();
      reject(new AdminClientError(0, "Yükleme iptal edildi."));
    };
    reader.onload = () => {
      cleanup();
      const result = typeof reader.result === "string" ? reader.result : "";
      const base64 = result.includes(",") ? result.slice(result.indexOf(",") + 1) : result;
      if (!base64) {
        reject(new AdminClientError(415, "Görsel içeriği boş; dosyayı kontrol edip yeniden deneyin."));
        return;
      }
      resolve(base64);
    };
    if (signal.aborted) {
      reject(new AdminClientError(0, "Yükleme iptal edildi."));
      return;
    }
    signal.addEventListener("abort", abort, { once: true });
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a gallery image.
 *
 * Demo mode measures the file locally, keeps the chosen bytes as a local object
 * URL and returns synthetic media metadata; no request leaves the browser.
 * Live mode sends the file as base64 through the same JSON operation contract
 * and reports the API's own result or error. Progress reflects the local read,
 * not a server acknowledgement.
 */
export async function uploadMedia(
  lookId: string,
  file: File,
  role: "normal" | "try_on",
  createKey: string | undefined,
  onProgress: (percent: number) => void,
  signal: AbortSignal,
): Promise<UploadDto> {
  if (!UPLOAD_MIME_TYPES.includes(file.type)) throw new AdminClientError(415, "JPEG, PNG veya WebP görsel seçin.");
  if (!file.size || file.size > MAX_UPLOAD_BYTES) throw new AdminClientError(413, "Dosya boş olmamalı ve 4 MiB sınırını aşmamalı.");

  const mediaRole = role === "normal" ? "look" : "try_on";
  if (isDemoMode) {
    const size = await measureDemoImage(file);
    if (signal.aborted) throw new AdminClientError(0, "Yükleme iptal edildi.");
    return request<UploadDto>(
      LOOKBOOK_OPERATIONS.looksMediaUpload,
      { lookId, role: mediaRole, width: size.width, height: size.height, createKey: createKey ?? null },
      () => {
        const result = demoStore.upload(lookId, { role: mediaRole, width: size.width, height: size.height });
        const objectUrl = URL.createObjectURL(file);
        registerDemoMedia(result.media.storagePath, objectUrl);
        onProgress(100);
        return { ...result, previewUrl: objectUrl };
      },
    );
  }

  onProgress(0);
  const base64 = await readFileAsBase64(file, onProgress, signal);
  return request<UploadDto>(
    LOOKBOOK_OPERATIONS.looksMediaUpload,
    {
      lookId,
      role: mediaRole,
      createKey: createKey ?? null,
      fileName: file.name,
      mimeType: file.type,
      byteLength: file.size,
      base64,
    },
    () => {
      throw new AdminClientError(0, "Demo verisi canlı istekte kullanılamaz.");
    },
    120_000,
  );
}
