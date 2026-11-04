import { Link } from "react-router"
import { Cloud, FileCheck2, Settings2, ShieldCheck } from "lucide-react"

import { Badge, type BadgeTone } from "../../../components/atoms/Badge/Badge"
import { Card, CardHeader } from "../../../components/molecules/Card"
import type { DashboardAppConfigSummary } from "../types"

interface AppConfigSummaryProps {
  summary: DashboardAppConfigSummary
}

export function AppConfigSummary({ summary }: AppConfigSummaryProps) {
  const services = summary.apiLimits
    ? Object.entries(summary.apiLimits).map(([key, service]) => ({
        key,
        enabled: service.enabled,
      }))
    : []
  const enabledServices = services.filter((service) => service.enabled).length
  const totalServices = services.length
  const weatherSlots = summary.weatherTimeSlots
    ? Object.keys(summary.weatherTimeSlots).length
    : 0
  const hasAnyConfig =
    Boolean(summary.apiLimits) ||
    Boolean(summary.appVersion) ||
    Boolean(summary.dwKvkkVersion) ||
    Boolean(summary.weatherTimeSlots)

  const servicesHealthy = Boolean(totalServices) && enabledServices === totalServices

  return (
    <Card className="p-5" tone="quiet">
      <CardHeader
        actions={
          <Link
            className="inline-flex h-8 shrink-0 items-center rounded-full border border-line-input bg-surface px-3.5 text-xs font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-surface-2"
            to="/app-config"
          >
            Ayarları aç
          </Link>
        }
        className="mb-4"
        description="Canlı mobil uygulama ayarlarının salt okunur özeti."
        title="Uygulama ayarları"
      />

      {!hasAnyConfig ? (
        <div className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-sm text-muted">
          Ayar belgeleri bu yanıtta yok. Uygulama ayarları sayfasından belgelerin oluşturulduğunu kontrol edin.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatusTile
            helper={
              totalServices
                ? `${enabledServices}/${totalServices} servis açık`
                : "Bilgi yok"
            }
            icon={Cloud}
            label="API servisleri"
            status={servicesHealthy ? "Sorunsuz" : "Gözden geçirin"}
            tone={servicesHealthy ? "success" : "warning"}
          />
          <StatusTile
            helper={summary.appVersion?.latestVersion ?? "Bilgi yok"}
            icon={Settings2}
            label="Uygulama sürümü"
            status={summary.appVersion ? "Ayarlı" : "Eksik"}
            tone={summary.appVersion ? "success" : "danger"}
          />
          <StatusTile
            helper={summary.dwKvkkVersion?.currentVersion ?? "Bilgi yok"}
            icon={ShieldCheck}
            label="KVKK sürümü"
            status={summary.dwKvkkVersion ? "Ayarlı" : "Eksik"}
            tone={summary.dwKvkkVersion ? "success" : "danger"}
          />
          <StatusTile
            helper={weatherSlots ? `${weatherSlots} zaman dilimi tanımlı` : "Bilgi yok"}
            icon={FileCheck2}
            label="Hava durumu dilimleri"
            status={weatherSlots ? "Ayarlı" : "Eksik"}
            tone={weatherSlots ? "success" : "danger"}
          />
        </ul>
      )}
    </Card>
  )
}

interface StatusTileProps {
  helper: string
  icon: typeof Cloud
  label: string
  status: string
  tone: BadgeTone
}

function StatusTile({ helper, icon: Icon, label, status, tone }: StatusTileProps) {
  return (
    <li className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2">
        <Icon aria-hidden className="size-4 shrink-0 text-muted" />
        <p className="text-sm font-semibold text-ink">{label}</p>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Badge tone={tone}>{status}</Badge>
        <p className="truncate text-xs tabular-nums text-muted">{helper}</p>
      </div>
    </li>
  )
}
