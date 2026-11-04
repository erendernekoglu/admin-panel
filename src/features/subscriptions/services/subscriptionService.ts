import { adminRequest } from "../../../lib/api/client"
import {
  demoActiveSubscriptionCount,
  demoListSubscriptions,
  demoSubscriptionsInRange,
} from "../../demo/store"
import { isRecord, safeNumber, safeString, toIsoString } from "../../shared/format"
import type { DateRange } from "../../analytics/types"
import type { SubscriptionRecord } from "../types"

function mapSubscription(value: unknown): SubscriptionRecord {
  const data = isRecord(value) ? value : {}
  return {
    purchaseToken: safeString(data.purchaseToken, ""),
    userId: safeString(data.userId, ""),
    displayName:
      typeof data.displayName === "string" ? data.displayName : undefined,
    email: typeof data.email === "string" ? data.email : undefined,
    productId: safeString(data.productId, ""),
    basePlanId: safeString(data.basePlanId, ""),
    status: safeString(data.status, "active"),
    isActive: data.isActive === true,
    autoRenewing: data.autoRenewing === true,
    platform:
      typeof data.platform === "string"
        ? data.platform
        : typeof data.provider === "string"
          ? data.provider
          : undefined,
    provider: typeof data.provider === "string" ? data.provider : undefined,
    price:
      typeof data.price === "number"
        ? data.price
        : typeof data.priceAmountMicros === "number"
          ? data.priceAmountMicros / 1_000_000
          : undefined,
    currency:
      typeof data.currency === "string"
        ? data.currency
        : typeof data.currencyCode === "string"
          ? data.currencyCode
          : undefined,
    startedAt: toIsoString(data.startedAt ?? data.startTime ?? data.createdAt) ?? undefined,
    expiryTime: toIsoString(data.expiryTime),
    lastNotificationType:
      typeof data.lastNotificationType === "number"
        ? data.lastNotificationType
        : null,
    wasRevoked: data.wasRevoked === true,
    createdAt: toIsoString(data.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIsoString(data.updatedAt) ?? undefined,
  }
}

export async function fetchSubscriptions() {
  const records = await adminRequest<unknown[]>("subscriptions.list", {}, () =>
    demoListSubscriptions(),
  )
  return records.map(mapSubscription)
}

export async function countActiveSubscriptions() {
  return adminRequest<number>("subscriptions.activeCount", {}, () =>
    demoActiveSubscriptionCount(),
  )
}

export async function fetchSubscriptionsInRange(range: DateRange) {
  const payload = {
    startDate: range.since.toISOString(),
    endDate: range.until.toISOString(),
  }
  const records = await adminRequest<unknown[]>(
    "subscriptions.range",
    payload,
    () => demoSubscriptionsInRange(range),
  )
  return records.map(mapSubscription)
}

export function getLastNotificationType(data: SubscriptionRecord) {
  return safeNumber(data.lastNotificationType, 0)
}
