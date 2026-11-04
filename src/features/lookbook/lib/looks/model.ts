import type { LookKind, LookMedia, LookPart } from "./feed";
import type { OccasionId } from "./occasions";

/** A gallery image; an omitted role is a normal look image. Both roles share the gallery limit. */
export interface EditorialFeedMedia extends LookMedia {
  role?: "look" | "try_on";
}

export interface ShoppingLink {
  /** Stable within a part; generated once, preserved on edit and reorder. */
  id: string;
  url: string;
  retailer?: string;
  label?: string;
  relation: "exact" | "similar";
}

/** Editorial-only extension: the public content contract stays unchanged. */
export type EditorialPart =
  | Extract<LookPart, { hidden: true }>
  | (Extract<LookPart, { hidden: false }> & { shoppingLinks?: ShoppingLink[] });

/** Editable content of a look. Publication state lives on the admin record. */
export interface EditorialLookContent {
  title: string;
  kind: LookKind;
  media: EditorialFeedMedia[];
  caption: string;
  tags: string[];
  parts?: EditorialPart[];
  occasionIds?: OccasionId[];
  styleNote?: string;
  relatedLooks?: { lookId: string; label?: string }[];
  outfitRef?: string;
}

/** Editable content of an ordered collection of looks. */
export interface LookCollectionContent {
  title: string;
  slug: string;
  description?: string;
  /** Ordered references to looks, not copies of mutable look content. */
  lookIds: string[];
}
