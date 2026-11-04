import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { Badge, type BadgeTone } from "../../../components/atoms/Badge/Badge"
import { Card } from "../../../components/molecules/Card"
import { cn } from "../../../lib/utils"

type Tone = "neutral" | "good" | "warning" | "critical"

const toneBadge: Record<Exclude<Tone, "neutral">, { label: string; tone: BadgeTone }> = {
  good: { label: "Hedefte", tone: "success" },
  warning: { label: "İzleyin", tone: "warning" },
  critical: { label: "Kritik", tone: "danger" },
}

/**
 * One band holding a section's headline metrics. Cells are separated by
 * hairlines rather than each living in its own card.
 */
export function LaunchMetricStrip({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <Card className="overflow-hidden">
      {/* An odd last cell spans the two-column layout so no empty hairline block shows;
          at xl every metric gets its own column (pass xl:grid-cols-N via className). */}
      <div
        className={cn(
          "grid grid-cols-1 gap-px bg-line min-[420px]:grid-cols-2 min-[420px]:[&>*:last-child:nth-child(odd)]:col-span-2 xl:[&>*:last-child:nth-child(odd)]:col-span-1",
          className,
        )}
      >
        {children}
      </div>
    </Card>
  )
}

export function LaunchMetricCard({
  helper,
  icon: Icon,
  label,
  tone = "neutral",
  value,
}: {
  helper?: string
  icon: LucideIcon
  label: string
  tone?: Tone
  value: string
}) {
  const status = tone === "neutral" ? null : toneBadge[tone]

  return (
    <div className="flex min-w-0 flex-col bg-surface p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
        <Icon aria-hidden className="size-4 shrink-0 text-muted" />
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-3 text-[clamp(1.75rem,3vw,2.25rem)] leading-none font-extrabold tracking-tight tabular-nums text-ink">
        {value}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {status ? <Badge tone={status.tone}>{status.label}</Badge> : null}
        {helper ? <p className="text-xs text-muted">{helper}</p> : null}
      </div>
    </div>
  )
}
