import { AlertCircle } from "lucide-react"

import { PageHeader } from "../../../components/molecules/PageHeader"
import { WARDROBE_DESCRIPTION, WARDROBE_TITLE } from "../copy"

interface WardrobeErrorStateProps {
  error: unknown
}

export function WardrobeErrorState({ error }: WardrobeErrorStateProps) {
  const message = error instanceof Error ? error.message : "Bilinmeyen hata"

  return (
    <section className="space-y-6">
      <PageHeader title={WARDROBE_TITLE} description={WARDROBE_DESCRIPTION} />
      <div
        role="alert"
        className="flex items-start gap-3 rounded-2xl border border-danger/25 bg-danger-soft p-5 text-danger"
      >
        <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div>
          <h2 className="text-sm font-bold">Gardırop verileri yüklenemedi</h2>
          <p className="mt-1 text-sm">
            Sayfayı yenileyip tekrar deneyin; sorun sürerse yönetici erişiminizi kontrol edin.
          </p>
          <p className="mt-2 break-words text-xs opacity-80">{message}</p>
        </div>
      </div>
    </section>
  )
}
