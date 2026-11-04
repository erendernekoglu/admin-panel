import { Eye } from "lucide-react"

import { Button } from "../../../components/atoms/Button"
import { Card, CardHeader } from "../../../components/molecules/Card"
import { toDateTimeString } from "../../shared/format"
import { cn } from "../../../lib/utils"
import type { WeatherForecast, WeatherLocation } from "../types"

interface WeatherForecastsTableProps {
  forecasts: WeatherForecast[]
  locationsById: Map<string, WeatherLocation>
  onViewDetail: (forecast: WeatherForecast) => void
}

const slotLabels: Record<string, string> = {
  morning: "Sabah",
  noon: "Öğle",
  evening: "Akşam",
  night: "Gece",
}
const th = "whitespace-nowrap px-4 py-3 text-xs font-semibold text-muted"
const td = "px-4 py-3.5 align-top"

function formatTemperature(value?: number) {
  return typeof value === "number" ? `${Math.round(value)}°` : "—"
}

function getTimeSlot(forecast: WeatherForecast) {
  if (forecast.timeSlot) return forecast.timeSlot
  if (forecast.morning) return "morning"
  if (forecast.noon) return "noon"
  if (forecast.evening) return "evening"
  if (forecast.night) return "night"
  return "—"
}

function getCondition(forecast: WeatherForecast) {
  return (
    forecast.dominantCondition ??
    forecast.noon?.condition ??
    forecast.morning?.condition ??
    forecast.evening?.condition ??
    forecast.night?.condition ??
    "—"
  )
}

function getTemperature(forecast: WeatherForecast) {
  return forecast.daytimeAverage ?? forecast.dailyHigh ?? forecast.noon?.temperature
}

export function WeatherForecastsTable({
  forecasts,
  locationsById,
  onViewDetail,
}: WeatherForecastsTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line p-5">
        <CardHeader
          title="Tahminler"
          description="Tahmin kayıtları salt okunurdur; ayrıntı için satırdaki düğmeyi kullanın."
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2">
              <th className={th}>Konum</th>
              <th className={th}>Tarih</th>
              <th className={th}>Zaman dilimi</th>
              <th className={cn(th, "text-right")}>Sıcaklık</th>
              <th className={th}>Durum</th>
              <th className={th}>Güncellendi</th>
              <th className={th}>
                <span className="sr-only">İşlemler</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {forecasts.map((forecast) => {
              const location = locationsById.get(forecast.locationId)
              const slot = getTimeSlot(forecast)

              return (
                <tr
                  className="border-b border-line last:border-0 hover:bg-surface-2/60"
                  key={forecast.id}
                >
                  <td className={td}>
                    <p className="font-semibold text-ink">
                      {forecast.locationName ??
                        location?.district ??
                        location?.city ??
                        "Konum bilinmiyor"}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted">
                      {forecast.locationId || "—"}
                    </p>
                  </td>
                  <td className={cn(td, "whitespace-nowrap text-ink-soft")}>{forecast.date || "—"}</td>
                  <td className={cn(td, "text-ink-soft")}>{slotLabels[slot] ?? slot}</td>
                  <td className={cn(td, "text-right text-base font-bold tabular-nums text-ink")}>
                    {formatTemperature(getTemperature(forecast))}
                  </td>
                  <td className={cn(td, "text-ink-soft")}>{getCondition(forecast)}</td>
                  <td className={cn(td, "whitespace-nowrap text-ink-soft")}>
                    {toDateTimeString(forecast.updatedAt ?? forecast.lastUpdated)}
                  </td>
                  <td className={cn(td, "text-right")}>
                    <Button
                      onClick={() => onViewDetail(forecast)}
                      size="sm"
                      variant="secondary"
                    >
                      <Eye aria-hidden="true" className="size-3.5" />
                      Ayrıntılar
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {forecasts.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="text-base font-bold text-ink">Tahmin bulunamadı</p>
          <p className="mt-2 text-sm text-muted">
            Bu dönem için tahmin kaydı yok. “Hava durumunu güncelle” ile yeni tahminleri başlatabilirsiniz.
          </p>
        </div>
      ) : null}
    </Card>
  )
}
