import { X } from "lucide-react"

import { Button } from "../../../components/atoms/Button"
import { Dialog } from "../../../components/molecules/Dialog"
import { toDateTimeString } from "../../shared/format"
import type { TimeSlotWeather, WeatherForecast, WeatherLocation } from "../types"

interface WeatherForecastDetailDialogProps {
  forecast: WeatherForecast | null
  location?: WeatherLocation
  onClose: () => void
}

const slots: Array<{ key: keyof Pick<WeatherForecast, "morning" | "noon" | "evening" | "night">; label: string }> = [
  { key: "morning", label: "Sabah" },
  { key: "noon", label: "Öğle" },
  { key: "evening", label: "Akşam" },
  { key: "night", label: "Gece" },
]

function formatTemperature(value?: number) {
  return typeof value === "number" ? `${Math.round(value)}°` : "—"
}

function SlotCard({ label, slot }: { label: string; slot?: TimeSlotWeather }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      {slot ? (
        <div className="mt-2 space-y-1 text-sm text-ink-soft">
          <p className="text-2xl font-extrabold tabular-nums text-ink">
            {formatTemperature(slot.temperature)}
          </p>
          <p className="font-medium text-ink">{slot.condition ?? "—"}</p>
          <p>Hissedilen: <span className="tabular-nums">{formatTemperature(slot.feelsLike)}</span></p>
          <p>Nem: <span className="tabular-nums">{typeof slot.humidity === "number" ? `%${slot.humidity}` : "—"}</span></p>
          <p>
            Rüzgâr:{" "}
            <span className="tabular-nums">
              {typeof slot.windSpeed === "number"
                ? `${Math.round(slot.windSpeed)} km/sa`
                : "—"}
            </span>
          </p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted">Bu zaman dilimi için veri yok.</p>
      )}
    </div>
  )
}

export function WeatherForecastDetailDialog({
  forecast,
  location,
  onClose,
}: WeatherForecastDetailDialogProps) {
  if (!forecast) return null

  return (
    <Dialog closeOnBackdrop labelledBy="forecast-detail-title" onClose={onClose} size="lg">
      <div className="flex items-start justify-between gap-4 border-b border-line p-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted">Tahmin ayrıntısı</p>
          <h2 id="forecast-detail-title" className="mt-1 text-xl font-bold text-ink">
            {location?.district ?? location?.city ?? forecast.locationName ?? "Hava durumu tahmini"}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {forecast.date || "—"} · Güncellendi:{" "}
            {toDateTimeString(forecast.updatedAt ?? forecast.lastUpdated)}
          </p>
        </div>
        <Button autoFocus onClick={onClose} size="sm" variant="ghost">
          <X aria-hidden="true" className="size-4" />
          Kapat
        </Button>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-3 gap-3">
          <Summary label="En yüksek" value={formatTemperature(forecast.dailyHigh)} />
          <Summary label="En düşük" value={formatTemperature(forecast.dailyLow)} />
          <Summary
            label="Gündüz ortalaması"
            value={formatTemperature(forecast.daytimeAverage)}
          />
        </div>

        <div className="rounded-xl border border-line p-4">
          <p className="text-sm font-bold text-ink">Özet</p>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div><dt className="inline text-muted">Durum: </dt><dd className="inline text-ink">{forecast.dominantCondition ?? "—"}</dd></div>
            <div><dt className="inline text-muted">Simge: </dt><dd className="inline text-ink">{forecast.dominantIcon ?? "—"}</dd></div>
            <div className="min-w-0"><dt className="inline text-muted">Konum ID: </dt><dd className="inline break-all font-mono text-xs text-ink">{forecast.locationId || "—"}</dd></div>
            <div className="min-w-0"><dt className="inline text-muted">Tahmin ID: </dt><dd className="inline break-all font-mono text-xs text-ink">{forecast.id}</dd></div>
          </dl>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {slots.map(({ key, label }) => (
            <SlotCard key={key} label={label} slot={forecast[key]} />
          ))}
        </div>
      </div>
    </Dialog>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 p-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-ink sm:text-3xl">{value}</p>
    </div>
  )
}
