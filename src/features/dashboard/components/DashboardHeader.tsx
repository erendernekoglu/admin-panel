import { PageHeader } from "../../../components/molecules/PageHeader"
import type { DashboardRangeDays } from "../types"
import { DateRangeSelector } from "./DateRangeSelector"

interface DashboardHeaderProps {
  rangeDays: DashboardRangeDays
  onRangeChange: (value: DashboardRangeDays) => void
}

export function DashboardHeader({
  rangeDays,
  onRangeChange,
}: DashboardHeaderProps) {
  return (
    <PageHeader
      actions={
        <DateRangeSelector
          includeLast24Hours
          onChange={onRangeChange}
          value={rangeDays}
        />
      }
      description="Kullanıcı büyümesi, kredi hareketleri ve uygulama ayarlarının durumu tek bakışta."
      title="Genel bakış"
    />
  )
}
