import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

export interface CreditTrendPoint {
  date: string
  load: number
  spend: number
}

interface CreditTrendChartProps {
  data: CreditTrendPoint[]
  empty?: boolean
}

export function CreditTrendChart({ data, empty = false }: CreditTrendChartProps) {
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        description="Seçili aralığa göre günlük ya da haftalık kredi hareketi."
        title="Yükleme ve harcama eğilimi"
      />
      <div className="mt-5">
        {empty ? (
          <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-line-strong px-6 text-center text-sm text-muted">
            Bu aralıkta kredi hareketi yok. Daha geniş bir tarih aralığı seçin.
          </div>
        ) : (
          <ResponsiveContainer height={300} width="100%">
            <BarChart data={data}>
              <CartesianGrid {...chartGridStyle} vertical={false} />
              <XAxis dataKey="date" tickLine={false} {...chartAxisStyle} />
              <YAxis allowDecimals={false} tickLine={false} width={44} {...chartAxisStyle} />
              <Tooltip
                contentStyle={chartTooltipStyle}
                cursor={{ fill: CHART_COLORS.gray, fillOpacity: 0.12 }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="load"
                fill={CHART_COLORS.green}
                name="Yüklenen kredi"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="spend"
                fill={CHART_COLORS.primary}
                name="Harcanan kredi"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}
