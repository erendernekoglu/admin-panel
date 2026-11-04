import type { EditorialFeedMedia, EditorialLookContent, LookCollectionContent } from "../looks/model";

export type { EditorialFeedMedia, EditorialLookContent, LookCollectionContent };

/** Public (web) publication state of an editorial record. */
export interface PublicationDto {
  status: "draft" | "published" | "archived";
  publishedAt?: string;
  archivedAt?: string;
  revisionId?: string;
}

/** Intent to publish the saved revision to an app feed; independent of web state. */
export interface AppPublicationDto {
  status: "not_published" | "published" | "withdrawn";
  revisionId?: string;
  feedPostRef?: string;
  publishedAt?: string;
  withdrawnAt?: string;
}

export type AppFeedStatus = "published" | "hidden" | "removed" | "missing";
export type AppPublicationAction = "publish" | "withdraw";
export type AppPublicationOutcome = "published" | "updated" | "already_published" | "withdrawn" | "already_withdrawn";
export interface AppPublicationRequest {
  action: AppPublicationAction;
  expectedRevision: number;
  idempotencyKey: string;
}
export interface AppPublicationResult {
  outcome: AppPublicationOutcome;
}

export interface AdminRecordDto {
  id: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  webPublication: PublicationDto;
  appPublication?: AppPublicationDto;
  appFeedStatus?: AppFeedStatus;
}

export interface LookDto extends EditorialLookContent, AdminRecordDto {
  code: string;
}
export interface CollectionDto extends LookCollectionContent, AdminRecordDto {}
export interface PageDto<T> {
  items: T[];
  nextCursor: string | null;
}
export interface UploadDto {
  media: EditorialFeedMedia;
  assetId: string;
  previewUrl: string;
}
export interface DeleteMediaDto {
  status: "retained" | "pending" | "deleted";
}
export type Resource = "looks" | "collections";
export type PublicationAction = "publish" | "archive";

/**
 * Error raised by the independent admin adapter. `status` mirrors the HTTP
 * status of the live API (0 means an indeterminate transport failure) so the
 * UI can offer the same recovery actions in both modes.
 */
export class AdminClientError extends Error {
  readonly status: number;
  readonly field?: string;
  readonly code?: string;
  constructor(status: number, message: string, field?: string, code?: string) {
    super(message);
    this.status = status;
    this.field = field;
    this.code = code;
    this.name = "AdminClientError";
  }
}

/** Codes the live API may return for app-publication preconditions. */
const appPublicationErrors = new Map<string, string>([
  ["app_publication_disabled", "Bu sürüm yalnızca web yayını içindir. Uygulama / Keşfet işlemleri kapalıdır."],
  ["web_not_published", "Uygulamada yayımlamak veya güncellemek için önce web sürümünü yayımlayın. Uygulamaya yalnızca aktif web yayını aktarılır."],
  ["moderation_prevents_publish", "Moderasyon veya kaldırma sonrasında değişen gönderi kaydı otomatik yayımlamayı engelliyor. Yönetici incelemesi gerekiyor; bu düğme moderasyon kararını aşamaz."],
  ["publisher_config_missing", "Uygulama yayıncısının sunucu yapılandırması eksik. Yöneticinin yayıncı yapılandırmasını tamamlaması gerekiyor; bu ayar editörden gönderilmez."],
  ["publisher_unavailable", "Resmî yayıncının herkese açık profil kaydı eksik veya uygun değil. Yönetici yayıncı profilini hazırlamadan Keşfet yayını yapılamaz."],
  ["feed_ownership_conflict", "Keşfet gönderisinin sahipliği bu yayın işlemiyle uyuşmuyor. Üzerine yazılmadı; yöneticinin gönderi sahipliğini kontrol etmesi gerekiyor."],
  ["app_media_invalid", "Aktif web yayınındaki görseller uygulama yayını için uygun değil. Taslaktaki görselleri düzeltip kaydedin, web sürümünü yeniden yayımlayın ve ardından uygulama yayınını tekrar deneyin."],
]);

/**
 * A 409 that means "someone else changed the record". Slug collisions, media
 * limits and app-publication preconditions are actionable but are not
 * concurrency conflicts, so the editor must not offer a reload for them.
 */
export function isConcurrencyConflict(error: unknown): boolean {
  return (
    error instanceof AdminClientError &&
    error.status === 409 &&
    error.field !== "slug" &&
    error.code !== "media_limit" &&
    error.code !== "media_invalid" &&
    !appPublicationErrors.has(error.code ?? "")
  );
}

/** The live API does not implement this operation (yet). Never treated as success. */
export function isUnsupportedOperationError(error: unknown): boolean {
  return (
    error instanceof AdminClientError &&
    (error.status === 404 || error.status === 405 || error.status === 501 || error.code === "unsupported_operation")
  );
}

/** Map an HTTP failure body to a user-facing, actionable error. */
export function responseError(status: number, body: unknown): AdminClientError {
  let field: string | undefined;
  let code: string | undefined;
  if (body && typeof body === "object" && "error" in body && body.error && typeof body.error === "object") {
    if ("field" in body.error && typeof body.error.field === "string") field = body.error.field;
    if ("code" in body.error && typeof body.error.code === "string") code = body.error.code;
  }
  const appMessage = appPublicationErrors.get(code ?? "");
  if (appMessage) return new AdminClientError(status, appMessage, field, code);
  if (status === 409) {
    if (code === "conflict" && field === "slug") {
      return new AdminClientError(status, "Bu slug başka bir koleksiyon tarafından kullanılıyor. Farklı bir slug yazıp yeniden kaydedin; diğer girdileriniz korundu.", field, code);
    }
    if (code === "media_limit") {
      return new AdminClientError(status, "Bu kombin için görsel depolama sınırına ulaşıldı. Kullanılmayan görselleri kaldırıp taslağı kaydedin; bekleyen temizlik tamamlanınca yüklemeyi tekrar deneyin. Yayındaki görseller korunur. Sınır devam ederse yöneticiyle iletişime geçin.", field, code);
    }
    if (code === "media_invalid") {
      return new AdminClientError(status, "Görsel işlemi tamamlanamadı. Seçilen görseli kontrol edin; sorun sürerse yöneticiyle iletişime geçin. Taslak alanlarını düzenlemeye devam edebilirsiniz.", field, code);
    }
  }
  const messages: Record<number, string> = {
    400: "İstek doğrulanamadı. Alanları ve belirtilen sınırları kontrol edin.",
    401: "Oturumunuz sona erdi. Girdileriniz bu sayfada korunuyor; yeniden giriş yapıp işlemi tekrar deneyin.",
    403: "Bu işlem için editör yetkiniz yok. Girdileriniz değiştirilmedi.",
    404: "Kayıt veya görsel bulunamadı.",
    405: "Bu yönetim API'si istenen işlemi desteklemiyor. Dağıtımın sürümünü kontrol edin.",
    409: "Kayıt değişmiş veya işlem anahtarı başka bir içerikle kullanılmış. Üzerine yazılmadı. Girdilerinizi kopyaladıktan sonra sunucudan yeniden yükleyin.",
    413: "Dosya çok büyük. En fazla 4 MiB yükleyebilirsiniz.",
    415: "Desteklenmeyen görsel. JPEG, PNG veya WebP seçin.",
    422: "İçerik doğrulanamadı. Alanları ve görsel sahipliğini kontrol edin.",
    429: "Çok fazla istek gönderildi. Biraz bekleyip tekrar deneyin.",
    501: "Bu yönetim API'si istenen işlemi henüz uygulamıyor. Sunucu tarafında desteklenmesi gerekiyor.",
    503: "Yönetim hizmeti şu anda kullanılamıyor. Sunucu yapılandırmasını kontrol edin veya tekrar deneyin.",
  };
  return new AdminClientError(status, messages[status] ?? "Sunucudan kesin sonuç alınamadı. Aynı işlemi tekrar deneyin veya sunucudan yeniden yükleyin.", field, code);
}

/** Only same-origin admin operation endpoints may receive credentials. */
export function assertSameOriginAdminPath(path: string): string {
  if (!path.startsWith("/api/admin/") || /[\\\r\n]/.test(path)) {
    throw new AdminClientError(0, "Yalnızca aynı kaynaktaki admin API kullanılabilir.");
  }
  return path;
}
