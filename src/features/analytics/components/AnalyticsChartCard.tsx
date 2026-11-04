import type { ReactNode } from "react"

import { Card, CardHeader } from "../../../components/molecules/Card"
import { cn } from "../../../lib/utils"

interface AnalyticsChartCardProps {
  actions?: ReactNode
  children: ReactNode
  className?: string
  description?: ReactNode
  empty?: boolean
  emptyText?: string
  title: string
  tone?: "default" | "quiet"
}

export function AnalyticsChartCard({
  actions,
  children,
  className,
  description,
  empty = false,
  emptyText = "Bu aralıkta veri yok. Tarih aralığını genişletmeyi ya da filtreleri kaldırmayı deneyin.",
  title,
  tone = "default",
}: AnalyticsChartCardProps) {
  return (
    <Card className={cn("h-full min-w-0 p-5", className)} tone={tone}>
      <CardHeader
        actions={actions}
        className="mb-4 flex-wrap"
        description={description}
        title={title}
      />
      {empty ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-line-strong px-6 text-center text-sm text-muted">
          {emptyText}
        </div>
      ) : (
        children
      )}
    </Card>
  )
}
