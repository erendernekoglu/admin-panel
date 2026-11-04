import { Badge } from "../../../components/atoms/Badge/Badge"
import { Card, CardHeader } from "../../../components/molecules/Card"
import { toDateTimeString } from "../../shared/format"
import { cn } from "../../../lib/utils"
import type { WeatherLocation } from "../types"

interface WeatherLocationsTableProps {
  locations: WeatherLocation[]
}

const th = "whitespace-nowrap px-4 py-3 text-xs font-semibold text-muted"
const td = "px-4 py-3.5 align-top"

function formatCoordinates(location: WeatherLocation) {
  if (!location.coordinates) return "—"
  return `${location.coordinates.lat.toFixed(4)}, ${location.coordinates.lon.toFixed(4)}`
}

export function WeatherLocationsTable({ locations }: WeatherLocationsTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line p-5">
        <CardHeader
          title="Konumlar"
          description="Tahminlerde kullanılan konum kayıtları (salt okunur)."
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2">
              <th className={th}>Konum</th>
              <th className={th}>Şehir / ülke</th>
              <th className={th}>Enlem / boylam</th>
              <th className={th}>Durum</th>
              <th className={th}>Güncellendi</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => (
              <tr
                className="border-b border-line last:border-0 hover:bg-surface-2/60"
                key={location.id}
              >
                <td className={td}>
                  <p className="font-semibold text-ink">
                    {location.district || location.city}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted">{location.id}</p>
                </td>
                <td className={cn(td, "text-ink-soft")}>
                  {location.city}
                  {location.country ? ` / ${location.country}` : ""}
                </td>
                <td className={cn(td, "font-mono text-xs tabular-nums text-ink-soft")}>
                  {formatCoordinates(location)}
                </td>
                <td className={td}>
                  {typeof location.active === "boolean" ? (
                    <Badge tone={location.active ? "success" : "neutral"}>
                      {location.active ? "Aktif" : "Pasif"}
                    </Badge>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className={cn(td, "whitespace-nowrap text-ink-soft")}>
                  {toDateTimeString(location.updatedAt ?? location.lastUpdated)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {locations.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="text-base font-bold text-ink">Konum bulunamadı</p>
          <p className="mt-2 text-sm text-muted">
            Henüz konum kaydı yok. “Konumları eşitle” ile kullanıcı konumlarını aktarabilirsiniz.
          </p>
        </div>
      ) : null}
    </Card>
  )
}
