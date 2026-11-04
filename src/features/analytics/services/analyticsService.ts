import { safeNumber, safeString, toIsoString } from "../../shared/format"
import type {
  DateRange,
  SubcollectionTimelineItem,
  WardrobeItem,
} from "../types"
import type { CreditTransaction, CreditTransactionType } from "../../credits/types"
import {
  fetchAdminCollectionCounts,
  fetchAdminOperationalAnalytics,
  fetchAdminWardrobeItems,
} from "./launchAnalyticsService"

export async function fetchCollectionGroupCount(collectionName: string) {
  const counts = await fetchAdminCollectionCounts([collectionName])
  return counts[collectionName] ?? 0
}

export async function fetchWardrobeItems(limitCount = 500) {
  const data = await fetchAdminWardrobeItems(limitCount)
  return data.map<WardrobeItem>((item) => {
    return {
      id: safeString(item.id),
      userId: safeString(item.userId),
      category: safeString(item.category, "Other"),
      createdAt: item.createdAt,
    }
  })
}

export async function fetchAnalyticsData(range: DateRange) {
  const data = await fetchAdminOperationalAnalytics(range.since, range.until)
  const timeline = (name: string) => (data[name] ?? []).map<SubcollectionTimelineItem>(
    (item) => ({
      id: safeString(item.id),
      userId: safeString(item.userId),
      createdAt: item.createdAt,
    }),
  )
  const creditTransactions = (data.creditTransactions ?? []).map<CreditTransaction>(
    (item) => ({
      id: safeString(item.id),
      userId: safeString(item.userId),
      type: safeString(item.type, "purchase") as CreditTransactionType,
      operation: typeof item.operation === "string" ? item.operation : undefined,
      amount: safeNumber(item.amount),
      balanceBefore: 0,
      balanceAfter: 0,
      createdAt: toIsoString(item.createdAt) ?? "",
    }),
  )

  return {
    creditTransactions,
    wardrobeItems: timeline("wardrobe").map<WardrobeItem>((item) => ({
      ...item,
      category: "Other",
    })),
    savedResults: timeline("savedResults"),
    savedPhotos: timeline("savedPhotos"),
    wishlist: timeline("wishlist"),
    calendar: timeline("calendar"),
  }
}
