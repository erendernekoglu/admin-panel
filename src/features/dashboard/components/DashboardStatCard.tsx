import type { LucideIcon } from "lucide-react"

import { Badge } from "../../../components/atoms/Badge"

interface DashboardStatCardProps {
  helper?: string
  icon: LucideIcon
  label: string
  trend?: string
  value: string
}

/**
 * Compact secondary metric. Sits inside a quiet group on the dashboard, so it
 * carries no surface of its own — the headline numbers get the weight.
 */
export function DashboardStatCard({
  helper,
  icon: Icon,
  label,
  trend,
  value,
}: DashboardStatCardProps) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-muted">
        <Icon aria-hidden className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-soft">{label}</p>
        {helper ? <p className="mt-0.5 text-xs text-muted">{helper}</p> : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-lg font-bold tabular-nums text-ink">{value}</p>
        {trend ? <Badge>{trend}</Badge> : null}
      </div>
    </div>
  )
}
