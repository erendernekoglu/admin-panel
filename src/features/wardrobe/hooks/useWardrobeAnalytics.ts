import { useQuery } from "@tanstack/react-query"

import { createDateRange } from "../../../lib/analytics/analyticsUtils"
import { useAuth } from "../../auth/useAuth"
import type { DateRange } from "../../analytics/types"
import { fetchWardrobeAnalytics } from "../services/wardrobeService"

export function useWardrobeAnalytics(range: DateRange = createDateRange(30)) {
  const canReadUsers = useAuth().can("users.read")
  return useQuery({
    queryKey: [
      "admin",
      "wardrobe",
      range.since.toISOString(),
      range.until.toISOString(),
      range.granularity,
      canReadUsers,
    ],
    queryFn: () => fetchWardrobeAnalytics(range, canReadUsers),
    staleTime: 60_000,
  })
}
