import { useState } from "react"

import { Card } from "../../../components/molecules/Card"
import { toDate } from "../../shared/format"
import type { ApiKey } from "../types"

function KpiCard({
  hint,
  label,
  value,
}: {
  hint: string
  label: string
  value: number | string
}) {
  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-ink-soft">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-ink">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </Card>
  )
}

export function ApiKeysKpiGrid({ keys }: { keys: ApiKey[] }) {
  // Pinned at mount: reading the clock during render makes the same props
  // produce different output on an incidental re-render.
  const [now] = useState(() => Date.now())
  const active = keys.filter((key) => key.status === "active").length
  const live = keys.filter((key) => key.env === "live" && key.status === "active").length
  const revoked = keys.filter((key) => key.status === "revoked").length
  const expiringSoon = keys.filter((key) => {
    if (key.status !== "active") return false
    const expires = toDate(key.expiresAt)
    if (!expires) return false
    const days = (expires.getTime() - now) / 86_400_000

    return days >= 0 && days <= 14
  }).length

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <KpiCard hint="Şu anda kullanılabilir" label="Etkin anahtarlar" value={active} />
      <KpiCard hint="Gerçek trafik faturalanır" label="Canlı anahtarlar" value={live} />
      <KpiCard hint="14 gün içinde" label="Süresi dolacak" value={expiringSoon} />
      <KpiCard hint="Kalıcı olarak kapatıldı" label="İptal edilen" value={revoked} />
    </div>
  )
}
