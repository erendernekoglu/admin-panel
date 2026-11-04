/**
 * Locally owned editorial content contract for the Lookbook feature.
 *
 * These limits and shapes are generic: they describe an editorial look post
 * (a cover gallery plus optional tagged parts) and are shared by the admin
 * editor, its validation and the demo fixtures. No private or vendor package
 * is imported here.
 */

export const LOOK_MAX_MEDIA = 6;
export const LOOK_MAX_CAPTION_LENGTH = 300;
export const LOOK_MAX_TAGS = 5;
export const LOOK_MAX_PARTS = 12;

export type LookKind = "photo" | "lookbook";

export interface LookMedia {
  /** Canonical managed storage path, e.g. editorialMedia/{lookId}/assets/{assetId}.jpg */
  storagePath: string;
  url: string;
  width: number;
  height: number;
}

/** A part is either explicitly hidden or a visible, named piece of the outfit. */
export type LookPart =
  | { hidden: true }
  | {
      hidden: false;
      name: string;
      imageUrl: string;
      garmentId?: string;
      storagePath?: string;
    };
