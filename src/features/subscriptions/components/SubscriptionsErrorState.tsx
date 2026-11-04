import { AlertCircle } from "lucide-react"

import { Card } from "../../../components/molecules/Card"

interface SubscriptionsErrorStateProps {
  error: unknown
}

export function SubscriptionsErrorState({ error }: SubscriptionsErrorStateProps) {
  const message = error instanceof Error ? error.message : "Bilinmeyen hata"

  return (
    <Card className="flex items-start gap-3 p-5" role="alert">
      <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger" />
      <div>
        <h2 className="text-sm font-semibold text-ink">Abonelikler yüklenemedi</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Sayfayı yenileyip tekrar deneyin. Sorun sürerse bağlantınızı ve
          yönetici yetkinizi kontrol edin.
        </p>
        <p className="mt-2 font-mono text-xs break-all text-muted">{message}</p>
      </div>
    </Card>
  )
}
