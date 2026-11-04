import { CalendarDays, CheckCircle2, Clock, MapPin } from "lucide-react"

import { toDateTimeString } from "../../shared/format"
import { WeatherKpiCard } from "./WeatherKpiCard"

interface WeatherKpiGridProps {
  activeLocations: number | null
  forecastRecords: number
  latestForecastUpdate: unknown
  totalLocations: number
}

const numberFormatter = new Intl.NumberFormat("tr-TR")

export function WeatherKpiGrid({
  activeLocations,
  forecastRecords,
  latestForecastUpdate,
  totalLocations,
}: WeatherKpiGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <WeatherKpiCard
        helper="locations koleksiyonundaki kayıtlar"
        icon={MapPin}
        label="Toplam konum"
        value={numberFormatter.format(totalLocations)}
      />
      <WeatherKpiCard
        helper={
          activeLocations === null
            ? "Konum kayıtlarında active alanı yok"
            : "Şu anda aktif işaretli konumlar"
        }
        icon={CheckCircle2}
        label="Aktif konum"
        value={activeLocations === null ? "—" : numberFormatter.format(activeLocations)}
      />
      <WeatherKpiCard
        helper="Geçerli dönem için yüklenen tahminler"
        icon={CalendarDays}
        label="Tahmin kaydı"
        value={numberFormatter.format(forecastRecords)}
      />
      <WeatherKpiCard
        helper="En son tahmin güncellemesi"
        icon={Clock}
        label="Son güncelleme"
        value={toDateTimeString(latestForecastUpdate)}
      />
    </div>
  )
}
