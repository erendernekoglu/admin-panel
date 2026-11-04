/**
 * Usage occasions used to tag editorial looks.
 *
 * Generic, locally owned taxonomy. The Turkish label is what the existing
 * editor UI renders; `en` and `aliases` keep room for other admin languages
 * and for free-text matching without depending on a private package.
 */

export interface UsageOccasion {
  id: string;
  tr: string;
  en: string;
  aliases?: readonly string[];
}

export const OCCASIONS = [
  { id: "casual", tr: "Günlük", en: "Casual", aliases: ["daily", "günlük"] },
  { id: "work", tr: "İş", en: "Work", aliases: ["office", "iş", "ofis"] },
  { id: "sport", tr: "Spor", en: "Sport", aliases: ["gym", "workout", "spor"] },
  { id: "party", tr: "Parti", en: "Party", aliases: ["parti"] },
  { id: "date", tr: "Randevu", en: "Date", aliases: ["randevu"] },
  { id: "travel", tr: "Seyahat", en: "Travel", aliases: ["seyahat"] },
  { id: "outdoor", tr: "Outdoor", en: "Outdoor", aliases: ["dışarı", "outdoor"] },
  { id: "home", tr: "Ev", en: "Home", aliases: ["ev"] },
  { id: "formal", tr: "Resmi", en: "Formal", aliases: ["resmi"] },
  { id: "special", tr: "Özel Gün", en: "Special Occasion", aliases: ["özel gün", "özel"] },
  { id: "beach", tr: "Plaj", en: "Beach", aliases: ["plaj"] },
  { id: "wedding", tr: "Düğün", en: "Wedding", aliases: ["düğün"] },
  { id: "brunch", tr: "Brunch", en: "Brunch", aliases: ["brunch"] },
  { id: "concert", tr: "Konser", en: "Concert", aliases: ["konser"] },
] as const satisfies readonly UsageOccasion[];

export type OccasionId = (typeof OCCASIONS)[number]["id"];
