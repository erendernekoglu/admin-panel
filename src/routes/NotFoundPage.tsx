import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router"

import { Button } from "../components/atoms/Button"
import { StatusScreen } from "../features/auth/StatusScreen"

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <StatusScreen
      actions={
        <Button onClick={() => navigate("/dashboard")} size="lg" variant="accent">
          <ArrowLeft aria-hidden className="size-4" />
          Panele dön
        </Button>
      }
      code="404"
      description="Açmaya çalıştığınız adres panelde bulunmuyor; bağlantı eski ya da hatalı yazılmış olabilir. Panele dönüp menüden devam edebilirsiniz."
      title="Sayfa bulunamadı"
    />
  )
}
