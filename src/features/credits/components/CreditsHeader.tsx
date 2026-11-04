import { SlidersHorizontal } from "lucide-react"

import { Button } from "../../../components/atoms/Button"
import { PageHeader } from "../../../components/molecules/PageHeader"
import { DateRangeSelector } from "../../dashboard/components/DateRangeSelector"
import type { DashboardRangeDays } from "../../dashboard/types"

interface CreditsHeaderProps {
  rangeDays: DashboardRangeDays
  onRangeChange: (value: DashboardRangeDays) => void
}

export function CreditsHeader({
  rangeDays,
  onRangeChange,
}: CreditsHeaderProps) {
  return (
    <PageHeader
      actions={
        <>
          <DateRangeSelector onChange={onRangeChange} value={rangeDays} />
          <Button
            disabled
            title="Kredi düzenleme yakında eklenecek"
            variant="secondary"
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            Kredi düzenle
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-soft">
              Yakında
            </span>
          </Button>
        </>
      }
      description="Seçili tarih aralığındaki kredi yüklemelerini, harcamaları ve son bakiye hareketlerini izleyin."
      title="Krediler"
    />
  )
}
