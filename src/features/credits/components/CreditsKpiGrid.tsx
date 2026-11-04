import { ArrowDownLeft, ArrowUpRight, Hash, WalletCards } from "lucide-react"

import { Card } from "../../../components/molecules/Card"
import { CreditsKpiCard } from "./CreditsKpiCard"

interface CreditsKpiGridProps {
  netMovement: number
  totalLoad: number
  totalSpend: number
  transactionCount: number
}

const numberFormatter = new Intl.NumberFormat("tr-TR")

function formatCredits(value: number) {
  return numberFormatter.format(value)
}

function formatSigned(value: number) {
  return `${value > 0 ? "+" : ""}${numberFormatter.format(value)}`
}

export function CreditsKpiGrid({
  netMovement,
  totalLoad,
  totalSpend,
  transactionCount,
}: CreditsKpiGridProps) {
  return (
    <Card className="overflow-hidden">
      <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 xl:grid-cols-4">
        <CreditsKpiCard
          helper="Aralıktaki artı yönlü hareketler"
          icon={ArrowUpRight}
          label="Yüklenen kredi"
          value={formatCredits(totalLoad)}
        />
        <CreditsKpiCard
          helper="Harcamalar ve eksi yönlü hareketler"
          icon={ArrowDownLeft}
          label="Harcanan kredi"
          value={formatCredits(totalSpend)}
        />
        <CreditsKpiCard
          helper="Tüm hareketlerin toplamı"
          icon={WalletCards}
          label="Net bakiye değişimi"
          value={formatSigned(netMovement)}
          valueClassName={
            netMovement > 0
              ? "text-success"
              : netMovement < 0
                ? "text-danger"
                : undefined
          }
        />
        <CreditsKpiCard
          helper="Aralıktaki toplam işlem"
          icon={Hash}
          label="İşlem sayısı"
          value={formatCredits(transactionCount)}
        />
      </dl>
    </Card>
  )
}
