import type { ReactNode } from "react"
import { ShieldOff } from "lucide-react"
import { Link } from "react-router"

import { CONSOLE_ROLE_LABELS, type Permission } from "../../lib/auth/permissions"
import { useAuth } from "./useAuth"

interface RequirePermissionProps {
  permission?: Permission
  children: ReactNode
}

/**
 * Renders the screen only for roles whose bundle includes `permission`.
 * The server enforces the same table; this keeps the console from showing
 * screens that would only fail.
 */
export function RequirePermission({ permission, children }: RequirePermissionProps) {
  const { can, consoleRole } = useAuth()
  if (!permission || can(permission)) return children

  return (
    <section className="mx-auto mt-16 max-w-md text-center" role="status">
      <ShieldOff aria-hidden className="mx-auto size-8 text-muted" />
      <h1 className="mt-4 font-display text-3xl text-ink">Bu ekran rolünüze kapalı</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        {consoleRole ? `${CONSOLE_ROLE_LABELS[consoleRole]} rolü` : "Rolünüz"} bu ekranı açamaz.
        Erişim gerekiyorsa bir adminden rolünüzü değiştirmesini isteyin.
      </p>
      <Link className="mt-6 inline-block text-sm font-semibold text-accent hover:underline" to="/dashboard">
        Genel bakışa dön
      </Link>
    </section>
  )
}
