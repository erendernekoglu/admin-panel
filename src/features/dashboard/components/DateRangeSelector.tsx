import {
  SegmentedControl,
  type SegmentedOption,
} from "../../../components/molecules/SegmentedControl"
import type { DashboardRangeDays } from "../types"

const OPTIONS: Array<SegmentedOption<DashboardRangeDays>> = [
  { label: "7 gün", value: 7 },
  { label: "30 gün", value: 30 },
  { label: "90 gün", value: 90 },
]

const WITH_LAST_24_HOURS: Array<SegmentedOption<DashboardRangeDays>> = [
  { label: "Son 24 saat", value: 1 },
  ...OPTIONS,
]

interface DateRangeSelectorProps {
  value: DashboardRangeDays
  onChange: (value: DashboardRangeDays) => void
  includeLast24Hours?: boolean
}

export function DateRangeSelector({
  value,
  onChange,
  includeLast24Hours = false,
}: DateRangeSelectorProps) {
  return (
    <SegmentedControl
      label="Tarih aralığı"
      onChange={onChange}
      options={includeLast24Hours ? WITH_LAST_24_HOURS : OPTIONS}
      value={value}
    />
  )
}
