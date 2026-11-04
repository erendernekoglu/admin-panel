import { CircleOff, Crown, FileText, Sparkles, UserCheck, Users } from "lucide-react"

import { Card } from "../../../components/molecules/Card"
import { SubscriptionsKpiCard } from "./SubscriptionsKpiCard"

interface SubscriptionsKpiGridProps {
  activeSubscriptions: number
  cancelledOrExpired: number
  freeUsers: number
  premiumUsers: number
  proUsers: number
  totalRecords: number
}

const numberFormatter = new Intl.NumberFormat("tr-TR")

function formatNumber(value: number) {
  return numberFormatter.format(value)
}

export function SubscriptionsKpiGrid({
  activeSubscriptions,
  cancelledOrExpired,
  freeUsers,
  premiumUsers,
  proUsers,
  totalRecords,
}: SubscriptionsKpiGridProps) {
  return (
    <Card className="overflow-hidden">
      <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <SubscriptionsKpiCard
          helper="Şu an aktif görünen kayıtlar"
          icon={UserCheck}
          label="Aktif abonelik"
          value={formatNumber(activeSubscriptions)}
        />
        <SubscriptionsKpiCard
          helper="İptal, süre bitimi veya geri alma"
          icon={CircleOff}
          label="İptal / süresi dolmuş"
          value={formatNumber(cancelledOrExpired)}
        />
        <SubscriptionsKpiCard
          helper="Abonelik koleksiyonundaki belgeler"
          icon={FileText}
          label="Toplam kayıt"
          value={formatNumber(totalRecords)}
        />
        <SubscriptionsKpiCard
          helper="Profilinde Premium plan olanlar"
          icon={Sparkles}
          label="Premium kullanıcı"
          value={formatNumber(premiumUsers)}
        />
        <SubscriptionsKpiCard
          helper="Profilinde Pro plan olanlar"
          icon={Crown}
          label="Pro kullanıcı"
          value={formatNumber(proUsers)}
        />
        <SubscriptionsKpiCard
          helper="Profilinde ücretsiz plan olanlar"
          icon={Users}
          label="Ücretsiz kullanıcı"
          value={formatNumber(freeUsers)}
        />
      </dl>
    </Card>
  )
}
