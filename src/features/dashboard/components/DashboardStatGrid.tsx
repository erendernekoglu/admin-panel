import {
  Banknote,
  Coins,
  FileText,
  Shirt,
  Target,
} from "lucide-react"

import { Card, CardHeader } from "../../../components/molecules/Card"
import { cn } from "../../../lib/utils"
import type { DashboardStats } from "../types"
import { DashboardStatCard } from "./DashboardStatCard"

interface DashboardMetricsProps {
  stats: DashboardStats
}

/**
 * The four numbers the dashboard exists for, set large in one band instead of
 * a grid of identical cards.
 */
export function DashboardHeadlineMetrics({ stats }: DashboardMetricsProps) {
  const { metrics } = stats
  const headline = [
    {
      label: "Toplam kullanıcı",
      value: metrics.totalUsers,
      helper: "Kayıtlı tüm hesaplar",
    },
    {
      label: "Yeni kullanıcı",
      value: metrics.newUsers,
      helper: "Seçili aralıkta açılan hesaplar",
    },
    {
      label: "Aktif kullanıcı",
      value: metrics.activeUsers,
      helper: "Etkinlik sinyali gelen tekil kullanıcılar",
    },
    // Revenue numbers are left out for roles that may not read them.
    ...(metrics.activeSubscriptions === null
      ? []
      : [
          {
            label: "Aktif abonelik",
            value: metrics.activeSubscriptions,
            helper: "Şu an geçerli abonelik kayıtları",
          },
        ]),
  ]

  return (
    <Card className="overflow-hidden">
      <dl
        className={cn(
          "grid grid-cols-1 gap-px bg-line min-[420px]:grid-cols-2",
          headline.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
        )}
      >
        {headline.map((item) => (
          <div className="flex flex-col bg-surface p-5 sm:p-6" key={item.label}>
            <dt className="text-sm font-semibold text-ink-soft">{item.label}</dt>
            <dd className="order-first mb-3 text-[clamp(2.25rem,4.2vw,3.25rem)] leading-none font-extrabold tracking-tight tabular-nums text-ink">
              {formatNumber(item.value)}
            </dd>
            <dd className="mt-1 text-xs text-muted">{item.helper}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

export function DashboardSecondaryMetrics({ stats }: DashboardMetricsProps) {
  const { metrics } = stats

  return (
    <Card className="h-full p-5" tone="quiet">
      <CardHeader
        className="mb-2"
        description="Seçili aralıktaki kredi ve içerik hareketleri."
        title="Diğer göstergeler"
      />
      <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-1 [&>*]:border-t [&>*]:border-line">
        <DashboardStatCard
          helper="Seçili aralıkta harcanan"
          icon={Coins}
          label="Kredi harcaması"
          value={formatNumber(metrics.creditSpend)}
        />
        <DashboardStatCard
          helper="Seçili aralıkta yüklenen"
          icon={Banknote}
          label="Kredi yüklemesi"
          value={formatNumber(metrics.creditLoad)}
        />
        <DashboardStatCard
          helper="Yayında ve taslakta olanlar"
          icon={FileText}
          label="Blog ve medya içerikleri"
          value={formatNumber(metrics.totalBlogPosts)}
        />
        <DashboardStatCard
          helper="Tüm kullanıcıların gardıropları"
          icon={Shirt}
          label="Gardırop parçaları"
          value={formatNumber(metrics.totalWardrobeItems)}
        />
        <DashboardStatCard
          helper="Kampanya verisi bağlandığında hesaplanır"
          icon={Target}
          label="Tahmini edinme maliyeti"
          trend="Bağlı değil"
          value="—"
        />
      </div>
    </Card>
  )
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 0,
  }).format(value)
}
