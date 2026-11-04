import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardHeader } from "../../../components/molecules/Card"
import {
  CHART_COLORS,
  chartAxisStyle,
  chartGridStyle,
  chartTooltipStyle,
} from "../../../lib/charts/chartTheme"
import type { WardrobeTrendPoint } from "../types"

interface WardrobeTrendChartProps {
  data: WardrobeTrendPoint[]
  empty?: boolean
}

export function WardrobeTrendChart({ data, empty = false }: WardrobeTrendChartProps) {
  return (
    <Card className="p-5">
      <CardHeader
        title="Yeni parça akışı"
        description="Seçilen dönemde gardıroba eklenen parçalar."
        className="mb-4"
      />
      {empty ? (
        <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-line-strong px-6 text-center text-sm text-muted">
          Bu dönemde yeni parça eklenmedi. Daha uzun bir dönem seçmeyi deneyin.
        </div>
      ) : (
        <ResponsiveContainer height={300} width="100%">
          <BarChart data={data}>
            <CartesianGrid {...chartGridStyle} vertical={false} />
            <XAxis dataKey="date" {...chartAxisStyle} />
            <YAxis allowDecimals={false} {...chartAxisStyle} />
            <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "var(--surface-2)" }} />
            <Bar
              dataKey="items"
              fill={CHART_COLORS.primary}
              name="Parça"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
