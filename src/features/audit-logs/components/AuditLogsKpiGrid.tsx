import {
  AlertTriangle,
  CheckCircle2,
  CloudSun,
  FileCog,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"

import { Card } from "../../../components/molecules/Card"
import { AuditLogsKpiCard } from "./AuditLogsKpiCard"

interface AuditLogsKpiGridProps {
  configChanges: number
  criticalActions: number
  failedEvents: number
  successfulEvents: number
  totalEvents: number
  weatherOperations: number
}

const formatter = new Intl.NumberFormat("tr-TR")

/** A single stat strip instead of six separate cards. */
export function AuditLogsKpiGrid({
  configChanges,
  criticalActions,
  failedEvents,
  successfulEvents,
  totalEvents,
  weatherOperations,
}: AuditLogsKpiGridProps) {
  return (
    // gap-px over a line-coloured fill draws hairlines between cells at every breakpoint.
    <Card className="grid grid-cols-2 gap-px overflow-hidden bg-line sm:grid-cols-3 xl:grid-cols-6">
      <AuditLogsKpiCard
        helper="Sunucunun yazdığı tüm kayıtlar"
        icon={ShieldCheck}
        label="Toplam kayıt"
        value={formatter.format(totalEvents)}
      />
      <AuditLogsKpiCard
        helper="Sorunsuz tamamlandı"
        icon={CheckCircle2}
        label="Başarılı"
        value={formatter.format(successfulEvents)}
      />
      <AuditLogsKpiCard
        helper="Sunucu başarısız bildirdi"
        icon={AlertTriangle}
        label="Başarısız"
        tone={failedEvents > 0 ? "danger" : "default"}
        value={formatter.format(failedEvents)}
      />
      <AuditLogsKpiCard
        helper="Silme, ayar, kredi ve API anahtarı"
        icon={ShieldAlert}
        label="Kritik işlemler"
        value={formatter.format(criticalActions)}
      />
      <AuditLogsKpiCard
        helper="Uzaktan ayar değişiklikleri"
        icon={FileCog}
        label="Ayar değişikliği"
        value={formatter.format(configChanges)}
      />
      <AuditLogsKpiCard
        helper="Hava durumu eşitleme işleri"
        icon={CloudSun}
        label="Hava durumu"
        value={formatter.format(weatherOperations)}
      />
    </Card>
  )
}
