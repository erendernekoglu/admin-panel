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

export interface MediaPublishingPoint {
  date: string
  posts: number
}

interface MediaPublishingChartProps {
  data: MediaPublishingPoint[]
  empty?: boolean
}

export function MediaPublishingChart({
  data,
  empty = false,
}: MediaPublishingChartProps) {
  return (
    <Card className="p-5">
      <CardHeader
        title="Yayın akışı"
        description="Yazılar yayın tarihine, yoksa oluşturulma tarihine göre gruplanır (son 14 gün)."
        className="mb-4"
      />
      {empty ? (
        <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-line-strong px-6 text-center text-sm text-muted">
          Henüz yayın etkinliği yok. Yeni yazılar yayımlandıkça grafik burada oluşur.
        </div>
      ) : (
        <ResponsiveContainer height={300} width="100%">
          <BarChart data={data}>
            <CartesianGrid {...chartGridStyle} vertical={false} />
            <XAxis dataKey="date" {...chartAxisStyle} />
            <YAxis allowDecimals={false} {...chartAxisStyle} />
            <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "var(--surface-2)" }} />
            <Bar
              dataKey="posts"
              fill={CHART_COLORS.primary}
              name="Yazı"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
