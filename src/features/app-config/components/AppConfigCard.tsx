import type { ReactNode } from "react"

import { Badge } from "../../../components/atoms/Badge"
import { Card } from "../../../components/molecules/Card"

interface AppConfigCardProps {
  children: ReactNode
  description: string
  isDirty?: boolean
  title: string
  updatedAt: string
  updatedBy: string
}

export function AppConfigCard({
  children,
  description,
  isDirty = false,
  title,
  updatedAt,
  updatedBy,
}: AppConfigCardProps) {
  return (
    <Card className="min-w-0">
      <div className="flex flex-col gap-4 border-b border-line px-5 py-5 sm:px-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-ink">{title}</h2>
            {isDirty ? <Badge tone="accent">Kaydedilmemiş değişiklik</Badge> : null}
          </div>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">{description}</p>
        </div>

        <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-1 text-sm xl:min-w-[320px]">
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted">Son güncelleme</dt>
            <dd className="mt-0.5 tabular-nums text-ink">{updatedAt}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted">Güncelleyen</dt>
            <dd className="mt-0.5 break-all text-ink">{updatedBy}</dd>
          </div>
        </dl>
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </Card>
  )
}
