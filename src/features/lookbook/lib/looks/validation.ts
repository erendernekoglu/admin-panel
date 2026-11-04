/* Control characters are intentionally rejected in editorial text and URLs. */
/* eslint-disable no-control-regex */
import {
  LOOK_MAX_CAPTION_LENGTH,
  LOOK_MAX_MEDIA,
  LOOK_MAX_PARTS,
  LOOK_MAX_TAGS,
} from "./feed";
import { OCCASIONS, type OccasionId } from "./occasions";
import { assertDocumentId, EditorialError } from "./errors";
import type { EditorialFeedMedia, EditorialLookContent, EditorialPart, ShoppingLink } from "./model";

/** Editorial limits supplement (never loosen) the pinned feed contract. Lengths are UTF-16 code units after trimming. */
export const EDITORIAL_LIMITS = {
  title: 160,
  tag: 32,
  partName: 160,
  shoppingLinks: 5,
  shoppingRetailer: 80,
  shoppingLabel: 80,
  styleNote: 1000,
  relatedLooks: 12,
  relatedLookLabel: 80,
  occasionIds: OCCASIONS.length,
  url: 2048,
  storagePath: 512,
} as const;

function fail(field: string, message: string): never {
  throw new EditorialError("validation", message, field);
}

function object(value: unknown, allowed: readonly string[], field: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return fail(field, "Expected an object.");
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return fail(field, "Expected a plain object.");
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !allowed.includes(key)) {
      return fail(field ? `${field}.${String(key)}` : String(key), "Unknown or managed field is not allowed.");
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !("value" in descriptor)) return fail(field, "Expected plain data fields.");
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string, max: number, allowEmpty = false): string {
  if (typeof value !== "string") return fail(field, "Expected a string.");
  const result = value.trim();
  if ((!allowEmpty && !result) || result.length > max) return fail(field, `Expected ${allowEmpty ? 0 : 1}–${max} characters.`);
  return result;
}

function array(value: unknown, field: string, max: number, min = 0): unknown[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    return fail(field, `Expected ${min}–${max} entries.`);
  }
  // Array.from makes holes explicit so sparse input cannot skip validation.
  return Array.from(value);
}

function dimension(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    return fail(field, "Expected a positive finite integer dimension.");
  }
  return value;
}

function imageUrl(value: unknown, field: string): string {
  const result = text(value, field, EDITORIAL_LIMITS.url);
  if (result !== value || /[\s\\\u0000-\u001f\u007f]/u.test(result)) return fail(field, "Expected an image URL without whitespace or backslashes.");
  if (/^\/api\/look-media\/[A-Za-z0-9_-]{1,128}\/[A-Za-z0-9_-]{1,128}$/.test(result)) return result;
  try {
    const url = new URL(result);
    if (url.protocol === "https:" && url.hostname && !url.username && !url.password) return result;
  } catch {
    // Syntax validation only. Ownership validation rejects every external URL.
  }
  return fail(field, "Expected an HTTPS image URL or canonical managed media URL.");
}

function media(value: unknown, index: number): EditorialFeedMedia {
  const field = `media[${index}]`;
  const item = object(value, ["storagePath", "url", "width", "height", "role"], field);
  const role = item.role === undefined ? "look" : item.role;
  if (role !== "look" && role !== "try_on") return fail(`${field}.role`, "Expected look or try_on.");
  return {
    storagePath: text(item.storagePath, `${field}.storagePath`, EDITORIAL_LIMITS.storagePath),
    url: imageUrl(item.url, `${field}.url`),
    width: dimension(item.width, `${field}.width`),
    height: dimension(item.height, `${field}.height`),
    role,
  };
}

/** Syntax-only HTTPS validation, also used for untrusted, unsaved admin previews. No network I/O. */
export function safeShoppingUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const result = value.trim();
  if (!result || result.length > EDITORIAL_LIMITS.url || !/^https:\/\//i.test(result) ||
      /[\s\\\u0000-\u001f\u007f]/u.test(result)) return null;
  try {
    const url = new URL(result);
    if (url.protocol === "https:" && url.hostname && !url.username && !url.password) return result;
  } catch { /* Invalid URL syntax is a validation error, never a reason to fetch it. */ }
  return null;
}

function shoppingLink(value: unknown, field: string): ShoppingLink {
  const item = object(value, ["id", "url", "retailer", "label", "relation"], field);
  assertDocumentId(item.id, `${field}.id`);
  const url = safeShoppingUrl(item.url);
  if (!url) return fail(`${field}.url`, `Expected an HTTPS URL without credentials or whitespace, at most ${EDITORIAL_LIMITS.url} characters.`);
  if (item.relation !== "exact" && item.relation !== "similar") return fail(`${field}.relation`, "Expected exact or similar.");
  return {
    id: item.id, url, relation: item.relation,
    ...(item.retailer !== undefined ? { retailer: text(item.retailer, `${field}.retailer`, EDITORIAL_LIMITS.shoppingRetailer) } : {}),
    ...(item.label !== undefined ? { label: text(item.label, `${field}.label`, EDITORIAL_LIMITS.shoppingLabel) } : {}),
  };
}

function part(value: unknown, index: number): EditorialPart {
  const field = `parts[${index}]`;
  const item = object(value, ["hidden", "name", "imageUrl", "garmentId", "storagePath", "shoppingLinks"], field);
  if (item.hidden === true) {
    object(value, ["hidden"], field);
    return { hidden: true };
  }
  if (item.hidden !== false) return fail(`${field}.hidden`, "Expected a boolean.");
  const result: Extract<EditorialPart, { hidden: false }> = {
    hidden: false,
    name: text(item.name, `${field}.name`, EDITORIAL_LIMITS.partName),
    imageUrl: imageUrl(item.imageUrl, `${field}.imageUrl`),
  };
  if (item.garmentId !== undefined) {
    assertDocumentId(item.garmentId, `${field}.garmentId`);
    result.garmentId = item.garmentId;
  }
  if (item.storagePath !== undefined) result.storagePath = text(item.storagePath, `${field}.storagePath`, EDITORIAL_LIMITS.storagePath);
  if (item.shoppingLinks !== undefined) {
    const seen = new Set<string>();
    result.shoppingLinks = array(item.shoppingLinks, `${field}.shoppingLinks`, EDITORIAL_LIMITS.shoppingLinks).map((value, index) => {
      const linkField = `${field}.shoppingLinks[${index}]`;
      const link = shoppingLink(value, linkField);
      if (seen.has(link.id)) return fail(`${linkField}.id`, "Shopping link IDs must be unique within a part.");
      seen.add(link.id);
      return link;
    });
  }
  return result;
}

/**
 * Strict public-content boundary; never pass root/private fields into a snapshot.
 * Call validateMediaOwnership with the allocated look ID before persistence.
 */
export function validateLookContent(input: unknown): EditorialLookContent {
  const value = object(input, ["title", "kind", "media", "caption", "tags", "parts", "occasionIds", "styleNote", "relatedLooks", "outfitRef"], "");
  if (value.kind !== "photo" && value.kind !== "lookbook") return fail("kind", "Expected photo or lookbook.");
  const tags = array(value.tags, "tags", LOOK_MAX_TAGS).map((tag, index) => {
    // Tags are trimmed, lowercased and deduplicated on save, but overlong
    // values are rejected instead of silently sliced or truncated.
    const normalized = text(tag, `tags[${index}]`, EDITORIAL_LIMITS.tag).toLowerCase();
    if (normalized.length > EDITORIAL_LIMITS.tag) return fail(`tags[${index}]`, "Normalized tag exceeds 32 characters.");
    return normalized;
  });
  const result: EditorialLookContent = {
    title: text(value.title, "title", EDITORIAL_LIMITS.title),
    kind: value.kind,
    media: array(value.media, "media", LOOK_MAX_MEDIA, 1).map(media),
    caption: text(value.caption, "caption", LOOK_MAX_CAPTION_LENGTH, true),
    tags: [...new Set(tags)],
  };
  if (!result.media.some((item) => item.role === "look")) {
    return fail("media", "At least one normal look image is required.");
  }
  if (value.parts !== undefined) result.parts = array(value.parts, "parts", LOOK_MAX_PARTS).map(part);
  if (value.styleNote !== undefined) result.styleNote = text(value.styleNote, "styleNote", EDITORIAL_LIMITS.styleNote, true);
  if (value.occasionIds !== undefined) {
    result.occasionIds = [...new Set(array(value.occasionIds, "occasionIds", EDITORIAL_LIMITS.occasionIds).map((id, index) => {
      if (typeof id !== "string" || !OCCASIONS.some((occasion) => occasion.id === id)) return fail(`occasionIds[${index}]`, "Expected a known usage occasion ID.");
      return id as OccasionId;
    }))];
  }
  if (value.relatedLooks !== undefined) {
    result.relatedLooks = array(value.relatedLooks, "relatedLooks", EDITORIAL_LIMITS.relatedLooks).map((item, index) => {
      const field = `relatedLooks[${index}]`;
      const related = object(item, ["lookId", "label"], field);
      assertDocumentId(related.lookId, `${field}.lookId`);
      return {
        lookId: related.lookId,
        ...(related.label !== undefined ? { label: text(related.label, `${field}.label`, EDITORIAL_LIMITS.relatedLookLabel) } : {}),
      };
    });
  }
  if (value.outfitRef !== undefined) {
    assertDocumentId(value.outfitRef, "outfitRef");
    result.outfitRef = value.outfitRef;
  }
  return result;
}
