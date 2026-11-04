import { ArrowLeft, RotateCw } from "lucide-react"
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router"

import { Button } from "../components/atoms/Button"
import { StatusScreen } from "../features/auth/StatusScreen"

export default function RouteErrorPage() {
  const error = useRouteError()
  const navigate = useNavigate()
  const message = isRouteErrorResponse(error)
    ? error.statusText || null
    : error instanceof Error
      ? error.message
      : null

  return (
    <StatusScreen
      actions={
        <>
          <Button onClick={() => navigate("/dashboard")} size="lg" variant="accent">
            <ArrowLeft aria-hidden className="size-4" />
            Panele dön
          </Button>
          <Button onClick={() => window.location.reload()} size="lg" variant="secondary">
            <RotateCw aria-hidden className="size-4" />
            Sayfayı yenile
          </Button>
        </>
      }
      code={isRouteErrorResponse(error) ? String(error.status) : "Hata"}
      description="Bu sayfa açılırken beklenmeyen bir hata oluştu. Sayfayı yenileyin ya da panele dönüp başka bir yerden devam edin."
      title="Bir şeyler ters gitti"
    >
      {message && (
        <p className="mx-auto mt-6 max-w-md break-words rounded-xl border border-line bg-surface-2 px-4 py-3 text-left text-sm text-ink-soft">
          <span className="block text-xs font-semibold text-muted">Hata ayrıntısı</span>
          <span className="mt-1 block">{message}</span>
        </p>
      )}
    </StatusScreen>
  )
}
