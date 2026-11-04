import type { LucideIcon } from "lucide-react"

import { cn } from "../../../lib/utils"

interface CreditsKpiCardProps {
  helper?: string
  icon: LucideIcon
  label: string
  value: string
  valueClassName?: string
}

/** One figure inside the credits summary strip (not a standalone card). */
export function CreditsKpiCard({
  helper,
  icon: Icon,
  label,
  value,
  valueClassName,
}: CreditsKpiCardProps) {
  return (
    <div className="min-w-0 bg-surface p-5">
      <dt className="flex items-center gap-2 text-sm font-medium text-ink-soft">
        <Icon aria-hidden="true" className="size-4 text-muted" />
        {label}
      </dt>
      <dd
        className={cn(
          "mt-2 text-2xl font-bold tabular-nums text-ink",
          valueClassName,
        )}
      >
        {value}
      </dd>
      {helper ? <dd className="mt-1 text-xs text-muted">{helper}</dd> : null}
    </div>
  )
}
