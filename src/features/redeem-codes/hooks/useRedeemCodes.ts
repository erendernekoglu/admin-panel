import { queryOptions, useQuery } from "@tanstack/react-query"

import { fetchRedeemCodes } from "../services/redeemCodeService"

export const redeemCodesQueryOptions = queryOptions({
  queryKey: ["admin", "promoCodes"],
  queryFn: fetchRedeemCodes,
  staleTime: 60_000,
})

export function useRedeemCodes() {
  return useQuery(redeemCodesQueryOptions)
}
