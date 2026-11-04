import { AlertCircle, RefreshCw } from "lucide-react"

import { Button } from "../../../components/atoms/Button"

interface DashboardErrorStateProps {
  error: unknown
  onRetry?: () => void
}

export function DashboardErrorState({ error, onRetry }: DashboardErrorStateProps) {
  return (
    <div
      className="animate-pop-in rounded-2xl border border-danger/25 bg-danger-soft p-5"
      role="alert"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <AlertCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-danger" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-danger">Genel bakış yüklenemedi</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Tekrar deneyin; sorun sürerse yönetici API bağlantısını ve yetkilerinizi kontrol edin.
          </p>
          <p className="mt-2 font-mono text-xs break-words text-muted">
            {error instanceof Error
              ? error.message
              : "Yönetici API beklenmeyen bir hata döndürdü."}
          </p>
        </div>
        {onRetry ? (
          <Button onClick={onRetry} size="sm" variant="secondary">
            <RefreshCw aria-hidden className="size-3.5" />
            Tekrar dene
          </Button>
        ) : null}
      </div>
    </div>
  )
}
