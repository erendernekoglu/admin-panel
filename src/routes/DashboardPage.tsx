import { useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { AppConfigSummary } from "../features/dashboard/components/AppConfigSummary"
import { RecentActivationJourneys } from "../features/analytics/components/RecentActivationJourneys"
import { toDateInput } from "../features/analytics/analyticsDate"
import { DashboardChartCard } from "../features/dashboard/components/DashboardChartCard"
import { DashboardErrorState } from "../features/dashboard/components/DashboardErrorState"
import { DashboardHeader } from "../features/dashboard/components/DashboardHeader"
import { DashboardNewUsers } from "../features/dashboard/components/DashboardNewUsers"
import { DashboardRecentActivity } from "../features/dashboard/components/DashboardRecentActivity"
import { DashboardSkeleton } from "../features/dashboard/components/DashboardSkeleton"
import {
  DashboardHeadlineMetrics,
  DashboardSecondaryMetrics,
} from "../features/dashboard/components/DashboardStatGrid"
import { useDashboardAccess, useDashboardAnalytics } from "../features/dashboard/hooks/useDashboardAnalytics"
import type { DashboardRangeDays, DashboardStats } from "../features/dashboard/types"
import {
  CHART_COLORS,
  PIE_COLORS,
  chartAxisStyle,
  chartGridStyle,
  chartTooltipStyle,
} from "../lib/charts/chartTheme"

const legendStyle = { fontSize: 12, color: "var(--ink-soft)", paddingTop: 8 } as const

export default function DashboardPage() {
  const [rangeDays, setRangeDays] = useState<DashboardRangeDays>(7)
  const { data, error, isError, isPending, refetch } = useDashboardAnalytics(rangeDays)

  // The header stays put while the body loads, so switching ranges never
  // makes the title or the range control jump.
  return (
    <div className="space-y-8">
      <DashboardHeader onRangeChange={setRangeDays} rangeDays={rangeDays} />
      {isPending ? (
        <DashboardSkeleton />
      ) : isError || !data ? (
        <DashboardErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <DashboardBody data={data} rangeDays={rangeDays} />
      )}
    </div>
  )
}

function DashboardBody({
  data,
  rangeDays,
}: {
  data: DashboardStats
  rangeDays: DashboardRangeDays
}) {
  const hasUserTrend = data.userTrendData.some((point) => point.count > 0)
  const hasCreditTrend = data.creditTrendData.some(
    (point) => point.spend > 0 || point.load > 0,
  )
  const access = useDashboardAccess()
  const subscriptionDistribution = data.subscriptionDistribution
  const hasSubscriptionDistribution = (subscriptionDistribution ?? []).some(
    (point) => point.value > 0,
  )
  const hasAiTrend = data.aiOutputTrendData.some(
    (point) =>
      point.savedResults > 0 ||
      point.savedPhotos > 0 ||
      point.wishlist > 0 ||
      point.calendar > 0,
  )
  const journeyEnd = new Date()
  const journeyStart = new Date(journeyEnd)
  journeyStart.setDate(journeyStart.getDate() - (rangeDays - 1))

  return (
    <div className="space-y-6">
      <DashboardHeadlineMetrics stats={data} />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <DashboardChartCard
            description="Seçili aralıkta günlük yeni kullanıcı sayısı."
            empty={!hasUserTrend}
            title="Yeni kullanıcı eğilimi"
          >
            <ResponsiveContainer height={280} width="100%">
              <AreaChart data={data.userTrendData}>
                <CartesianGrid {...chartGridStyle} />
                <XAxis dataKey="date" {...chartAxisStyle} />
                <YAxis allowDecimals={false} width={40} {...chartAxisStyle} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area
                  dataKey="count"
                  fill={CHART_COLORS.primary}
                  fillOpacity={0.14}
                  name="Yeni kullanıcı"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </DashboardChartCard>
        </div>
        <div className="lg:col-span-4">
          <DashboardSecondaryMetrics stats={data} />
        </div>
      </div>

      {access.users && <DashboardNewUsers key={rangeDays} users={data.newUserProfiles} />}

      {access.users && (
        <RecentActivationJourneys
          filters={{
            startDate: toDateInput(journeyStart),
            endDate: toDateInput(journeyEnd),
            platform: null,
            language: null,
            notificationStatus: null,
            limit: 5,
          }}
          preview
        />
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className={subscriptionDistribution ? "lg:col-span-7" : "lg:col-span-12"}>
          <DashboardChartCard
            description="Kredi harcama ve yükleme işlemlerinin sayısı."
            empty={!hasCreditTrend}
            title="Kredi hareketleri"
          >
            <ResponsiveContainer height={280} width="100%">
              <BarChart data={data.creditTrendData}>
                <CartesianGrid {...chartGridStyle} />
                <XAxis dataKey="date" {...chartAxisStyle} />
                <YAxis allowDecimals={false} width={40} {...chartAxisStyle} />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "var(--surface-2)" }} />
                <Legend wrapperStyle={legendStyle} />
                <Bar
                  dataKey="spend"
                  fill={CHART_COLORS.black}
                  name="Harcama"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="load"
                  fill={CHART_COLORS.primary}
                  name="Yükleme"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </DashboardChartCard>
        </div>

        {subscriptionDistribution && (
          <div className="lg:col-span-5">
            <DashboardChartCard
              description="Kullanıcıların şu anki plan dağılımı."
              empty={!hasSubscriptionDistribution}
              title="Abonelik dağılımı"
            >
              <ResponsiveContainer height={280} width="100%">
                <PieChart>
                  <Pie
                    cx="50%"
                    cy="50%"
                    data={subscriptionDistribution}
                    dataKey="value"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={3}
                    stroke="var(--surface)"
                  >
                    {subscriptionDistribution.map((entry, index) => (
                      <Cell
                        fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]}
                        key={entry.name}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend wrapperStyle={legendStyle} />
                </PieChart>
              </ResponsiveContainer>
            </DashboardChartCard>
          </div>
        )}
      </div>

      <DashboardChartCard
        description="Kaydedilen sonuçlar, fotoğraflar, istek listesi ve takvim kayıtları."
        empty={!hasAiTrend}
        title="Yapay zekâ çıktıları ve kaydedilen içerik"
      >
        <ResponsiveContainer height={280} width="100%">
          <LineChart data={data.aiOutputTrendData}>
            <CartesianGrid {...chartGridStyle} />
            <XAxis dataKey="date" {...chartAxisStyle} />
            <YAxis allowDecimals={false} width={40} {...chartAxisStyle} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Legend wrapperStyle={legendStyle} />
            <Line
              dataKey="savedResults"
              dot={false}
              name="Kaydedilen sonuçlar"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              type="monotone"
            />
            <Line
              dataKey="savedPhotos"
              dot={false}
              name="Kaydedilen fotoğraflar"
              stroke={CHART_COLORS.black}
              strokeWidth={2}
              type="monotone"
            />
            <Line
              dataKey="wishlist"
              dot={false}
              name="İstek listesi"
              stroke={CHART_COLORS.green}
              strokeWidth={2}
              type="monotone"
            />
            <Line
              dataKey="calendar"
              dot={false}
              name="Takvim"
              stroke={CHART_COLORS.amber}
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </DashboardChartCard>

      {access.billing && <DashboardRecentActivity activities={data.recentActivities} />}
      <AppConfigSummary summary={data.appConfigSummary} />
    </div>
  )
}
