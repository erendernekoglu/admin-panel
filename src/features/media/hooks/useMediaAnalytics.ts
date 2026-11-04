import { useQuery } from "@tanstack/react-query"

import type { DateRange } from "../../analytics/types"
import { fetchMediaAnalytics } from "../services/mediaService"

export function useMediaAnalytics(range?: DateRange) {
  return useQuery({
    queryKey: [
      "admin-function",
      "media",
      range?.since.toISOString() ?? "all",
      range?.until.toISOString() ?? "all",
    ],
    queryFn: () => fetchMediaAnalytics(range),
    staleTime: 60_000,
  })
}
