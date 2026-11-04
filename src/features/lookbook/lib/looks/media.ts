import { assertDocumentId, EditorialError } from "./errors";
import type { EditorialLookContent } from "./model";

export function editorialMediaPath(lookId: string, assetId: string): string {
  assertDocumentId(lookId, "lookId");
  assertDocumentId(assetId, "assetId");
  return `editorialMedia/${lookId}/assets/${assetId}.jpg`;
}

/** Reserved for future publication-aware delivery; this does not create a route. */
export function editorialMediaUrl(lookId: string, assetId: string): string {
  assertDocumentId(lookId, "lookId");
  assertDocumentId(assetId, "assetId");
  return `/api/look-media/${lookId}/${assetId}`;
}

export function assetIdFromPath(lookId: string, path: string): string {
  assertDocumentId(lookId, "lookId");
  if (typeof path !== "string") {
    throw new EditorialError("validation", "Expected a managed media storage path.", "storagePath");
  }
  const match = /^editorialMedia\/([A-Za-z0-9_-]{1,128})\/assets\/([A-Za-z0-9_-]{1,128})\.jpg$/.exec(path);
  if (!match || match[1] !== lookId || path !== editorialMediaPath(lookId, match[2])) {
    throw new EditorialError("validation", "Media must belong to this look and use its canonical managed path.", "storagePath");
  }
  return match[2];
}

/** Pure ownership check; the service must also verify ready manifests in its transaction. */
export function validateMediaOwnership(content: EditorialLookContent, lookId: string): void {
  assertDocumentId(lookId, "lookId");
  function check(path: string | undefined, url: string, field: string, urlField: string) {
    if (typeof path !== "string") {
      throw new EditorialError("validation", "Visible media requires a managed storage path.", `${field}.storagePath`);
    }
    let assetId: string;
    try {
      assetId = assetIdFromPath(lookId, path);
    } catch (error) {
      if (!(error instanceof EditorialError)) throw error;
      throw new EditorialError("validation", error.message, `${field}.storagePath`);
    }
    if (url !== editorialMediaUrl(lookId, assetId)) {
      throw new EditorialError("validation", "Media URL must match its canonical managed storage path.", `${field}.${urlField}`);
    }
  }
  content.media.forEach((media, index) => check(media.storagePath, media.url, `media[${index}]`, "url"));
  content.parts?.forEach((part, index) => {
    if (!part.hidden) check(part.storagePath, part.imageUrl, `parts[${index}]`, "imageUrl");
  });
}
