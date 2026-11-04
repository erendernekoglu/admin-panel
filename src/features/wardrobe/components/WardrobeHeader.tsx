import { PageHeader } from "../../../components/molecules/PageHeader"
import { DateRangeSelector } from "../../dashboard/components/DateRangeSelector"
import type { DashboardRangeDays } from "../../dashboard/types"
import { WARDROBE_DESCRIPTION, WARDROBE_TITLE } from "../copy"

interface WardrobeHeaderProps {
  onRangeChange: (value: DashboardRangeDays) => void
  rangeDays: DashboardRangeDays
}


export function WardrobeHeader({ onRangeChange, rangeDays }: WardrobeHeaderProps) {
  return (
    <PageHeader
      title={WARDROBE_TITLE}
      description={WARDROBE_DESCRIPTION}
      actions={<DateRangeSelector onChange={onRangeChange} value={rangeDays} />}
    />
  )
}
