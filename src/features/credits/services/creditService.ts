import { adminRequest } from "../../../lib/api/client"
import {
  demoCreditTransactions,
  demoCreditTransactionsInRange,
} from "../../demo/store"
import { isRecord, safeNumber, safeString, toIsoString } from "../../shared/format"
import type { DateRange } from "../../analytics/types"
import type { CreditTransaction, CreditTransactionType } from "../types"

function mapCreditTransaction(value: unknown): CreditTransaction {
  const data = isRecord(value) ? value : {}
  return {
    id: safeString(data.id, ""),
    userId: safeString(data.userId, ""),
    displayName:
      typeof data.displayName === "string" ? data.displayName : undefined,
    type: safeString(data.type, "purchase") as CreditTransactionType,
    operation: typeof data.operation === "string" ? data.operation : undefined,
    amount: safeNumber(data.amount, data.cost ? -safeNumber(data.cost) : 0),
    cost: typeof data.cost === "number" ? data.cost : undefined,
    balanceBefore:
      typeof data.balanceBefore === "number" ? data.balanceBefore : undefined,
    balanceAfter:
      typeof data.balanceAfter === "number" ? data.balanceAfter : undefined,
    reason: typeof data.reason === "string" ? data.reason : undefined,
    details: isRecord(data.details) ? data.details : undefined,
    createdAt: toIsoString(data.createdAt) ?? new Date(0).toISOString(),
  }
}

export async function fetchCreditTransactions(limitCount = 50) {
  const records = await adminRequest<unknown[]>(
    "credits.list",
    { limit: limitCount },
    () => demoCreditTransactions(limitCount),
  )
  return records.map(mapCreditTransaction)
}

export async function fetchCreditTransactionsInRange(range: DateRange) {
  const payload = {
    startDate: range.since.toISOString(),
    endDate: range.until.toISOString(),
  }
  const records = await adminRequest<unknown[]>("credits.range", payload, () =>
    demoCreditTransactionsInRange(range),
  )
  return records
    .map(mapCreditTransaction)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}
