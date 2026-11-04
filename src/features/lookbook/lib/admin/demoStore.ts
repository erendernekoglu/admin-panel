import {
  AdminClientError,
  type AppFeedStatus,
  type AppPublicationRequest,
  type AppPublicationResult,
  type CollectionDto,
  type DeleteMediaDto,
  type EditorialFeedMedia,
  type EditorialLookContent,
  type LookCollectionContent,
  type LookDto,
  type PageDto,
  type UploadDto,
} from "./contract";

/**
 * In-memory demo data for the Lookbook screen.
 *
 * Everything here is fictional and synthetic: no customer content, no real
 * media and no production identifiers. The store is created once per module
 * load, so a page reload returns to the seed state. It never performs network
 * I/O; the shared `adminRequest` adapter only invokes it in demo mode.
 */

export interface LookbookDemoSession {
  uid: string;
  appChannelEnabled: boolean;
}

const PAGE_SIZE = 20;
/** Must match the shared demo identity used by the auth provider. */
export const DEMO_UID = "demo-user-01";

const clone = <T>(value: T): T => structuredClone(value);
const now = () => new Date().toISOString();

function media(lookId: string, assetId: string, width: number, height: number, role?: "look" | "try_on"): EditorialFeedMedia {
  return {
    storagePath: `editorialMedia/${lookId}/assets/${assetId}.jpg`,
    url: `/api/look-media/${lookId}/${assetId}`,
    width,
    height,
    ...(role ? { role } : {}),
  };
}

function page<T>(items: T[], cursor?: string | null): PageDto<T> {
  const offset = cursor ? Number.parseInt(cursor, 10) : 0;
  if (!Number.isInteger(offset) || offset < 0) {
    throw new AdminClientError(400, "Geçersiz sayfa imleci. Listeyi sunucudan yeniden yükleyin.");
  }
  return {
    items: clone(items.slice(offset, offset + PAGE_SIZE)),
    nextCursor: offset + PAGE_SIZE < items.length ? String(offset + PAGE_SIZE) : null,
  };
}

function newestFirst<T extends { updatedAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function revisionConflict(): AdminClientError {
  return new AdminClientError(
    409,
    "Kayıt siz düzenlerken değişti. Üzerine yazılmadı; girdilerinizi kopyaladıktan sonra sunucudan yeniden yükleyin.",
    "revision",
    "revision_conflict",
  );
}

function notFound(): AdminClientError {
  return new AdminClientError(404, "Kayıt bulunamadı. Silinmiş olabilir; listeyi yeniden yükleyin.");
}

export function demoLooks(): LookDto[] {
  return [
    {
      id: "look_linen_layers",
      code: "LB-1042",
      revision: 4,
      createdAt: "2026-09-02T08:15:00.000Z",
      updatedAt: "2026-10-21T16:40:00.000Z",
      webPublication: {
        status: "published",
        revisionId: "look_linen_layers_r4",
        publishedAt: "2026-10-21T16:42:00.000Z",
      },
      appPublication: {
        status: "published",
        revisionId: "look_linen_layers_r4",
        feedPostRef: "feed_linen_layers",
        publishedAt: "2026-10-21T16:45:00.000Z",
      },
      appFeedStatus: "published",
      title: "Linen Layers for Late Summer",
      kind: "lookbook",
      caption: "Two breathable layers in one quiet palette, styled for a slow afternoon by the water.",
      tags: ["linen", "summer", "minimal"],
      media: [
        media("look_linen_layers", "asset_linen_1", 1200, 1600),
        media("look_linen_layers", "asset_linen_2", 1200, 1600),
      ],
      parts: [
        {
          hidden: false,
          name: "Relaxed linen shirt",
          imageUrl: "/api/look-media/look_linen_layers/asset_linen_1",
          storagePath: "editorialMedia/look_linen_layers/assets/asset_linen_1.jpg",
          garmentId: "garment_linen_shirt",
          shoppingLinks: [
            {
              id: "link_linen_shirt",
              url: "https://northwind-atelier.example/products/relaxed-linen-shirt",
              retailer: "Northwind Atelier",
              label: "Relaxed linen shirt",
              relation: "exact",
            },
          ],
        },
        {
          hidden: false,
          name: "Wide-leg trousers",
          imageUrl: "/api/look-media/look_linen_layers/asset_linen_2",
          storagePath: "editorialMedia/look_linen_layers/assets/asset_linen_2.jpg",
          shoppingLinks: [
            {
              id: "link_linen_trousers",
              url: "https://harbor-lane.example/products/wide-leg-trousers",
              retailer: "Harbor Lane",
              relation: "similar",
            },
          ],
        },
      ],
      occasionIds: ["casual", "travel"],
      styleNote: "Keep the shirt open over a tonal tank and let the trousers break once at the ankle.",
      relatedLooks: [{ lookId: "look_weekend_denim", label: "Weekend denim" }],
    },
    {
      id: "look_monochrome_office",
      code: "LB-1043",
      revision: 2,
      createdAt: "2026-09-14T10:05:00.000Z",
      updatedAt: "2026-10-19T11:20:00.000Z",
      webPublication: {
        status: "published",
        revisionId: "look_monochrome_office_r2",
        publishedAt: "2026-10-19T11:22:00.000Z",
      },
      appPublication: { status: "not_published" },
      title: "Monochrome Office Uniform",
      kind: "photo",
      caption: "One colour, three textures. A desk-to-dinner uniform that never needs a second thought.",
      tags: ["office", "monochrome", "tailoring"],
      media: [media("look_monochrome_office", "asset_mono_1", 1200, 1600)],
      parts: [
        {
          hidden: false,
          name: "Cropped wool blazer",
          imageUrl: "/api/look-media/look_monochrome_office/asset_mono_1",
          storagePath: "editorialMedia/look_monochrome_office/assets/asset_mono_1.jpg",
          shoppingLinks: [
            {
              id: "link_mono_blazer",
              url: "https://atelier-northwind.example/products/cropped-wool-blazer",
              retailer: "Atelier Northwind",
              relation: "similar",
            },
          ],
        },
        { hidden: true },
      ],
      occasionIds: ["work", "formal"],
      styleNote: "Matte wool against a fine knit keeps the single colour from reading flat.",
    },
    {
      id: "look_weekend_denim",
      code: "LB-1044",
      revision: 1,
      createdAt: "2026-10-02T09:30:00.000Z",
      updatedAt: "2026-10-16T14:10:00.000Z",
      webPublication: { status: "draft" },
      appPublication: { status: "not_published" },
      title: "Weekend Denim, Softened",
      kind: "lookbook",
      caption: "Rigid denim balanced with a brushed overshirt and worn-in sneakers.",
      tags: ["denim", "weekend"],
      media: [
        media("look_weekend_denim", "asset_denim_1", 1200, 1600),
        media("look_weekend_denim", "asset_denim_2", 1200, 1600, "try_on"),
      ],
      parts: [
        {
          hidden: false,
          name: "Brushed overshirt",
          imageUrl: "/api/look-media/look_weekend_denim/asset_denim_1",
          storagePath: "editorialMedia/look_weekend_denim/assets/asset_denim_1.jpg",
        },
      ],
      occasionIds: ["casual", "brunch"],
    },
    {
      id: "look_city_rain",
      code: "LB-1045",
      revision: 3,
      createdAt: "2026-08-21T07:40:00.000Z",
      updatedAt: "2026-10-12T18:05:00.000Z",
      webPublication: {
        status: "published",
        revisionId: "look_city_rain_r3",
        publishedAt: "2026-10-12T18:06:00.000Z",
      },
      appPublication: { status: "withdrawn", revisionId: "look_city_rain_r2", feedPostRef: "feed_city_rain", publishedAt: "2026-10-01T08:00:00.000Z", withdrawnAt: "2026-10-10T09:15:00.000Z" },
      appFeedStatus: "missing",
      title: "City Rain, Handled",
      kind: "photo",
      caption: "A compact rain layer over wide trousers, built for a commute that will not stay dry.",
      tags: ["rain", "commute", "outerwear"],
      media: [media("look_city_rain", "asset_rain_1", 1200, 1600)],
      occasionIds: ["casual", "work"],
      styleNote: "Cropped outer layers keep the hem clear of puddles without shortening the silhouette.",
    },
    {
      id: "look_archive_tailoring",
      code: "LB-0988",
      revision: 6,
      createdAt: "2026-05-04T12:00:00.000Z",
      updatedAt: "2026-09-28T08:45:00.000Z",
      webPublication: {
        status: "archived",
        revisionId: "look_archive_tailoring_r5",
        publishedAt: "2026-07-11T10:00:00.000Z",
        archivedAt: "2026-09-28T08:45:00.000Z",
      },
      title: "Winter Tailoring, Archived",
      kind: "photo",
      caption: "A retired winter story kept for reference; the pieces return in the next capsule.",
      tags: ["winter", "tailoring"],
      media: [media("look_archive_tailoring", "asset_archive_1", 1200, 1600)],
      occasionIds: ["formal", "wedding"],
    },
    {
      id: "look_knitwear_study",
      code: "LB-1046",
      revision: 1,
      createdAt: "2026-10-20T15:25:00.000Z",
      updatedAt: "2026-10-22T07:35:00.000Z",
      webPublication: { status: "draft" },
      appPublication: { status: "not_published" },
      title: "Knitwear Proportion Study",
      kind: "lookbook",
      caption: "An open draft comparing a cropped knit with a longer ribbed hem.",
      tags: ["knitwear", "study"],
      media: [
        media("look_knitwear_study", "asset_knit_1", 1200, 1600),
        media("look_knitwear_study", "asset_knit_2", 1200, 1600, "try_on"),
      ],
      parts: [{ hidden: true }],
      occasionIds: ["home", "casual"],
    },
  ];
}

export function demoCollections(): CollectionDto[] {
  return [
    {
      id: "col_quiet_layers",
      revision: 3,
      createdAt: "2026-09-08T09:00:00.000Z",
      updatedAt: "2026-10-20T12:15:00.000Z",
      webPublication: {
        status: "published",
        revisionId: "col_quiet_layers_r3",
        publishedAt: "2026-10-20T12:18:00.000Z",
      },
      title: "Quiet Layers",
      slug: "quiet-layers",
      description: "Soft tailoring and breathable layers for the weeks between seasons.",
      lookIds: ["look_linen_layers", "look_monochrome_office", "look_weekend_denim"],
    },
    {
      id: "col_office_edit",
      revision: 1,
      createdAt: "2026-10-06T08:10:00.000Z",
      updatedAt: "2026-10-17T09:05:00.000Z",
      webPublication: { status: "draft" },
      title: "The Office Edit",
      slug: "office-edit",
      description: "Workwear pieces that move from desk to dinner without a change.",
      lookIds: ["look_monochrome_office"],
    },
    {
      id: "col_archive_2025",
      revision: 5,
      createdAt: "2025-11-02T10:00:00.000Z",
      updatedAt: "2026-09-30T16:30:00.000Z",
      webPublication: {
        status: "archived",
        revisionId: "col_archive_2025_r4",
        publishedAt: "2026-01-15T10:00:00.000Z",
        archivedAt: "2026-09-30T16:30:00.000Z",
      },
      title: "Archive: Winter 2025",
      slug: "archive-winter-2025",
      description: "Previous season reference collection.",
      lookIds: ["look_archive_tailoring"],
    },
  ];
}

export interface LookbookDemoSeed {
  looks?: LookDto[];
  collections?: CollectionDto[];
}

export interface LookbookDemoStore {
  getSession(): LookbookDemoSession;
  openSession(): LookbookDemoSession;
  listLooks(cursor?: string | null): PageDto<LookDto>;
  listCollections(cursor?: string | null): PageDto<CollectionDto>;
  getLook(id: string): LookDto;
  getCollection(id: string): CollectionDto;
  prepareLook(idempotencyKey: string): { lookId: string };
  upload(lookId: string, input: { role: "look" | "try_on"; width: number; height: number }): UploadDto;
  createLook(input: { idempotencyKey: string; content: EditorialLookContent }): { lookId: string; code: string; revision: number };
  updateLook(id: string, input: { expectedRevision: number; content: EditorialLookContent }): { look: LookDto };
  publishLook(id: string, input: { expectedRevision: number; idempotencyKey: string }): { look: LookDto };
  archiveLook(id: string, input: { expectedRevision: number; idempotencyKey: string }): { look: LookDto };
  actOnAppPublication(id: string, request: AppPublicationRequest): { result: AppPublicationResult; look: LookDto };
  deleteMedia(lookId: string, assetId: string): DeleteMediaDto;
  createCollection(input: { idempotencyKey: string; content: LookCollectionContent }): { collection: CollectionDto };
  updateCollection(id: string, input: { expectedRevision: number; content: LookCollectionContent }): { collection: CollectionDto };
  publishCollection(id: string, input: { expectedRevision: number; idempotencyKey: string }): { collection: CollectionDto };
  archiveCollection(id: string, input: { expectedRevision: number; idempotencyKey: string }): { collection: CollectionDto };
}

/** Create an isolated store; tests use one per case so mutations cannot leak. */
export function createLookbookDemoStore(seed: LookbookDemoSeed = {}): LookbookDemoStore {
  let looks = clone(seed.looks ?? demoLooks());
  let collections = clone(seed.collections ?? demoCollections());
  const prepared = new Set<string>();
  const createdLooks = new Map<string, string>();
  const createdCollections = new Map<string, string>();
  let sequence = 0;

  const session: LookbookDemoSession = { uid: DEMO_UID, appChannelEnabled: true };

  function requireLook(id: string): LookDto {
    const record = looks.find((item) => item.id === id);
    if (!record) throw notFound();
    return record;
  }

  function requireCollection(id: string): CollectionDto {
    const record = collections.find((item) => item.id === id);
    if (!record) throw notFound();
    return record;
  }

  function lookFromContent(id: string, code: string, content: EditorialLookContent): LookDto {
    const timestamp = now();
    return {
      id,
      code,
      revision: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      webPublication: { status: "draft" },
      appPublication: { status: "not_published" },
      title: content.title,
      kind: content.kind,
      media: clone(content.media),
      caption: content.caption,
      tags: [...content.tags],
      ...(content.parts !== undefined ? { parts: clone(content.parts) } : {}),
      ...(content.occasionIds !== undefined ? { occasionIds: [...content.occasionIds] } : {}),
      ...(content.styleNote !== undefined ? { styleNote: content.styleNote } : {}),
      ...(content.relatedLooks !== undefined ? { relatedLooks: clone(content.relatedLooks) } : {}),
      ...(content.outfitRef !== undefined ? { outfitRef: content.outfitRef } : {}),
    };
  }

  function withLookContent(record: LookDto, content: EditorialLookContent): LookDto {
    const next: LookDto = {
      ...record,
      title: content.title,
      kind: content.kind,
      media: clone(content.media),
      caption: content.caption,
      tags: [...content.tags],
      revision: record.revision + 1,
      updatedAt: now(),
    };
    if (content.parts !== undefined) next.parts = clone(content.parts);
    else delete next.parts;
    if (content.occasionIds !== undefined) next.occasionIds = [...content.occasionIds];
    else delete next.occasionIds;
    if (content.styleNote !== undefined) next.styleNote = content.styleNote;
    else delete next.styleNote;
    if (content.relatedLooks !== undefined) next.relatedLooks = clone(content.relatedLooks);
    else delete next.relatedLooks;
    if (content.outfitRef !== undefined) next.outfitRef = content.outfitRef;
    else delete next.outfitRef;
    return next;
  }

  function collectionFromContent(id: string, content: LookCollectionContent): CollectionDto {
    const timestamp = now();
    return {
      id,
      revision: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      webPublication: { status: "draft" },
      title: content.title,
      slug: content.slug,
      lookIds: [...content.lookIds],
      ...(content.description !== undefined ? { description: content.description } : {}),
    };
  }

  function withCollectionContent(record: CollectionDto, content: LookCollectionContent): CollectionDto {
    const next: CollectionDto = {
      ...record,
      title: content.title,
      slug: content.slug,
      lookIds: [...content.lookIds],
      revision: record.revision + 1,
      updatedAt: now(),
    };
    if (content.description !== undefined) next.description = content.description;
    else delete next.description;
    return next;
  }

  function ensureSlugAvailable(slug: string, exceptId?: string): void {
    if (collections.some((item) => item.slug === slug && item.id !== exceptId)) {
      throw new AdminClientError(409, "Bu slug başka bir koleksiyon tarafından kullanılıyor. Farklı bir slug yazıp yeniden kaydedin; diğer girdileriniz korundu.", "slug", "conflict");
    }
  }

  function replaceLook(next: LookDto): LookDto {
    looks = looks.map((item) => (item.id === next.id ? next : item));
    return clone(next);
  }

  function replaceCollection(next: CollectionDto): CollectionDto {
    collections = collections.map((item) => (item.id === next.id ? next : item));
    return clone(next);
  }

  return {
    getSession: () => ({ ...session }),
    openSession: () => ({ ...session }),

    listLooks: (cursor) => page(newestFirst(looks.filter((item) => !prepared.has(item.id))), cursor),
    listCollections: (cursor) => page(newestFirst(collections), cursor),

    getLook: (id) => clone(requireLook(id)),
    getCollection: (id) => clone(requireCollection(id)),

    prepareLook(idempotencyKey) {
      const existing = createdLooks.get(idempotencyKey);
      if (existing) return { lookId: existing };
      const lookId = `look_demo_${++sequence}`;
      prepared.add(lookId);
      looks = [lookFromContent(lookId, `LB-${1100 + sequence}`, { title: "", kind: "photo", caption: "", tags: [], media: [], parts: [] }), ...looks];
      createdLooks.set(idempotencyKey, lookId);
      return { lookId };
    },

    upload(lookId, input) {
      requireLook(lookId);
      const assetId = `asset_${++sequence}_${lookId}`;
      const mediaEntry = media(lookId, assetId, input.width, input.height, input.role === "try_on" ? "try_on" : undefined);
      return { media: mediaEntry, assetId, previewUrl: mediaEntry.url };
    },

    createLook(input) {
      const existing = createdLooks.get(input.idempotencyKey);
      if (existing) {
        const record = requireLook(existing);
        if (!prepared.has(existing)) {
          // A retry of an already completed create returns the same receipt.
          return { lookId: record.id, code: record.code, revision: record.revision };
        }
        // A prepared record is an empty shell used only to allocate a media
        // target. Completing it must apply the submitted draft and reveal it.
        const completed: LookDto = {
          ...lookFromContent(existing, record.code, input.content),
          createdAt: record.createdAt,
        };
        prepared.delete(existing);
        looks = looks.map((item) => (item.id === existing ? completed : item));
        return { lookId: completed.id, code: completed.code, revision: completed.revision };
      }
      const lookId = `look_demo_${++sequence}`;
      const record = lookFromContent(lookId, `LB-${1100 + sequence}`, input.content);
      looks = [record, ...looks];
      createdLooks.set(input.idempotencyKey, lookId);
      return { lookId, code: record.code, revision: record.revision };
    },

    updateLook(id, input) {
      const record = requireLook(id);
      if (record.revision !== input.expectedRevision) throw revisionConflict();
      return { look: replaceLook(withLookContent(record, input.content)) };
    },

    publishLook(id, input) {
      const record = requireLook(id);
      if (record.revision !== input.expectedRevision) throw revisionConflict();
      const revision = record.revision + 1;
      const published: LookDto = {
        ...record,
        revision,
        updatedAt: now(),
        webPublication: { status: "published", revisionId: `${id}_r${revision}`, publishedAt: now() },
      };
      return { look: replaceLook(published) };
    },

    archiveLook(id, input) {
      const record = requireLook(id);
      if (record.revision !== input.expectedRevision) throw revisionConflict();
      const revision = record.revision + 1;
      const archived: LookDto = {
        ...record,
        revision,
        updatedAt: now(),
        webPublication: {
          status: "archived",
          ...(record.webPublication.revisionId ? { revisionId: record.webPublication.revisionId } : {}),
          ...(record.webPublication.publishedAt ? { publishedAt: record.webPublication.publishedAt } : {}),
          archivedAt: now(),
        },
      };
      return { look: replaceLook(archived) };
    },

    actOnAppPublication(id, request) {
      const record = requireLook(id);
      if (record.revision !== request.expectedRevision) throw revisionConflict();
      if (request.action === "publish") {
        if (record.webPublication.status !== "published") {
          throw new AdminClientError(409, "Uygulamada yayımlamak veya güncellemek için önce web sürümünü yayımlayın. Uygulamaya yalnızca aktif web yayını aktarılır.", undefined, "web_not_published");
        }
        const revisionId = record.webPublication.revisionId;
        if (record.appPublication?.status === "published" && record.appPublication.revisionId === revisionId) {
          return { result: { outcome: "already_published" }, look: clone(record) };
        }
        const outcome = record.appPublication?.status === "published" ? "updated" : "published";
        const published: LookDto = {
          ...record,
          appPublication: {
            status: "published",
            revisionId,
            feedPostRef: `feed_${id}`,
            publishedAt: now(),
          },
          appFeedStatus: "published" as AppFeedStatus,
        };
        return { result: { outcome }, look: replaceLook(published) };
      }
      if (record.appPublication?.status !== "published") {
        return { result: { outcome: "already_withdrawn" }, look: clone(record) };
      }
      const withdrawn: LookDto = {
        ...record,
        appPublication: { ...record.appPublication, status: "withdrawn", withdrawnAt: now() },
        appFeedStatus: "missing",
      };
      return { result: { outcome: "withdrawn" }, look: replaceLook(withdrawn) };
    },

    deleteMedia(lookId, assetId) {
      const record = requireLook(lookId);
      const path = `editorialMedia/${lookId}/assets/${assetId}.jpg`;
      const referenced =
        record.media.some((item) => item.storagePath === path) ||
        (record.parts ?? []).some((part) => !part.hidden && part.storagePath === path);
      if (record.webPublication.status === "published" || referenced) {
        return { status: "retained" };
      }
      looks = looks.map((item) =>
        item.id === lookId
          ? {
              ...item,
              media: item.media.filter((entry) => entry.storagePath !== path),
              ...(item.parts
                ? { parts: item.parts.filter((part) => part.hidden || part.storagePath !== path) }
                : {}),
            }
          : item,
      );
      return { status: "deleted" };
    },

    createCollection(input) {
      const existing = createdCollections.get(input.idempotencyKey);
      if (existing) return { collection: clone(requireCollection(existing)) };
      ensureSlugAvailable(input.content.slug);
      const id = `col_demo_${++sequence}`;
      const record = collectionFromContent(id, input.content);
      collections = [record, ...collections];
      createdCollections.set(input.idempotencyKey, id);
      return { collection: clone(record) };
    },

    updateCollection(id, input) {
      const record = requireCollection(id);
      if (record.revision !== input.expectedRevision) throw revisionConflict();
      ensureSlugAvailable(input.content.slug, id);
      return { collection: replaceCollection(withCollectionContent(record, input.content)) };
    },

    publishCollection(id, input) {
      const record = requireCollection(id);
      if (record.revision !== input.expectedRevision) throw revisionConflict();
      const revision = record.revision + 1;
      const published: CollectionDto = {
        ...record,
        revision,
        updatedAt: now(),
        webPublication: { status: "published", revisionId: `${id}_r${revision}`, publishedAt: now() },
      };
      return { collection: replaceCollection(published) };
    },

    archiveCollection(id, input) {
      const record = requireCollection(id);
      if (record.revision !== input.expectedRevision) throw revisionConflict();
      const revision = record.revision + 1;
      const archived: CollectionDto = {
        ...record,
        revision,
        updatedAt: now(),
        webPublication: {
          status: "archived",
          ...(record.webPublication.revisionId ? { revisionId: record.webPublication.revisionId } : {}),
          ...(record.webPublication.publishedAt ? { publishedAt: record.webPublication.publishedAt } : {}),
          archivedAt: now(),
        },
      };
      return { collection: replaceCollection(archived) };
    },
  };
}
