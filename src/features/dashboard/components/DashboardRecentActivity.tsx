import { Badge, type BadgeTone } from "../../../components/atoms/Badge/Badge"
import { Card, CardHeader } from "../../../components/molecules/Card"
import type { DashboardActivity } from "../types"

interface DashboardRecentActivityProps {
  activities: DashboardActivity[]
}

/** Display label and tone for the status values the dashboard service emits. */
function statusPresentation(status: string): { label: string; tone: BadgeTone } {
  if (status === "Spend") return { label: "Harcama", tone: "neutral" }
  if (status === "Load") return { label: "Yükleme", tone: "success" }
  return { label: status, tone: "neutral" }
}

export function DashboardRecentActivity({
  activities,
}: DashboardRecentActivityProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="px-5 py-4"
        description="En son kredi işlemleri ve benzeri kayıtlar."
        title="Son hareketler"
      />

      {activities.length === 0 ? (
        <div className="border-t border-line px-5 py-10 text-center text-sm text-muted">
          Henüz hareket yok. Kullanıcılar kredi harcadığında veya yüklediğinde burada görünecek.
        </div>
      ) : (
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface-2 text-xs font-semibold text-muted">
              <tr>
                <th className="px-5 py-2.5 font-semibold" scope="col">İşlem</th>
                <th className="px-5 py-2.5 font-semibold" scope="col">Kullanıcı</th>
                <th className="px-5 py-2.5 text-right font-semibold" scope="col">Miktar</th>
                <th className="px-5 py-2.5 font-semibold" scope="col">Tarih</th>
                <th className="px-5 py-2.5 font-semibold" scope="col">Durum</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => {
                const status = statusPresentation(activity.status)
                return (
                  <tr
                    className="border-t border-line transition-colors hover:bg-surface-2/60"
                    key={activity.id}
                  >
                    <td className="px-5 py-3 font-semibold text-ink">
                      {activity.type}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{activity.user}</td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-ink">
                      {typeof activity.amount === "number"
                        ? formatAmount(activity.amount)
                        : "—"}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap tabular-nums text-ink-soft">
                      {activity.date}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

function formatAmount(value: number) {
  const sign = value > 0 ? "+" : ""
  return `${sign}${new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 0,
  }).format(value)}`
}
