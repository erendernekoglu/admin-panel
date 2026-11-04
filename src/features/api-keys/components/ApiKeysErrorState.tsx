import { AlertCircle } from "lucide-react"

export function ApiKeysErrorState({
  error,
  title = "API anahtarları yüklenemedi.",
}: {
  error: unknown
  title?: string
}) {
  const message =
    error instanceof Error
      ? error.message
      : "Yönetici fonksiyonu beklenmeyen bir hata döndürdü."

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-danger/25 bg-danger-soft p-5 sm:p-6" role="alert">
      <AlertCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-danger" />
      <div className="min-w-0">
        <p className="text-base font-bold text-danger">{title}</p>
        <p className="mt-1 break-words text-sm text-ink-soft">{message}</p>
        <p className="mt-2 text-sm text-ink-soft">
          Sayfayı yenileyip tekrar deneyin; sorun sürerse yönetici fonksiyonunun
          kayıtlarına bakın.
        </p>
      </div>
    </div>
  )
}
