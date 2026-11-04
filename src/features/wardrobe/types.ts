import type { DateRange } from "../analytics/types"

export interface WardrobeUserSummary {
  uid: string
  displayName: string
  email: string
  wardrobeCount: number
  savedResultsCount: number
}

export interface WardrobeItem {
  id: string
  userId?: string
  userDisplayName?: string
  userEmail?: string
  title?: string
  category: string
  color?: string
  brand?: string
  source?: string
  status?: string
  createdAt: string
}

export interface WardrobeTimelineItem {
  id: string
  userId?: string
  createdAt: string
  [key: string]: unknown
}

export interface WardrobeCategoryPoint {
  name: string
  count: number
}

export interface WardrobeTrendPoint {
  date: string
  items: number
}

export interface WardrobeAnalyticsData {
  range: DateRange
  /** Owners of the listed items only, not every user. */
  users: WardrobeUserSummary[]
  /** Users with at least one wardrobe item (server-side count). */
  /** null when the role may not read user records. */
  activeWardrobeUsers: number | null
  items: WardrobeItem[]
  newItems: WardrobeItem[]
  savedResults: WardrobeTimelineItem[]
  savedPhotos: WardrobeTimelineItem[]
  wishlist: WardrobeTimelineItem[]
  calendar: WardrobeTimelineItem[]
  counts: {
    wardrobe: number
    savedResults: number
    savedPhotos: number
    wishlist: number
    calendar: number
  }
}
