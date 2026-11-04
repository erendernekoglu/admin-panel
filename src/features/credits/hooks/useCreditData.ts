import { useQuery } from "@tanstack/react-query"

import { createDateRange } from "../../../lib/analytics/analyticsUtils"
import type { DateRange } from "../../analytics/types"
import {
  fetchCreditTransactions,
  fetchCreditTransactionsInRange,
} from "../services/creditService"

export function useCreditData(range?: DateRange, limitCount = 100) {
  const effectiveRange = range ?? createDateRange(30)

  return useQuery({
    queryKey: [
      "admin",
      "credits",
      limitCount,
      range ? effectiveRange.since.toISOString() : "latest",
      range ? effectiveRange.until.toISOString() : "latest",
    ],
    queryFn: () =>
      range
        ? fetchCreditTransactionsInRange(effectiveRange)
        : fetchCreditTransactions(limitCount),
    staleTime: 30_000,
  })
}
