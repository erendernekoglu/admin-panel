import type { LucideIcon } from "lucide-react"

interface RedeemCodesKpiCardProps {
  helper?: string
  icon: LucideIcon
  label: string
  value: string
}

/** One figure inside the redeem-code summary strip (not a standalone card). */
export function RedeemCodesKpiCard({
  helper,
  icon: Icon,
  label,
  value,
}: RedeemCodesKpiCardProps) {
  return (
    <div className="min-w-0 bg-surface p-5">
      <dt className="flex items-center gap-2 text-sm font-medium text-ink-soft">
        <Icon aria-hidden="true" className="size-4 shrink-0 text-muted" />
        <span className="truncate">{label}</span>
      </dt>
      <dd className="mt-2 text-2xl font-bold tabular-nums text-ink">{value}</dd>
      {helper ? <dd className="mt-1 text-xs text-muted">{helper}</dd> : null}
    </div>
  )
}
