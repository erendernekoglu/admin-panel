import { useQuery } from "@tanstack/react-query"

import type { DateRange } from "../../analytics/types"
import {
  fetchSubscriptions,
  fetchSubscriptionsInRange,
} from "../services/subscriptionService"

export function useSubscriptionData(range?: DateRange) {
  return useQuery({
    queryKey: [
      "admin",
      "subscriptions",
      range?.since.toISOString() ?? "all",
      range?.until.toISOString() ?? "all",
    ],
    queryFn: () =>
      range ? fetchSubscriptionsInRange(range) : fetchSubscriptions(),
    staleTime: 60_000,
  })
}
