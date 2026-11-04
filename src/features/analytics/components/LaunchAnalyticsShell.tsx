import { RefreshCw } from "lucide-react"
import { NavLink } from "react-router"

import { Button } from "../../../components/atoms/Button"
import { Input } from "../../../components/atoms/Input"
import { Card } from "../../../components/molecules/Card"
import { PageHeader } from "../../../components/molecules/PageHeader"
import { cn } from "../../../lib/utils"
import { toDateInput } from "../analyticsDate"
import type {
  AnalyticsPlatform,
  AnalyticsSection,
  LaunchAnalyticsFilters,
  NotificationStatus,
} from "../types"
import { Select } from "../../../components/molecules/Select"

const tabs: Array<{ section: AnalyticsSection; label: string; description: string }> = [
  {
    section: "acquisition",
    label: "Edinim",
    description: "Yeni kullanıcıların nereden geldiğini ve mağaza performansını izleyin.",
  },
  {
    section: "activation",
    label: "Aktivasyon",
    description: "Yeni kullanıcıların ilk değere ne kadar sürede ulaştığını ve nerede bıraktığını görün.",
  },
  {
    section: "retention",
    label: "Elde tutma",
    description: "Kohortların ilk 30 günde uygulamaya ne sıklıkla geri döndüğünü izleyin.",
  },
  {
    section: "engagement",
    label: "Etkileşim",
    description: "Özelliklerin ne kadar kullanıldığını ve yapay zekâ akışlarının ne kadar başarılı olduğunu görün.",
  },
  {
    section: "reliability",
    label: "Kararlılık",
    description: "Çökmeleri, ölümcül hataları ve beklenmeyen oturum kapanmalarını izleyin.",
  },
]

interface LaunchAnalyticsShellProps {
  children: React.ReactNode
  filters: LaunchAnalyticsFilters
  generatedAt?: string
  isFetching: boolean
  onChange: (filters: LaunchAnalyticsFilters) => void
  onRefresh: () => void
}

export function LaunchAnalyticsShell({
  children,
  filters,
  generatedAt,
  isFetching,
  onChange,
  onRefresh,
}: LaunchAnalyticsShellProps) {
  function patchFilter(patch: Partial<LaunchAnalyticsFilters>) {
    onChange({ ...filters, ...patch })
  }

  const activeTab = tabs.find((tab) => tab.section === filters.section)
  // The quick range reflects the chosen dates instead of always reading 30.
  const spanDays = Math.round((Date.parse(filters.endDate) - Date.parse(filters.startDate)) / 86_400_000) + 1
  const quickRange = [7, 30, 90].includes(spanDays) ? String(spanDays) : ""


  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <span className="text-xs tabular-nums text-muted">
              {generatedAt
                ? `Son güncelleme ${new Date(generatedAt).toLocaleString("tr-TR")}`
                : "Veri bekleniyor"}
            </span>
            <Button
              disabled={isFetching}
              onClick={onRefresh}
              size="sm"
              variant="secondary"
            >
              <RefreshCw
                aria-hidden
                className={cn("size-3.5", isFetching && "animate-spin")}
              />
              {isFetching ? "Yenileniyor…" : "Yenile"}
            </Button>
          </>
        }
        context="Uygulama olayları"
        description={
          activeTab?.description ??
          "Lansmanın ilk 30 gününde edinim, aktivasyon, elde tutma ve kararlılığı izleyin."
        }
        title="Analitik"
      />

      <div className="-mx-1 overflow-x-auto border-b border-line px-1">
        <nav aria-label="Analitik bölümleri" className="flex min-w-max gap-1">
          {tabs.map((tab) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  "-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors duration-150 ease-[var(--ease-panel)]",
                  isActive
                    ? "border-accent text-ink"
                    : "border-transparent text-muted hover:border-line-strong hover:text-ink",
                )
              }
              key={tab.section}
              to={`/analytics/${tab.section}`}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Card className="p-4" tone="quiet">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <FilterSelect
            label="Hızlı aralık"
            onChange={(value) => {
              const days = Number(value)
              const end = new Date(`${filters.endDate}T12:00:00`)
              end.setDate(end.getDate() - (days - 1))
              patchFilter({ startDate: toDateInput(end) })
            }}
            options={[
              ...(quickRange ? [] : ([["", "Özel aralık"]] as [string, string][])),
              ["7", "Son 7 gün"],
              ["30", "Son 30 gün"],
              ["90", "Son 90 gün"],
            ]}
            value={quickRange}
          />
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-soft">
            <span>Başlangıç</span>
            <Input
              className="w-full"
              max={filters.endDate}
              onChange={(event) => patchFilter({ startDate: event.target.value })}
              type="date"
              value={filters.startDate}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-soft">
            <span>Bitiş</span>
            <Input
              className="w-full"
              min={filters.startDate}
              onChange={(event) => patchFilter({ endDate: event.target.value })}
              type="date"
              value={filters.endDate}
            />
          </label>
          <FilterSelect
            label="Platform"
            onChange={(value) =>
              patchFilter({ platform: (value || null) as AnalyticsPlatform | null })
            }
            options={[
              ["", "Tüm platformlar"],
              ["IOS", "iOS"],
              ["ANDROID", "Android"],
            ]}
            value={filters.platform ?? ""}
          />
          <FilterSelect
            label="Dil"
            onChange={(value) =>
              patchFilter({ language: (value || null) as "tr" | "en" | null })
            }
            options={[
              ["", "Tüm diller"],
              ["tr", "Türkçe"],
              ["en", "İngilizce"],
            ]}
            value={filters.language ?? ""}
          />
          <FilterSelect
            label="Bildirim izni"
            onChange={(value) =>
              patchFilter({
                notificationStatus: (value || null) as NotificationStatus | null,
              })
            }
            options={[
              ["", "Tüm durumlar"],
              ["granted", "İzin verdi"],
              ["denied", "Reddetti"],
              ["undetermined", "Karar vermedi"],
            ]}
            value={filters.notificationStatus ?? ""}
          />
        </div>
      </Card>

      {children}
    </div>
  )
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: string) => void
  options: Array<[string, string]>
  value: string
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-soft">
      <span>{label}</span>
      <Select
        className="w-full"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </Select>
    </label>
  )
}
