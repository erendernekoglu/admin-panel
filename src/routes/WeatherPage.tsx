import { useMemo, useState } from "react"

import { WeatherActionsPanel } from "../features/weather/components/WeatherActionsPanel"
import { WeatherErrorState } from "../features/weather/components/WeatherErrorState"
import { WeatherForecastDetailDialog } from "../features/weather/components/WeatherForecastDetailDialog"
import { WeatherForecastsTable } from "../features/weather/components/WeatherForecastsTable"
import { WeatherHeader } from "../features/weather/components/WeatherHeader"
import { WeatherKpiGrid } from "../features/weather/components/WeatherKpiGrid"
import { WeatherLocationsTable } from "../features/weather/components/WeatherLocationsTable"
import { WeatherSkeleton } from "../features/weather/components/WeatherSkeleton"
import { useWeatherAdminData } from "../features/weather/hooks/useWeatherAdminData"
import type { WeatherForecast } from "../features/weather/types"
import { toDate } from "../features/shared/format"

export default function WeatherPage() {
  const { data, error, isError, isPending } = useWeatherAdminData()
  const [selectedForecast, setSelectedForecast] = useState<WeatherForecast | null>(
    null,
  )

  const locations = useMemo(() => data?.locations ?? [], [data?.locations])
  const forecasts = useMemo(() => data?.forecasts ?? [], [data?.forecasts])

  const locationsById = useMemo(
    () => new Map(locations.map((location) => [location.id, location])),
    [locations],
  )

  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => {
      if (b.userCount !== a.userCount) return b.userCount - a.userCount
      return (a.district ?? a.city).localeCompare(b.district ?? b.city, "tr")
    })
  }, [locations])

  const sortedForecasts = useMemo(() => {
    return [...forecasts].sort((a, b) => {
      const dateCompare = (b.date ?? "").localeCompare(a.date ?? "")
      if (dateCompare !== 0) return dateCompare

      const bUpdated = toDate(b.updatedAt ?? b.lastUpdated)?.getTime() ?? 0
      const aUpdated = toDate(a.updatedAt ?? a.lastUpdated)?.getTime() ?? 0
      return bUpdated - aUpdated
    })
  }, [forecasts])

  const latestForecastUpdate = useMemo(() => {
    return forecasts.reduce<unknown>((latest, forecast) => {
      const currentDate = toDate(forecast.updatedAt ?? forecast.lastUpdated)
      const latestDate = toDate(latest)
      if (currentDate && (!latestDate || currentDate > latestDate)) {
        return forecast.updatedAt ?? forecast.lastUpdated
      }
      return latest
    }, undefined)
  }, [forecasts])

  const hasActiveField = locations.some(
    (location) => typeof location.active === "boolean",
  )
  const activeLocations = hasActiveField
    ? locations.filter((location) => location.active === true).length
    : null
  const isEmpty = locations.length === 0 && forecasts.length === 0

  if (isPending) return <WeatherSkeleton />
  if (isError) return <WeatherErrorState error={error} />

  return (
    <section className="space-y-6">
      <WeatherHeader />
      <WeatherActionsPanel />

      {isEmpty ? (
        <div className="rounded-2xl border border-dashed border-line-strong p-8 text-center">
          <p className="text-base font-bold text-ink">Henüz hava durumu verisi yok</p>
          <p className="mt-2 text-sm text-muted">
            Konum veya tahmin kaydı bulunamadı. Önce “Konumları eşitle”, ardından “Hava durumunu güncelle” işlemini çalıştırın.
          </p>
        </div>
      ) : null}

      <WeatherKpiGrid
        activeLocations={activeLocations}
        forecastRecords={forecasts.length}
        latestForecastUpdate={latestForecastUpdate}
        totalLocations={locations.length}
      />

      <WeatherLocationsTable locations={sortedLocations} />
      <WeatherForecastsTable
        forecasts={sortedForecasts}
        locationsById={locationsById}
        onViewDetail={setSelectedForecast}
      />

      <WeatherForecastDetailDialog
        forecast={selectedForecast}
        location={
          selectedForecast ? locationsById.get(selectedForecast.locationId) : undefined
        }
        onClose={() => setSelectedForecast(null)}
      />
    </section>
  )
}
