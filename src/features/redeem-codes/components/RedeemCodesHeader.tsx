import { AlertTriangle, Plus } from "lucide-react"

import { Button } from "../../../components/atoms/Button"
import { PageHeader } from "../../../components/molecules/PageHeader"

interface RedeemCodesHeaderProps {
  onCreateClick: () => void
}

export function RedeemCodesHeader({ onCreateClick }: RedeemCodesHeaderProps) {
  return (
    <div className="space-y-4">
      <PageHeader
        actions={
          <Button onClick={onCreateClick} variant="accent">
            <Plus aria-hidden="true" className="size-4" />
            Kod oluştur
          </Button>
        }
        description="Promosyon kodlarını, kime atandıklarını, kaç kez kullanıldıklarını ve ne zaman sona erdiklerini takip edin."
        title="Hediye kodları"
      />

      <div className="flex items-start gap-2.5 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <p>
          Demo modunda kod oluşturma, atama ve devre dışı bırakma yerel bellekte
          çalışır; sayfa yenilendiğinde başlangıç verisine döner.
        </p>
      </div>
    </div>
  )
}
