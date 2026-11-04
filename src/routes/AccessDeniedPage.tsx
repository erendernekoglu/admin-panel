import { ArrowLeft, LogOut } from "lucide-react"
import { useNavigate } from "react-router"

import { Button } from "../components/atoms/Button"
import { StatusScreen } from "../features/auth/StatusScreen"
import { useAuth } from "../features/auth/useAuth"

export default function AccessDeniedPage() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const email = user?.email ?? "Bilinmeyen hesap"

  async function handleLogout() {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <StatusScreen
      actions={
        <>
          <Button onClick={handleLogout} size="lg" variant="accent">
            <LogOut aria-hidden className="size-4" />
            Başka hesapla giriş yap
          </Button>
          <Button onClick={() => navigate("/dashboard")} size="lg" variant="secondary">
            <ArrowLeft aria-hidden className="size-4" />
            Panele dön
          </Button>
        </>
      }
      code="Erişim yok"
      description="Bu hesabın yönetim paneline girme yetkisi yok. Yetkili bir hesapla giriş yapın ya da bir yöneticiden yetki isteyin."
      title="Bu panele erişiminiz yok"
    >
      <div className="mx-auto mt-6 max-w-md rounded-xl border border-line bg-surface-2 px-4 py-3 text-left text-sm text-ink-soft">
        <p>
          Giriş yapılan hesap: <span className="font-semibold break-all text-ink">{email}</span>
        </p>
        <p className="mt-2">
          Erişim için bir yöneticinin size Ekip ve roller ekranından rol vermesi
          gerekir. Rol verildiyse çıkış yapıp yeniden girin.
        </p>
      </div>
    </StatusScreen>
  )
}
