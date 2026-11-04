import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "../../../components/atoms/Button"
import { Input } from "../../../components/atoms/Input"
import { isDemoMode } from "../../../lib/config"
import { cn } from "../../../lib/utils"
import { useApiKeyMutations } from "../hooks/useApiKeyMutations"
import {
  DEFAULT_SERVICES,
  type ApiKeyEnv,
  type ApiKeyServices,
  type ApiScope,
  type MintedApiKey,
} from "../types"
import { hintClass, labelClass, textareaClass } from "./fieldClasses"
import { Dialog, DialogFooter, DialogHeader } from "../../../components/molecules/Dialog"
import { ServiceConfigEditor } from "./ServiceConfigEditor"
import { Select } from "../../../components/molecules/Select"

interface CreateApiKeyDialogProps {
  onClose: () => void
  onCreated: (minted: MintedApiKey) => void
  open: boolean
}

export function CreateApiKeyDialog({
  onClose,
  onCreated,
  open,
}: CreateApiKeyDialogProps) {
  const { createApiKey } = useApiKeyMutations()
  // `reset` is stable across renders, unlike the mutation object itself.
  const resetCreate = createApiKey.reset
  const [name, setName] = useState("")
  const [ownerEmail, setOwnerEmail] = useState("")
  const [env, setEnv] = useState<ApiKeyEnv>("test")
  const [expiresAt, setExpiresAt] = useState("")
  const [notes, setNotes] = useState("")
  const [origins, setOrigins] = useState("")
  const [consolePassword, setConsolePassword] = useState("")
  const [scopes, setScopes] = useState<ApiScope[]>([])
  const [services, setServices] = useState<ApiKeyServices>(DEFAULT_SERVICES)

  useEffect(() => {
    if (!open) return
    resetCreate()
    setName("")
    setOwnerEmail("")
    setEnv("test")
    setExpiresAt("")
    setNotes("")
    setOrigins("")
    setConsolePassword("")
    setScopes([])
    setServices(DEFAULT_SERVICES)
  }, [open, resetCreate])

  if (!open) return null

  const canSubmit =
    name.trim().length >= 2 &&
    /.+@.+\..+/.test(ownerEmail.trim()) &&
    scopes.length > 0

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    try {
      const minted = await createApiKey.mutateAsync({
        name: name.trim(),
        ownerEmail: ownerEmail.trim(),
        env,
        scopes,
        services,
        allowedOrigins: origins
          .split(/[\s,]+/)
          .map((origin) => origin.trim())
          .filter(Boolean),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        notes: notes.trim(),
        consolePassword,
      })
      onCreated(minted)
      onClose()
    } catch {
      // The inline banner below shows the normalized adapter error.
    }
  }

  return (
    <Dialog labelledBy="create-api-key-title" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit}>
        <DialogHeader
          description="Gizli anahtar yalnızca bir kez, oluşturulduktan hemen sonra gösterilir."
          id="create-api-key-title"
          onClose={onClose}
        >
          API anahtarı oluştur
        </DialogHeader>

        <div className="space-y-6 px-5 py-5 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Ad
              <Input
                autoFocus
                className="mt-2 w-full"
                onChange={(event) => setName(event.target.value)}
                placeholder="Acme Corp — canlı"
                value={name}
              />
            </label>

            <label className={labelClass}>
              Sahip e-postası
              <Input
                className="mt-2 w-full"
                onChange={(event) => setOwnerEmail(event.target.value)}
                placeholder="dev@acme.com"
                type="email"
                value={ownerEmail}
              />
            </label>

            <label className={labelClass}>
              Ortam
              <Select
                className="mt-2 w-full"
                onChange={(event) => setEnv(event.target.value as ApiKeyEnv)}
                value={env}
              >
                <option value="test">Test</option>
                <option value="live">Canlı</option>
              </Select>
            </label>

            <label className={labelClass}>
              Bitiş tarihi
              <Input
                className="mt-2 w-full"
                onChange={(event) => setExpiresAt(event.target.value)}
                type="datetime-local"
                value={expiresAt}
              />
              <span className={hintClass}>İsteğe bağlı. Boş bırakılırsa süresi dolmaz.</span>
            </label>
          </div>

          <label className={labelClass}>
            İzin verilen tarayıcı kökenleri
            <Input
              className="mt-2 w-full"
              onChange={(event) => setOrigins(event.target.value)}
              placeholder="https://acme.com https://app.acme.com"
              value={origins}
            />
            <span className={hintClass}>
              Boşluk ya da virgülle ayırın. Sunucudan sunucuya çalışan anahtarlarda boş
              bırakın; tarayıcıdaki JavaScript'e konan anahtar herkese açık sayılır.
            </span>
          </label>

          <div>
            <h3 className="text-sm font-bold text-ink">Servis erişimi ve ayarlar</h3>
            <p className="mt-1 mb-3 text-xs text-muted">
              Yalnızca bu anahtarın ihtiyaç duyduğu servisleri açın. Her servisin kendi
              limitleri vardır.
            </p>
            <ServiceConfigEditor
              onScopesChange={setScopes}
              onServicesChange={setServices}
              scopes={scopes}
              services={services}
            />
          </div>

          <label className={labelClass}>
            Notlar
            <textarea
              className={cn(textareaClass, "mt-2 w-full")}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Bu anahtarı kim, neden istedi?"
              rows={2}
              value={notes}
            />
          </label>

          <label className={labelClass}>
            Konsol şifresi
            <Input
              autoComplete={isDemoMode ? "off" : "current-password"}
              className="mt-2 w-full"
              onChange={(event) => setConsolePassword(event.target.value)}
              type="password"
              value={consolePassword}
            />
            <span className={hintClass}>
              {isDemoMode
                ? "Demo modunda herhangi bir boş olmayan değer yeterlidir. Gerçek şifrenizi girmeyin."
                : "Sunucuda bir şifre tanımlıysa gereklidir."}
            </span>
          </label>

          {scopes.length === 0 && (
            <p className="rounded-xl bg-warning-soft px-3.5 py-2.5 text-sm text-warning">
              En az bir servisi açın; izni olmayan bir anahtar hiçbir şeyi çağıramaz.
            </p>
          )}

          {createApiKey.error && (
            <p
              className="animate-pop-in rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger"
              role="alert"
            >
              {createApiKey.error instanceof Error
                ? createApiKey.error.message
                : "Anahtar oluşturulamadı. Bilgileri kontrol edip tekrar deneyin."}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="secondary">
            Vazgeç
          </Button>
          <Button
            disabled={!canSubmit || createApiKey.isPending}
            type="submit"
            variant="accent"
          >
            {createApiKey.isPending ? (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            ) : null}
            Anahtarı oluştur
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
