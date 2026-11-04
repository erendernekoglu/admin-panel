import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Activity,
  AlertTriangle,
  BellRing,
  Clock3,
  Download,
  Gauge,
  HeartPulse,
  Repeat2,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  WandSparkles,
} from "lucide-react"
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

import { Button } from "../../../components/atoms/Button"
import { Input } from "../../../components/atoms/Input"
import {
  CHART_COLORS,
  PIE_COLORS,
  chartAxisStyle,
  chartGridStyle,
  chartTooltipStyle,
} from "../../../lib/charts/chartTheme"
import { AnalyticsChartCard } from "./AnalyticsChartCard"
import { AnalyticsDataTable } from "./AnalyticsDataTable"
import { useAuth } from "../../auth/useAuth"
import { DailyActiveUsers } from "./DailyActiveUsers"
import { LaunchMetricCard, LaunchMetricStrip } from "./LaunchMetricCard"
import { RecentActivationJourneys } from "./RecentActivationJourneys"
import {
  fetchMarketSnapshots,
  fetchGooglePlayAnalytics,
  fetchAppStoreAnalytics,
  syncAppStoreAnalytics,
  syncGooglePlayAnalytics,
  upsertMarketSnapshot,
} from "../services/launchAnalyticsService"
import { toDateInput } from "../analyticsDate"
import type {
  AcquisitionData,
  ActivationData,
  AnalyticsPlatform,
  EngagementData,
  LaunchAnalyticsFilters,
  ReliabilityData,
  RetentionData,
} from "../types"
import { Select } from "../../../components/molecules/Select"

const number = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 })
const legendStyle = { fontSize: 12, color: "var(--ink-soft)", paddingTop: 8 } as const
const barCursor = { fill: "var(--surface-2)" } as const

/** Static class names so Tailwind can see them; index = number of metrics. */
const XL_COLUMNS = ["", "xl:grid-cols-1", "xl:grid-cols-2", "xl:grid-cols-3", "xl:grid-cols-4", "xl:grid-cols-5"]

function n(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatNumber(value: unknown) {
  return number.format(n(value))
}

function percent(value: unknown, digits = 1) {
  if (value === null || value === undefined || value === "") return "—"
  return `%${n(value).toLocaleString("tr-TR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`
}

function dateLabel(value: string) {
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })
}

function valueOf(row: Record<string, unknown>, key: string) {
  return row[key]
}

export function AcquisitionSection({
  data,
  filters,
}: {
  data: AcquisitionData
  filters: LaunchAnalyticsFilters
}) {
  const canReadUsers = useAuth().can("users.read")
  const latest = data.daily.at(-1)
  const newUsers = data.daily.reduce((sum, point) => sum + n(point.new_users), 0)
  const platformData = data.platforms.map((item, index) => ({
    name: item.platform === "IOS" ? "iOS" : "Android",
    value: n(item.users),
    color: PIE_COLORS[index % PIE_COLORS.length],
  }))
  const androidFirstOpens = n(data.platforms.find((item) => item.platform === "ANDROID")?.users)
  const iosFirstOpens = n(data.platforms.find((item) => item.platform === "IOS")?.users)

  return (
    <div className="space-y-6">
      <LaunchMetricStrip className="xl:grid-cols-4">
        <LaunchMetricCard helper="Seçili aralıkta ilk açılış" icon={Users} label="Yeni kullanıcı" value={formatNumber(newUsers)} />
        <LaunchMetricCard helper="Son gün" icon={Activity} label="Günlük aktif (DAU)" value={formatNumber(latest?.dau)} />
        <LaunchMetricCard helper="Son 7 gün" icon={Repeat2} label="Haftalık aktif (WAU)" value={formatNumber(latest?.wau)} />
        <LaunchMetricCard helper="Son 30 gün" icon={Gauge} label="Aylık aktif (MAU)" value={formatNumber(latest?.mau)} />
      </LaunchMetricStrip>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <AnalyticsChartCard
            description="Takvim gününe göre ilk açılışlar ve oturum başlatan tekil kullanıcılar."
            empty={data.daily.length === 0}
            title="Yeni ve günlük aktif kullanıcılar"
          >
            <ResponsiveContainer height={310} width="100%">
              <AreaChart data={data.daily.map((point) => ({ ...point, date: dateLabel(point.d) }))}>
                <CartesianGrid {...chartGridStyle} />
                <XAxis dataKey="date" {...chartAxisStyle} />
                <YAxis allowDecimals={false} width={40} {...chartAxisStyle} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={legendStyle} />
                <Area dataKey="dau" fill={CHART_COLORS.primary} fillOpacity={0.13} name="Günlük aktif" stroke={CHART_COLORS.primary} strokeWidth={2} type="monotone" />
                <Area dataKey="new_users" fill={CHART_COLORS.black} fillOpacity={0.06} name="İlk açılış" stroke={CHART_COLORS.black} strokeWidth={2} type="monotone" />
              </AreaChart>
            </ResponsiveContainer>
          </AnalyticsChartCard>
        </div>
        <AnalyticsChartCard
          description="Seçili aralıktaki ilk açılışların platforma göre dağılımı."
          empty={platformData.length === 0}
          title="Platform dağılımı"
        >
          <ResponsiveContainer height={310} width="100%">
            <PieChart>
              <Pie data={platformData} dataKey="value" innerRadius={68} outerRadius={100} paddingAngle={3} stroke="var(--surface)">
                {platformData.map((item) => <Cell fill={item.color} key={item.name} />)}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={legendStyle} />
            </PieChart>
          </ResponsiveContainer>
        </AnalyticsChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <AnalyticsChartCard description="Klasik D1 elde tutma, her ilk açılış kohortundan hesaplanır." title="Edinim kaynakları">
            <AnalyticsDataTable
              columns={[
                { key: "source", label: "Kaynak", render: (row) => row.source || "(doğrudan)" },
                { key: "medium", label: "Ortam", render: (row) => row.medium || "(yok)" },
                { key: "users", label: "Yeni kullanıcı", align: "right", render: (row) => formatNumber(row.new_users) },
                { key: "d1", label: "D1 elde tutma", align: "right", render: (row) => percent(row.d1_retention_pct) },
              ]}
              rows={data.sources}
            />
          </AnalyticsChartCard>
        </div>
        <MarketSnapshotCard filters={filters} firstOpens={newUsers} />
      </div>
      {canReadUsers && <DailyActiveUsers daily={data.daily} filters={filters} />}
      <div className="grid gap-6 xl:grid-cols-2">
        <AppStoreCard filters={filters} firstOpens={iosFirstOpens} />
        <GooglePlayStoreCard filters={filters} firstOpens={androidFirstOpens} />
      </div>
    </div>
  )
}

function SyncButton({
  label,
  onClick,
  pending,
}: {
  label: string
  onClick: () => void
  pending: boolean
}) {
  return (
    <Button disabled={pending} onClick={onClick} size="sm" variant="secondary">
      <Download aria-hidden className="size-3.5" />
      {pending ? "Eşitleniyor…" : label}
    </Button>
  )
}

function AppStoreCard({
  filters,
  firstOpens,
}: {
  filters: LaunchAnalyticsFilters
  firstOpens: number
}) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ["app-store-analytics", filters.startDate, filters.endDate],
    queryFn: () => fetchAppStoreAnalytics(filters.startDate, filters.endDate),
    retry: false,
  })
  const sync = useMutation({
    mutationFn: syncAppStoreAnalytics,
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: ["app-store-analytics"],
    }),
  })
  const data = query.data
  const totals = data?.totals
  const hasReportData = Boolean(data?.daily.length)
  const firstOpenRate = hasReportData && totals?.firstTimeDownloads
    ? (firstOpens / totals.firstTimeDownloads) * 100
    : null
  const waiting = Boolean(
    data && !hasReportData && !query.isPending && !query.error,
  )
  const storeNumber = (value: unknown) => hasReportData ? formatNumber(value) : "—"

  return (
    <AnalyticsChartCard
      actions={
        <SyncButton
          label="Apple raporlarını eşitle"
          onClick={() => sync.mutate()}
          pending={sync.isPending}
        />
      }
      description={`App Store Connect günlük raporları, ${data?.integration?.dataThrough ?? "—"} tarihine kadar. İlk dosyalar 24–48 saatte gelir; günlük veri 3 güne kadar gecikebilir.`}
      title="App Store performansı"
    >
      <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <StoreValue label="Gösterim" value={storeNumber(totals?.impressions)} />
        <StoreValue label="Sayfa görüntüleme" value={storeNumber(totals?.productPageViews)} />
        <StoreValue label="İndirme" value={storeNumber(totals?.downloads)} />
        <StoreValue label="İlk kez indirme" value={storeNumber(totals?.firstTimeDownloads)} />
        <StoreValue label="Dönüşüm" value={hasReportData ? percent(n(totals?.conversionRate) * 100) : "—"} />
        <StoreValue label="İndirmeden ilk açılışa" value={percent(firstOpenRate)} />
      </dl>
      {waiting ? (
        <p className="mb-3 rounded-xl bg-warning-soft px-3.5 py-2.5 text-xs leading-5 text-warning">
          Apple henüz rapor dosyası üretmedi; bu değerler sıfır değil, yalnızca henüz yok. İlk dosyalar
          24–48 saat içinde gelir. App Store Connect panelindeki geçmiş değerler bu akışta yer almaz.
        </p>
      ) : null}
      {query.error || sync.error ? (
        <p className="mb-3 animate-pop-in rounded-xl bg-danger-soft px-3.5 py-2.5 text-xs text-danger" role="alert">
          {(query.error ?? sync.error)?.message}
        </p>
      ) : null}
      <AnalyticsDataTable
        columns={[
          { key: "source", label: "Kaynak", render: (row) => row.name },
          { key: "impressions", label: "Gösterim", align: "right", render: (row) => formatNumber(row.impressions) },
          { key: "views", label: "Sayfa görüntüleme", align: "right", render: (row) => formatNumber(row.productPageViews) },
          { key: "downloads", label: "İndirme", align: "right", render: (row) => formatNumber(row.downloads) },
        ]}
        emptyText={query.isPending ? "App Store raporları yükleniyor…" : "Mağaza verilerini görmek için Apple raporlarını eşitleyin."}
        rows={data?.sources ?? []}
      />
    </AnalyticsChartCard>
  )
}

function GooglePlayStoreCard({
  filters,
  firstOpens,
}: {
  filters: LaunchAnalyticsFilters
  firstOpens: number
}) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ["google-play-analytics", filters.startDate, filters.endDate],
    queryFn: () => fetchGooglePlayAnalytics(filters.startDate, filters.endDate),
    retry: false,
  })
  const sync = useMutation({
    mutationFn: syncGooglePlayAnalytics,
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: ["google-play-analytics"],
    }),
  })
  const data = query.data
  const totals = data?.totals
  const firstOpenRate = totals?.installs
    ? (firstOpens / totals.installs) * 100
    : null

  return (
    <AnalyticsChartCard
      actions={
        <SyncButton
          label="Play raporlarını eşitle"
          onClick={() => sync.mutate()}
          pending={sync.isPending}
        />
      }
      description={`Google Play toplu raporları, ${data?.integration?.dataThrough ?? "—"} tarihine kadar. Raporlar 3–7 gün gecikmeli gelebilir.`}
      title="Google Play performansı"
    >
      <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <StoreValue label="Ziyaretçi" value={formatNumber(totals?.visitors)} />
        <StoreValue label="Edinim" value={formatNumber(totals?.acquisitions)} />
        <StoreValue label="Dönüşüm" value={percent(n(totals?.conversionRate) * 100)} />
        <StoreValue label="Kullanıcı yüklemesi" value={formatNumber(totals?.installs)} />
        <StoreValue label="Yüklemeden ilk açılışa" value={percent(firstOpenRate)} />
      </dl>
      {query.error || sync.error ? (
        <p className="mb-3 animate-pop-in rounded-xl bg-danger-soft px-3.5 py-2.5 text-xs text-danger" role="alert">
          {(query.error ?? sync.error)?.message}
        </p>
      ) : null}
      <AnalyticsDataTable
        columns={[
          { key: "source", label: "Trafik kaynağı", render: (row) => row.name },
          { key: "visitors", label: "Ziyaretçi", align: "right", render: (row) => formatNumber(row.visitors) },
          { key: "acquisitions", label: "Edinim", align: "right", render: (row) => formatNumber(row.acquisitions) },
          { key: "conversion", label: "Dönüşüm", align: "right", render: (row) => percent(row.visitors > 0 ? row.acquisitions * 100 / row.visitors : 0) },
        ]}
        emptyText={query.isPending ? "Google Play raporları yükleniyor…" : "Mağaza verilerini görmek için Play raporlarını eşitleyin."}
        rows={data?.sources ?? []}
      />
    </AnalyticsChartCard>
  )
}

function StoreValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col border-l-2 border-line pl-3">
      <dt className="truncate text-xs font-medium text-muted">{label}</dt>
      <dd className="order-first text-xl font-bold tabular-nums text-ink">{value}</dd>
    </div>
  )
}

function MarketSnapshotCard({ filters, firstOpens }: { filters: LaunchAnalyticsFilters; firstOpens: number }) {
  const queryClient = useQueryClient()
  const canEdit = useAuth().can("system.manage")
  const [platform, setPlatform] = useState<AnalyticsPlatform>("IOS")
  const [weekStart, setWeekStart] = useState(filters.startDate)
  const [impressions, setImpressions] = useState("0")
  const [installs, setInstalls] = useState("0")
  const query = useQuery({
    queryKey: ["market-snapshots", filters.startDate, filters.endDate],
    queryFn: () => fetchMarketSnapshots(filters.startDate, filters.endDate),
    retry: false,
  })
  const mutation = useMutation({
    mutationFn: upsertMarketSnapshot,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["market-snapshots"] }),
  })
  const totalInstalls = (query.data ?? []).reduce((sum, item) => sum + item.installs, 0)
  const openRate = totalInstalls > 0 ? (firstOpens / totalInstalls) * 100 : null

  function submit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate({
      weekStart,
      platform,
      impressions: Math.max(0, Number(impressions)),
      installs: Math.max(0, Number(installs)),
    })
  }

  return (
    <AnalyticsChartCard
      description="App Store Connect ve Play Console'dan haftalık olarak elle girilen değerler."
      title="Mağaza özeti"
      tone="quiet"
    >
      <div>
        <p className="text-4xl leading-none font-extrabold tracking-tight tabular-nums text-ink">{percent(openRate)}</p>
        <p className="mt-2 text-sm font-semibold text-ink-soft">Yüklemeden ilk açılışa</p>
        <p className="mt-0.5 text-xs tabular-nums text-muted">{formatNumber(totalInstalls)} elle girilmiş yükleme</p>
      </div>
      {canEdit && (
        <form className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4" onSubmit={submit}>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-soft">
            <span>Hafta başı</span>
            <Input className="w-full" onChange={(event) => setWeekStart(event.target.value)} type="date" value={weekStart} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-soft">
            <span>Platform</span>
            <Select className="w-full" onChange={(event) => setPlatform(event.target.value as AnalyticsPlatform)} value={platform}>
              <option value="IOS">iOS</option>
              <option value="ANDROID">Android</option>
            </Select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-soft">
            <span>Gösterim</span>
            <Input className="w-full tabular-nums" inputMode="numeric" min="0" onChange={(event) => setImpressions(event.target.value)} type="number" value={impressions} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-soft">
            <span>Yükleme</span>
            <Input className="w-full tabular-nums" inputMode="numeric" min="0" onChange={(event) => setInstalls(event.target.value)} type="number" value={installs} />
          </label>
          <Button className="col-span-2" disabled={mutation.isPending} type="submit">
            <Save aria-hidden className="size-4" />
            {mutation.isPending ? "Kaydediliyor…" : "Haftalık değerleri kaydet"}
          </Button>
        </form>
      )}
      {mutation.error ? (
        <p className="mt-3 animate-pop-in rounded-xl bg-danger-soft px-3.5 py-2.5 text-xs text-danger" role="alert">
          {mutation.error.message}
        </p>
      ) : null}
    </AnalyticsChartCard>
  )
}

export function ActivationSection({
  data,
  filters,
}: {
  data: ActivationData
  filters: LaunchAnalyticsFilters
}) {
  const canReadUsers = useAuth().can("users.read")
  const funnel = Array.isArray(data.funnel) ? data.funnel : []
  const onboarding = Array.isArray(data.onboarding) ? data.onboarding : []
  const segments = Array.isArray(data.segments) ? data.segments : []
  const summary = data.summary
  const weakest = [...onboarding].sort((a, b) => n(b.dropoff_pct) - n(a.dropoff_pct))[0]
  return (
    <div className="space-y-6">
      <LaunchMetricStrip className="xl:grid-cols-5">
        <LaunchMetricCard helper="Hedef: 10 dakikanın altı" icon={Clock3} label="İlk değere süre (p50)" tone={n(summary?.p50_minutes) <= 10 ? "good" : "warning"} value={summary?.p50_minutes == null ? "—" : `${formatNumber(summary.p50_minutes)} dk`} />
        <LaunchMetricCard icon={Clock3} label="İlk değere süre (p90)" value={summary?.p90_minutes == null ? "—" : `${formatNumber(summary.p90_minutes)} dk`} />
        <LaunchMetricCard icon={Target} label="10 dakika içinde" value={percent(summary?.within_10_min_pct)} />
        <LaunchMetricCard icon={BellRing} label="Bildirim izni" tone={n(summary?.notification_allow_pct) < 50 ? "critical" : "good"} value={percent(summary?.notification_allow_pct)} />
        <LaunchMetricCard icon={AlertTriangle} label="En büyük tanıtım kaybı" tone={n(weakest?.dropoff_pct) > 15 ? "critical" : "neutral"} value={weakest ? percent(weakest.dropoff_pct) : "—"} helper={weakest?.name} />
      </LaunchMetricStrip>
      <div className="grid gap-6 xl:grid-cols-2">
        <AnalyticsChartCard description="İlk açılıştan sonraki 24 saatte her adımı sırayla tamamlayan tekil kullanıcılar." empty={funnel.length === 0} title="Aktivasyon hunisi">
          <ResponsiveContainer height={360} width="100%"><BarChart data={funnel} layout="vertical"><CartesianGrid {...chartGridStyle} /><XAxis type="number" {...chartAxisStyle} /><YAxis dataKey="step_name" type="category" width={150} {...chartAxisStyle} /><Tooltip contentStyle={chartTooltipStyle} cursor={barCursor} /><Bar dataKey="users" fill={CHART_COLORS.primary} name="Kullanıcı" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
        </AnalyticsChartCard>
        <AnalyticsChartCard description="Yüzde 15'in üzerindeki kayıplar acil düzeltme adayı olarak kırmızıyla gösterilir." empty={onboarding.length === 0} title="Tanıtım adımlarında kalanlar">
          <ResponsiveContainer height={360} width="100%"><BarChart data={onboarding}><CartesianGrid {...chartGridStyle} /><XAxis dataKey="step" {...chartAxisStyle} /><YAxis domain={[0, 100]} width={40} {...chartAxisStyle} /><Tooltip contentStyle={chartTooltipStyle} cursor={barCursor} /><Bar dataKey="remaining_pct" name="Kalan %" radius={[4, 4, 0, 0]}>{onboarding.map((item) => <Cell fill={n(item.dropoff_pct) > 15 ? CHART_COLORS.rose : CHART_COLORS.primary} key={`${item.step}-${item.name}`} />)}</Bar></BarChart></ResponsiveContainer>
        </AnalyticsChartCard>
      </div>
      <AnalyticsChartCard description="İlk deneyime göre aktive olan kullanıcıların oranı." title="İlk deneyime göre aktivasyon">
        <AnalyticsDataTable columns={[
          { key: "type", label: "Segment", render: (row) => row.segment_type },
          { key: "value", label: "Değer", render: (row) => row.segment_value || "Bilinmiyor" },
          { key: "users", label: "Kullanıcı", align: "right", render: (row) => formatNumber(row.users) },
          { key: "activated", label: "Aktive olan", align: "right", render: (row) => formatNumber(row.activated_users) },
          { key: "rate", label: "Aktivasyon", align: "right", render: (row) => percent(row.activation_pct) },
        ]} rows={segments} />
      </AnalyticsChartCard>
      {canReadUsers && (
        <RecentActivationJourneys
          filters={{
            startDate: filters.startDate,
            endDate: filters.endDate,
            platform: filters.platform,
            language: filters.language,
            notificationStatus: filters.notificationStatus,
            limit: 50,
          }}
        />
      )}
    </div>
  )
}

export function RetentionSection({
  data,
  filters,
}: {
  data: RetentionData
  filters: LaunchAnalyticsFilters
}) {
  const retentionAt = (day: number) => [...data.cohorts].filter((item) => item.day_n === day && item.is_mature).sort((a, b) => b.cohort_date.localeCompare(a.cohort_date))[0]?.retention_pct
  const habit = [...data.habit].filter((item) => item.is_mature).at(-1)?.habit_rate_pct
  const stickiness = data.stickiness.at(-1)?.stickiness_pct
  const curves = Array.from(new Set(data.curve.map((item) => item.day_n))).map((day) => {
    const row: Record<string, string | number> = { day: `D${day}` }
    data.curve.filter((item) => item.day_n === day).forEach((item) => { row[item.segment] = item.retention_pct })
    return row
  })
  return (
    <div className="space-y-6">
      <LaunchMetricStrip className="xl:grid-cols-5">
        <LaunchMetricCard icon={Repeat2} label="D1 elde tutma" tone={toneForRetention(retentionAt(1), 20, 35)} value={percent(retentionAt(1))} />
        <LaunchMetricCard icon={Repeat2} label="D7 elde tutma" tone={toneForRetention(retentionAt(7), 8, 18)} value={percent(retentionAt(7))} />
        <LaunchMetricCard icon={Repeat2} label="D30 elde tutma" tone={toneForRetention(retentionAt(30), 3, 8)} value={percent(retentionAt(30))} />
        <LaunchMetricCard helper="D0–D6 arasında 3 giyim günü" icon={Sparkles} label="İlk hafta alışkanlık oranı" tone={toneForRetention(habit, 5, 15)} value={percent(habit)} />
        <LaunchMetricCard helper="Bağlılık oranı" icon={Gauge} label="DAU / MAU" tone={toneForRetention(stickiness, 10, 20)} value={percent(stickiness)} />
      </LaunchMetricStrip>
      <CohortHeatmap filters={filters} rows={data.cohorts} />
      <div className="grid gap-6 xl:grid-cols-2">
        <AnalyticsChartCard description="Aktivasyon: ilk 24 saatte gardırobun hazır olması ve bir kombin oluşturulması." empty={curves.length === 0} title="Aktive olanlar ve olmayanlar">
          <ResponsiveContainer height={310} width="100%"><LineChart data={curves}><CartesianGrid {...chartGridStyle} /><XAxis dataKey="day" {...chartAxisStyle} /><YAxis domain={[0, 100]} width={40} {...chartAxisStyle} /><Tooltip contentStyle={chartTooltipStyle} /><Legend wrapperStyle={legendStyle} /><Line dataKey="activated" dot={false} name="Aktive olanlar" stroke={CHART_COLORS.primary} strokeWidth={2} /><Line dataKey="not_activated" dot={false} name="Aktive olmayanlar" stroke={CHART_COLORS.gray} strokeWidth={2} /></LineChart></ResponsiveContainer>
        </AnalyticsChartCard>
        <AnalyticsChartCard description="Olay anındaki kullanıcı özelliklerine göre hesaplanır; sonradan değişen değerleri yansıtmaz." title="Segmente göre D7 elde tutma">
          <AnalyticsDataTable columns={[
            { key: "property", label: "Özellik", render: (row) => row.property_name },
            { key: "value", label: "Değer", render: (row) => row.property_value || "Bilinmiyor" },
            { key: "cohort", label: "Kohort", align: "right", render: (row) => formatNumber(row.cohort_size) },
            { key: "d7", label: "D7", align: "right", render: (row) => percent(row.d7_retention_pct) },
          ]} rows={data.properties} />
        </AnalyticsChartCard>
      </div>
    </div>
  )
}

function toneForRetention(value: unknown, critical: number, good: number): "neutral" | "critical" | "warning" | "good" {
  if (value === null || value === undefined) return "neutral"
  if (n(value) < critical) return "critical"
  if (n(value) >= good) return "good"
  return "warning"
}

function cohortDates(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T12:00:00`)
  const end = new Date(`${endDate}T12:00:00`)
  const visibleStart = new Date(end)
  visibleStart.setDate(visibleStart.getDate() - 13)
  const cursor = start > visibleStart ? new Date(start) : visibleStart
  const dates: string[] = []
  while (cursor <= end) {
    dates.push(toDateInput(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates.reverse()
}

const HEATMAP_COLUMNS = "140px repeat(31, minmax(28px, 1fr))"

/** Cell fill blends the accent into the card surface, so it follows the theme. */
function heatmapCellStyle(value: number | null) {
  if (value == null) {
    return { backgroundColor: "var(--surface-2)", color: "var(--muted)" }
  }
  const strength = Math.round(Math.max(8, Math.min(100, n(value))))
  return {
    backgroundColor: `color-mix(in oklab, var(--accent) ${strength}%, var(--surface))`,
    color: n(value) > 45 ? "var(--on-accent)" : "var(--ink)",
  }
}

function CohortHeatmap({
  rows,
  filters,
}: {
  rows: RetentionData["cohorts"]
  filters: LaunchAnalyticsFilters
}) {
  const dates = cohortDates(filters.startDate, filters.endDate)
  const byKey = new Map(rows.map((row) => [`${row.cohort_date}:${row.day_n}`, row]))
  return (
    <AnalyticsChartCard
      actions={
        <div aria-hidden className="flex shrink-0 items-center gap-2 text-xs text-muted">
          <span>%0</span>
          <span
            className="h-2 w-20 rounded-full"
            style={{ background: "linear-gradient(to right, color-mix(in oklab, var(--accent) 8%, var(--surface)), var(--accent))" }}
          />
          <span>%100</span>
        </div>
      }
      description="Takvim gününe göre klasik elde tutma. Kullanıcısı olmayan günler de listelenir; henüz olgunlaşmamış hücreler boş kalır."
      title="D0–D30 kohort elde tutma"
    >
      {dates.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-line-strong px-6 text-center text-sm text-muted">
          Henüz olgunlaşmış kohort yok. İlk kullanıcılar geldikten sonraki günlerde burası dolacak.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[1150px]">
            <div className="grid gap-1" style={{ gridTemplateColumns: HEATMAP_COLUMNS }}>
              <span />
              {Array.from({ length: 31 }, (_, day) => (
                <span className="text-center text-[11px] font-semibold text-muted" key={day}>D{day}</span>
              ))}
            </div>
            <div className="mt-1 space-y-1">
              {dates.map((date) => {
                const cohortSize = byKey.get(`${date}:0`)?.cohort_size ?? 0
                return (
                  <div className="grid gap-1" key={date} style={{ gridTemplateColumns: HEATMAP_COLUMNS }}>
                    <span className="self-center text-xs tabular-nums text-ink-soft">
                      {date}
                      <span className="ml-1 text-[11px] text-muted">· {formatNumber(cohortSize)} kişi</span>
                    </span>
                    {Array.from({ length: 31 }, (_, day) => {
                      const cell = byKey.get(`${date}:${day}`)
                      const value = cell?.is_mature ? cell.retention_pct : null
                      const title = cohortSize === 0
                        ? "İlk açılış yok"
                        : value == null
                          ? `D${day}: henüz tamamlanmadı`
                          : `D${day}: ${percent(value)}`
                      return (
                        <div
                          className="flex h-8 items-center justify-center rounded text-[11px] font-semibold tabular-nums"
                          key={day}
                          style={heatmapCellStyle(value ?? null)}
                          title={title}
                        >
                          {value == null ? "—" : Math.round(n(value))}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </AnalyticsChartCard>
  )
}

export function EngagementSection({ data }: { data: EngagementData }) {
  const aiRows = data.ai as Array<Record<string, unknown>>
  const features = data.features as Array<Record<string, unknown>>
  const headlineAi = aiRows.slice(0, 3)
  return (
    <div className="space-y-6">
      <LaunchMetricStrip className={XL_COLUMNS[headlineAi.length + 1]}>
        {headlineAi.map((row) => <LaunchMetricCard helper={`p90 ${formatNumber(valueOf(row, "p90_duration_ms"))} ms`} icon={WandSparkles} key={String(valueOf(row, "feature"))} label={`${String(valueOf(row, "feature"))} başarı oranı`} tone={n(valueOf(row, "success_pct")) >= 95 ? "good" : "warning"} value={percent(valueOf(row, "success_pct"))} />)}
        <LaunchMetricCard helper="Bir kombini giydiğini onaylayan tekil kullanıcılar" icon={HeartPulse} label="Giyim onaylayanlar" value={formatNumber(data.dailyWear.reduce((sum, row) => sum + n(row.users), 0))} />
      </LaunchMetricStrip>
      <div className="grid gap-6 xl:grid-cols-2">
        <AnalyticsChartCard description="Bu bir ilişki, neden-sonuç değil. Büyük farkları bir deneyle doğrulayın." title="Özellik kullanımı ve D7 elde tutma">
          <AnalyticsDataTable columns={[
            { key: "feature", label: "Özellik", render: (row) => String(valueOf(row, "feature")) },
            { key: "adoption", label: "Kullanım", align: "right", render: (row) => percent(valueOf(row, "adoption_pct")) },
            { key: "d7", label: "Kullananlarda D7", align: "right", render: (row) => percent(valueOf(row, "adopter_d7_pct")) },
            { key: "lift", label: "Artış", align: "right", render: (row) => `${n(valueOf(row, "retention_lift")).toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}×` },
          ]} rows={features} />
        </AnalyticsChartCard>
        <AnalyticsChartCard description="Her gün bir kombini giydiğini onaylayan tekil kullanıcılar." empty={data.dailyWear.length === 0} title="Günlük giyim onayları">
          <ResponsiveContainer height={300} width="100%"><AreaChart data={data.dailyWear.map((row) => ({ ...row, date: dateLabel(row.d) }))}><CartesianGrid {...chartGridStyle} /><XAxis dataKey="date" {...chartAxisStyle} /><YAxis allowDecimals={false} width={40} {...chartAxisStyle} /><Tooltip contentStyle={chartTooltipStyle} /><Area dataKey="users" fill={CHART_COLORS.primary} fillOpacity={0.14} name="Kullanıcı" stroke={CHART_COLORS.primary} strokeWidth={2} type="monotone" /></AreaChart></ResponsiveContainer>
        </AnalyticsChartCard>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <AnalyticsChartCard description="Akış başına başarı oranı ve süre dağılımı." title="Yapay zekâ performansı"><AnalyticsDataTable columns={[
          { key: "feature", label: "Akış", render: (row) => String(valueOf(row, "feature")) },
          { key: "started", label: "Başlayan", align: "right", render: (row) => formatNumber(valueOf(row, "started")) },
          { key: "success", label: "Başarı", align: "right", render: (row) => percent(valueOf(row, "success_pct")) },
          { key: "p50", label: "p50", align: "right", render: (row) => `${formatNumber(valueOf(row, "p50_duration_ms"))} ms` },
          { key: "p90", label: "p90", align: "right", render: (row) => `${formatNumber(valueOf(row, "p90_duration_ms"))} ms` },
        ]} rows={aiRows} /></AnalyticsChartCard>
        <AnalyticsChartCard description="En çok kullanıcıyı etkileyen başarısız olaylar." title="En sık olay hataları"><AnalyticsDataTable columns={[
          { key: "event", label: "Olay", render: (row) => String(valueOf(row, "event_name")) },
          { key: "code", label: "Hata kodu", render: (row) => String(valueOf(row, "error_code") || "unknown") },
          { key: "users", label: "Kullanıcı", align: "right", render: (row) => formatNumber(valueOf(row, "affected_users")) },
          { key: "count", label: "Olay", align: "right", render: (row) => formatNumber(valueOf(row, "occurrences")) },
        ]} rows={data.errors as Array<Record<string, unknown>>} /></AnalyticsChartCard>
      </div>
    </div>
  )
}

export function ReliabilitySection({ data }: { data: ReliabilityData }) {
  const daily = data.daily as Array<Record<string, unknown>>
  const latest = daily.at(-1)
  const authCount = data.auth.reduce((sum, row) => sum + n(row.occurrences), 0)
  const trend = daily.map((row) => ({ ...row, date: dateLabel(String(valueOf(row, "d"))) }))
  return (
    <div className="space-y-6">
      <LaunchMetricStrip className="xl:grid-cols-4">
        <LaunchMetricCard helper="Hedef: %99,0'ın üzeri" icon={ShieldCheck} label="Çökmesiz kullanıcı" tone={n(valueOf(latest ?? {}, "crash_free_users_pct")) < 98.5 ? "critical" : "good"} value={percent(valueOf(latest ?? {}, "crash_free_users_pct"), 2)} />
        <LaunchMetricCard icon={ShieldCheck} label="Çökmesiz oturum" value={percent(valueOf(latest ?? {}, "crash_free_sessions_pct"), 2)} />
        <LaunchMetricCard icon={AlertTriangle} label="Ölümcül hata" tone={n(valueOf(latest ?? {}, "fatal_events")) > 0 ? "critical" : "good"} value={formatNumber(valueOf(latest ?? {}, "fatal_events"))} />
        <LaunchMetricCard helper="Yeni kullanıcıların %1'ini aşarsa inceleyin" icon={AlertTriangle} label="Beklenmeyen oturum kapanması" tone={authCount > 0 ? "warning" : "good"} value={formatNumber(authCount)} />
      </LaunchMetricStrip>
      <AnalyticsChartCard description="Seçili platformda günlük ölümcül ve ölümcül olmayan uygulama hataları." empty={trend.length === 0} title="Sürüm kararlılığı">
        <ResponsiveContainer height={320} width="100%"><BarChart data={trend}><CartesianGrid {...chartGridStyle} /><XAxis dataKey="date" {...chartAxisStyle} /><YAxis allowDecimals={false} width={40} {...chartAxisStyle} /><Tooltip contentStyle={chartTooltipStyle} cursor={barCursor} /><Legend wrapperStyle={legendStyle} /><Bar dataKey="fatal_events" fill={CHART_COLORS.rose} name="Ölümcül" radius={[4, 4, 0, 0]} /><Bar dataKey="non_fatal_events" fill={CHART_COLORS.amber} name="Ölümcül olmayan" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
      </AnalyticsChartCard>
      <div className="grid gap-6 xl:grid-cols-2">
        <AnalyticsChartCard description="Önce en çok kullanıcıyı etkileyen sorunları çözün." title="En çok kullanıcıyı etkileyen sorunlar"><AnalyticsDataTable columns={[
          { key: "issue", label: "Sorun", render: (row) => String(valueOf(row, "issue_title")) },
          { key: "platform", label: "Platform", render: (row) => String(valueOf(row, "platform")) },
          { key: "users", label: "Kullanıcı", align: "right", render: (row) => formatNumber(valueOf(row, "affected_users")) },
          { key: "events", label: "Olay", align: "right", render: (row) => formatNumber(valueOf(row, "occurrences")) },
        ]} emptyText="Bu aralıkta kayıtlı sorun yok." rows={data.issues as Array<Record<string, unknown>>} /></AnalyticsChartCard>
        <AnalyticsChartCard description="Kullanıcı istemeden oturumun kapandığı durumlar." title="Beklenmeyen oturum kapanma nedenleri"><AnalyticsDataTable columns={[
          { key: "date", label: "Tarih", render: (row) => String(valueOf(row, "d")) },
          { key: "reason", label: "Neden", render: (row) => String(valueOf(row, "reason") || "unknown") },
          { key: "users", label: "Kullanıcı", align: "right", render: (row) => formatNumber(valueOf(row, "affected_users")) },
          { key: "events", label: "Olay", align: "right", render: (row) => formatNumber(valueOf(row, "occurrences")) },
        ]} emptyText="Bu aralıkta beklenmeyen oturum kapanması yok." rows={data.auth as Array<Record<string, unknown>>} /></AnalyticsChartCard>
      </div>
    </div>
  )
}
