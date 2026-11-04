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

export interface SubscriptionDistributionPoint {
  name: string
  users: number
}

interface SubscriptionDistributionChartProps {
  data: SubscriptionDistributionPoint[]
  empty?: boolean
}

export function SubscriptionDistributionChart({
  data,
  empty = false,
}: SubscriptionDistributionChartProps) {
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        description="Kullanıcı profillerindeki plan bilgisine göre dağılım."
        title="Plan dağılımı"
      />
      <div className="mt-5">
        {empty ? (
          <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-line-strong px-6 text-center text-sm text-muted">
            Plan bilgisi olan kullanıcı yok. Kullanıcılar kaydoldukça dağılım
            burada görünür.
          </div>
        ) : (
          <ResponsiveContainer height={300} width="100%">
            <BarChart data={data}>
              <CartesianGrid {...chartGridStyle} vertical={false} />
              <XAxis dataKey="name" tickLine={false} {...chartAxisStyle} />
              <YAxis allowDecimals={false} tickLine={false} width={44} {...chartAxisStyle} />
              <Tooltip
                contentStyle={chartTooltipStyle}
                cursor={{ fill: CHART_COLORS.gray, fillOpacity: 0.12 }}
              />
              <Bar
                dataKey="users"
                fill={CHART_COLORS.primary}
                name="Kullanıcı"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}
