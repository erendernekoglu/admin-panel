import { useState } from "react"
import { CircleSlash, Eye } from "lucide-react"

import { Button } from "../../../components/atoms/Button"
import { toDateTimeString } from "../../shared/format"
import type { AuditLog } from "../types"
import { AuditLogActionBadge } from "./AuditLogActionBadge"
import { AuditLogDetailsDialog } from "./AuditLogDetailsDialog"
import { AuditLogStatusBadge } from "./AuditLogStatusBadge"

interface AuditLogsTableProps {
  logs: AuditLog[]
}

function displayValue(value: string) {
  return value && value !== "—" ? value : "—"
}

const headers = ["Yönetici", "İşlem", "İşlem türü", "Hedef", "Durum", "Tarih"]

export function AuditLogsTable({ logs }: AuditLogsTableProps) {
  const [detailsTarget, setDetailsTarget] = useState<AuditLog | null>(null)

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-surface-2">
                {headers.map((header) => (
                  <th className="px-4 py-3 text-xs font-semibold text-muted" key={header} scope="col">
                    {header}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted" scope="col">
                  <span className="sr-only">Ayrıntılar</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  className="border-b border-line transition-colors last:border-b-0 hover:bg-surface-2/60"
                  key={log.id}
                >
                  <td className="px-4 py-3">
                    <div className="max-w-[220px] truncate text-sm font-semibold text-ink" title={log.adminId}>
                      {displayValue(log.adminName ?? log.adminId)}
                    </div>
                    {log.adminName && (
                      <div className="max-w-[220px] truncate font-mono text-xs text-muted">
                        {log.adminId}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-[260px] truncate text-sm text-ink-soft" title={log.action}>
                      {displayValue(log.action)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <AuditLogActionBadge actionType={log.actionType} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-[220px] truncate text-sm font-medium text-ink">
                      {displayValue(log.targetType)}
                    </div>
                    <div className="mt-0.5 max-w-[220px] truncate text-xs text-muted" title={log.targetId}>
                      {displayValue(log.targetId)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <AuditLogStatusBadge status={log.status} />
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap tabular-nums text-ink-soft">
                    {toDateTimeString(log.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button onClick={() => setDetailsTarget(log)} size="sm" variant="ghost">
                      <Eye aria-hidden className="size-3.5" />
                      Ayrıntılar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
            <CircleSlash aria-hidden className="size-6 text-muted" />
            <p className="text-sm font-semibold text-ink">Filtrelere uyan kayıt yok.</p>
            <p className="text-sm text-muted">Aramayı temizleyin ya da filtreleri genişletin.</p>
          </div>
        )}
      </div>

      <AuditLogDetailsDialog
        log={detailsTarget}
        onClose={() => setDetailsTarget(null)}
      />
    </>
  )
}
