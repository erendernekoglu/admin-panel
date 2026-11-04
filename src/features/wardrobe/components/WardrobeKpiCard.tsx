import type { LucideIcon } from "lucide-react"

import { Card } from "../../../components/molecules/Card"

interface WardrobeKpiCardProps {
  helper?: string
  icon: LucideIcon
  label: string
  value: string
}

export function WardrobeKpiCard({
  helper,
  icon: Icon,
  label,
  value,
}: WardrobeKpiCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-soft">{label}</p>
        <Icon aria-hidden="true" className="size-4 shrink-0 text-muted" />
      </div>
      <p className="mt-3 truncate text-2xl font-extrabold tracking-tight tabular-nums text-ink">
        {value}
      </p>
      {helper ? <p className="mt-1.5 text-xs text-muted">{helper}</p> : null}
    </Card>
  )
}
