import { AlertCircle } from "lucide-react"

import { MediaHeader } from "./MediaHeader"

interface MediaErrorStateProps {
  error: unknown
}

export function MediaErrorState({ error }: MediaErrorStateProps) {
  const message = error instanceof Error ? error.message : "Bilinmeyen hata"

  return (
    <section className="space-y-6">
      <MediaHeader />
      <div
        role="alert"
        className="flex items-start gap-3 rounded-2xl border border-danger/25 bg-danger-soft p-5 text-danger"
      >
        <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div>
          <h2 className="text-sm font-bold">Medya verileri yüklenemedi</h2>
          <p className="mt-1 text-sm">
            Sayfayı yenileyip tekrar deneyin; sorun sürerse yönetim servisi bağlantısını kontrol edin.
          </p>
          <p className="mt-2 break-words text-xs opacity-80">{message}</p>
        </div>
      </div>
    </section>
  )
}
