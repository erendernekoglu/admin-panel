import type { ReactNode } from "react"

import { Card, CardHeader } from "../../../components/molecules/Card"
import { cn } from "../../../lib/utils"

interface DashboardChartCardProps {
  children: ReactNode
  className?: string
  description?: string
  empty?: boolean
  title: string
}

export function DashboardChartCard({
  children,
  className,
  description,
  empty = false,
  title,
}: DashboardChartCardProps) {
  return (
    <Card className={cn("h-full p-5", className)}>
      <CardHeader className="mb-4" description={description} title={title} />
      {empty ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-line-strong px-6 text-center text-sm text-muted">
          Bu aralıkta veri yok. Üstten daha uzun bir aralık seçmeyi deneyin.
        </div>
      ) : (
        children
      )}
    </Card>
  )
}
