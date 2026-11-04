import { useState, type FormEvent } from "react"

import { BrandMark } from "../components/atoms/BrandMark"
import { Button } from "../components/atoms/Button"
import { Input } from "../components/atoms/Input"
import { ThemeToggle } from "../components/molecules/ThemeToggle"
import { useAuth } from "../features/auth/useAuth"
import { authErrorMessage } from "../lib/auth/authErrors"
import { isDemoMode } from "../lib/config"

const DEMO_NOTICE =
  "Yerel önizleme • Sunucuya bağlı değil • Panel boş başlar • Yenilemede girilen kayıtlar silinir"

export default function LoginPage() {
  const { error: authError, enterDemo, loginWithEmail } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await loginWithEmail(email, password)
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  function handleDemoEntry() {
    setError(null)
    enterDemo()
  }

  return (
    <main className="grid min-h-screen bg-canvas text-ink lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden border-r border-line bg-surface-2 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <BrandMark subtitle="Yönetim paneli" />
        <div aria-hidden className="pointer-events-none absolute right-[8%] top-[42%] flex aspect-square w-[min(58%,420px)] -translate-y-1/2 items-center justify-center rounded-[3rem] border border-line bg-surface shadow-card">
          <span className="font-display text-[clamp(4rem,9vw,7rem)] leading-none text-accent">AP</span>
        </div>
        <p className="relative max-w-sm font-display text-5xl leading-[1.02] text-ink">
          <span className="block animate-title-in">Bağımsız</span>
          <span className="block animate-title-in [animation-delay:120ms]">yönetim paneli.</span>
        </p>
      </section>

      <section className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <BrandMark className="lg:invisible" withWordmark />
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <p className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-semibold text-ink-soft">
            <span className="size-1.5 rounded-full bg-signal" />
            {isDemoMode ? "Yerel önizleme" : "API modu"}
          </p>

          <h1 className="font-display text-4xl leading-none text-ink">
            {isDemoMode ? "Yerel önizleme" : "Giriş yap"}
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
            {isDemoMode
              ? "Bu panel hiçbir sunucuya bağlı değildir. Tüm ekranlar boş başlar; girdiğiniz kayıtlar yalnızca bu sekmenin belleğinde tutulur ve sayfa yenilendiğinde silinir."
              : "Panel, aynı kaynaklı sunucu oturumunu kullanır. Yönetici rolü sunucuda doğrulanır."}
          </p>

          {isDemoMode ? (
            <div className="mt-8 space-y-4">
              <p className="rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-sm leading-relaxed text-ink-soft">
                {DEMO_NOTICE}
              </p>
              <Button className="w-full" onClick={handleDemoEntry} size="lg" type="button" variant="accent">
                Boş paneli aç
              </Button>
              <p className="text-xs leading-relaxed text-muted">
                Bu oturum sabit bir yerel yönetici rolü kullanır; gerçek yetki değildir ve arka uçta bir
                kayıt oluşturmaz. API modunda tüm yetkiler sunucu yanıtından okunur.
              </p>
            </div>
          ) : (
            <form className="mt-8 space-y-4" onSubmit={handleEmailLogin}>
              <label className="block space-y-1.5" htmlFor="email">
                <span className="text-sm font-semibold text-ink">E-posta</span>
                <Input
                  autoComplete="email"
                  className="h-11 w-full"
                  disabled={loading}
                  id="email"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </label>
              <label className="block space-y-1.5" htmlFor="password">
                <span className="text-sm font-semibold text-ink">Şifre</span>
                <Input
                  autoComplete="current-password"
                  className="h-11 w-full"
                  disabled={loading}
                  id="password"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </label>

              {(error || authError) && (
                <p className="animate-pop-in rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger" role="alert">
                  {error ?? authError}
                </p>
              )}

              <Button className="w-full" disabled={loading} size="lg" type="submit" variant="accent">
                {loading ? "Giriş yapılıyor…" : "Giriş yap"}
              </Button>
            </form>
          )}

          {isDemoMode && (error || authError) && (
            <p className="mt-4 animate-pop-in rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger" role="alert">
              {error ?? authError}
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
