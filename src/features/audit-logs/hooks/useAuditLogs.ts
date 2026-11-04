import { queryOptions, useQuery } from "@tanstack/react-query"

import { fetchAuditLogs } from "../services/auditLogService"

export const auditLogsQueryOptions = queryOptions({
  queryKey: ["admin-function", "auditLogs"],
  queryFn: fetchAuditLogs,
  staleTime: 60_000,
})

export function useAuditLogs() {
  return useQuery(auditLogsQueryOptions)
}
