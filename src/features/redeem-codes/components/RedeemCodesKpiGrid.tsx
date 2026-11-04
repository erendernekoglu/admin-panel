import { CheckCircle2, Clock, Hash, Link2, TicketCheck } from "lucide-react"

import { Card } from "../../../components/molecules/Card"
import { RedeemCodesKpiCard } from "./RedeemCodesKpiCard"

interface RedeemCodesKpiGridProps {
  activeCodes: number
  assignedCodes: number
  expiredCodes: number
  totalCodes: number
  usedCodes: number
}

const formatter = new Intl.NumberFormat("tr-TR")

export function RedeemCodesKpiGrid({
  activeCodes,
  assignedCodes,
  expiredCodes,
  totalCodes,
  usedCodes,
}: RedeemCodesKpiGridProps) {
  return (
    <Card className="overflow-hidden">
      <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <RedeemCodesKpiCard
          helper="Tüm promosyon kodları"
          icon={Hash}
          label="Toplam kod"
          value={formatter.format(totalCodes)}
        />
        <RedeemCodesKpiCard
          helper="Şu an kullanılabilir"
          icon={CheckCircle2}
          label="Aktif"
          value={formatter.format(activeCodes)}
        />
        <RedeemCodesKpiCard
          helper="Kullanım sınırına ulaşan"
          icon={TicketCheck}
          label="Kullanılmış"
          value={formatter.format(usedCodes)}
        />
        <RedeemCodesKpiCard
          helper="Son geçerlilik tarihi geçen"
          icon={Clock}
          label="Süresi dolmuş"
          value={formatter.format(expiredCodes)}
        />
        <RedeemCodesKpiCard
          helper="Bir kullanıcıya bağlanmış"
          icon={Link2}
          label="Atanmış"
          value={formatter.format(assignedCodes)}
        />
      </dl>
    </Card>
  )
}
