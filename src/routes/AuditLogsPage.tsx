import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { Card } from "../components/molecules/Card"
import { AuditLogsErrorState } from "../features/audit-logs/components/AuditLogsErrorState"
import { AuditLogsFilters } from "../features/audit-logs/components/AuditLogsFilters"
import { AuditLogsHeader } from "../features/audit-logs/components/AuditLogsHeader"
import { AuditLogsKpiGrid } from "../features/audit-logs/components/AuditLogsKpiGrid"
import { AuditLogsSkeleton } from "../features/audit-logs/components/AuditLogsSkeleton"
import { AuditLogsTable } from "../features/audit-logs/components/AuditLogsTable"
import { useAuditLogs } from "../features/audit-logs/hooks/useAuditLogs"
import { fetchUsersByIds } from "../features/users/services/userService"
import type {
  AuditActionType,
  AuditLog,
  AuditLogFilters,
} from "../features/audit-logs/types"

const formatter = new Intl.NumberFormat("tr-TR")

const criticalActionTypes: AuditActionType[] = [
  "delete",
  "config_change",
  "credit_operation",
  "api_key_operation",
  "role_change",
]

function matchesSearch(log: AuditLog, search: string) {
  const query = search.trim().toLowerCase()
  if (!query) return true

  return [
    log.adminId,
    log.adminName,
    log.action,
    log.actionType,
    log.targetType,
    log.targetId,
    log.status,
  ]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(query))
}

export default function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({
    search: "",
    actionType: "all",
    status: "all",
    targetType: "all",
  })
  const { data, error, isError, isPending } = useAuditLogs()

  const rawLogs = useMemo(() => data?.logs ?? [], [data?.logs])
  // The log stores the admin's uid; one read resolves the few distinct admins.
  const adminIds = useMemo(
    () => [...new Set(rawLogs.map((log) => log.adminId).filter(Boolean))].sort(),
    [rawLogs],
  )
  const adminsQuery = useQuery({
    queryKey: ["admin", "users", "byIds", adminIds],
    queryFn: () => fetchUsersByIds(adminIds),
    enabled: adminIds.length > 0,
  })
  const logs = useMemo(() => {
    const names = new Map(
      (adminsQuery.data ?? []).map((user) => [user.uid, user.displayName || user.email]),
    )
    return rawLogs.map((log) => ({ ...log, adminName: names.get(log.adminId) || undefined }))
  }, [adminsQuery.data, rawLogs])

  const metrics = useMemo(() => {
    return logs.reduce(
      (acc, log) => {
        acc.totalEvents += 1
        if (log.status === "success") acc.successfulEvents += 1
        if (log.status === "failed") acc.failedEvents += 1
        if (criticalActionTypes.includes(log.actionType)) {
          acc.criticalActions += 1
        }
        if (log.actionType === "config_change") acc.configChanges += 1
        if (log.actionType === "weather_operation") acc.weatherOperations += 1
        return acc
      },
      {
        configChanges: 0,
        criticalActions: 0,
        failedEvents: 0,
        successfulEvents: 0,
        totalEvents: 0,
        weatherOperations: 0,
      },
    )
  }, [logs])

  const targetTypes = useMemo(() => {
    return Array.from(
      new Set(
        logs
          .map((log) => log.targetType)
          .filter((targetType) => targetType && targetType !== "—"),
      ),
    ).sort((left, right) => left.localeCompare(right))
  }, [logs])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesAction =
        filters.actionType === "all" || log.actionType === filters.actionType
      const matchesStatus =
        filters.status === "all" || log.status === filters.status
      const matchesTarget =
        filters.targetType === "all" || log.targetType === filters.targetType
      return (
        matchesAction &&
        matchesStatus &&
        matchesTarget &&
        matchesSearch(log, filters.search)
      )
    })
  }, [logs, filters])

  const isEmpty = !isPending && !isError && logs.length === 0

  // The header stays mounted across loading → loaded so the title reveals once.
  return (
    <>
      <AuditLogsHeader />

      {isPending ? (
        <AuditLogsSkeleton />
      ) : isError ? (
        <AuditLogsErrorState error={error} />
      ) : isEmpty ? (
        <Card className="px-6 py-14 text-center">
          <p className="text-base font-bold text-ink">Henüz denetim kaydı yok.</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">
            Yönetim servisi henüz denetim kaydı döndürmedi. Yönetici işlemleri yapıldıkça
            sunucu fonksiyonları kayıtları buraya yazar.
          </p>
        </Card>
      ) : (
        <>
          <AuditLogsKpiGrid
            configChanges={metrics.configChanges}
            criticalActions={metrics.criticalActions}
            failedEvents={metrics.failedEvents}
            successfulEvents={metrics.successfulEvents}
            totalEvents={metrics.totalEvents}
            weatherOperations={metrics.weatherOperations}
          />

          <div className="space-y-4">
            <AuditLogsFilters
              filters={filters}
              onFiltersChange={setFilters}
              targetTypes={targetTypes}
            />

            <AuditLogsTable logs={filteredLogs} />

            <p className="text-sm tabular-nums text-muted">
              {formatter.format(logs.length)} kaydın {formatter.format(filteredLogs.length)} tanesi gösteriliyor
              {data?.sample.truncated ? " (zaman damgalı en son 200 kayıtla sınırlı)." : "."}
            </p>
          </div>
        </>
      )}
    </>
  )
}
