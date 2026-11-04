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
import type { WardrobeCategoryPoint } from "../types"

interface WardrobeCategoryChartProps {
  data: WardrobeCategoryPoint[]
  empty?: boolean
}

export function WardrobeCategoryChart({
  data,
  empty = false,
}: WardrobeCategoryChartProps) {
  return (
    <Card className="p-5">
      <CardHeader
        title="Kategori dağılımı"
        description="Parça kayıtlarında en sık görülen sekiz kategori."
        className="mb-4"
      />
      {empty ? (
        <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-line-strong px-6 text-center text-sm text-muted">
          Kategori verisi yok. Kullanıcılar gardıroba parça ekledikçe dağılım burada oluşur.
        </div>
      ) : (
        <ResponsiveContainer height={300} width="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid {...chartGridStyle} horizontal={false} />
            <XAxis allowDecimals={false} type="number" {...chartAxisStyle} />
            <YAxis dataKey="name" type="category" width={120} {...chartAxisStyle} />
            <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "var(--surface-2)" }} />
            <Bar
              dataKey="count"
              fill={CHART_COLORS.black}
              name="Parça"
              radius={[0, 6, 6, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
