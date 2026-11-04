import { queryOptions, useQuery } from "@tanstack/react-query"

import { fetchApiKey, fetchApiKeyUsage, fetchApiKeys } from "../services/apiKeyService"

export const apiKeysQueryOptions = queryOptions({
  queryKey: ["admin", "apiKeys"],
  queryFn: fetchApiKeys,
  staleTime: 60_000,
})

export function useApiKeys() {
  return useQuery(apiKeysQueryOptions)
}

export function useApiKey(keyId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "apiKeys", keyId],
    queryFn: () => fetchApiKey(keyId as string),
    enabled: Boolean(keyId),
    staleTime: 60_000,
  })
}

export function useApiKeyUsage(
  keyId: string | undefined,
  startDate: string,
  endDate: string,
) {
  return useQuery({
    queryKey: ["admin", "apiKeys", keyId, "usage", startDate, endDate],
    queryFn: () =>
      fetchApiKeyUsage({ keyId: keyId as string, startDate, endDate }),
    enabled: Boolean(keyId),
    staleTime: 60_000,
  })
}
