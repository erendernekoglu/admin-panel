import type { LucideIcon } from "lucide-react"

import { cn } from "../../../lib/utils"

interface AuditLogsKpiCardProps {
  helper?: string
  icon: LucideIcon
  label: string
  tone?: "default" | "danger"
  value: string
}

/** One cell of the audit stat strip; the grid draws the dividers. */
export function AuditLogsKpiCard({
  helper,
  icon: Icon,
  label,
  tone = "default",
  value,
}: AuditLogsKpiCardProps) {
  return (
    <div className="min-w-0 bg-surface p-4 sm:p-5">
      <div className="flex items-center gap-2 text-ink-soft">
        <Icon aria-hidden className={cn("size-4 shrink-0", tone === "danger" ? "text-danger" : "text-muted")} />
        <p className="truncate text-sm font-semibold">{label}</p>
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-bold tabular-nums",
          tone === "danger" ? "text-danger" : "text-ink",
        )}
      >
        {value}
      </p>
      {helper ? <p className="mt-1 text-xs text-muted">{helper}</p> : null}
    </div>
  )
}
