import { AlertCircle } from "lucide-react"

export function AuditLogsErrorState({ error }: { error: unknown }) {
  const message =
    error instanceof Error
      ? error.message
      : "Yönetim servisi beklenmeyen bir hata döndürdü."

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-danger/25 bg-danger-soft p-5 sm:p-6" role="alert">
      <AlertCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-danger" />
      <div className="min-w-0">
        <p className="text-base font-bold text-danger">Denetim kayıtları yüklenemedi.</p>
        <p className="mt-1 break-words text-sm text-ink-soft">{message}</p>
        <p className="mt-2 text-sm text-ink-soft">
          Sayfayı yenileyip tekrar deneyin; sorun sürerse yönetim servisi
          bağlantısını kontrol edin.
        </p>
      </div>
    </div>
  )
}
