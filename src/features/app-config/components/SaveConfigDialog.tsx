import { AlertTriangle, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "../../../components/atoms/Button"
import { Input } from "../../../components/atoms/Input"
import {
  Dialog,
  DialogBody,
  DialogError,
  DialogFooter,
  DialogHeader,
} from "../../../components/molecules/Dialog"
import { isDemoMode } from "../../../lib/config"

interface SaveConfigDialogProps {
  configLabel: string
  error?: string
  isSaving: boolean
  onCancel: () => void
  onConfirm: (consolePassword: string) => void
  open: boolean
}

export function SaveConfigDialog({
  configLabel,
  error,
  isSaving,
  onCancel,
  onConfirm,
  open,
}: SaveConfigDialogProps) {
  const [consolePassword, setConsolePassword] = useState("")

  useEffect(() => {
    if (open) setConsolePassword("")
  }, [open])

  if (!open) return null

  const canConfirm = !isSaving && consolePassword.trim().length > 0

  // While saving, Escape and the close button are disabled.
  const close = isSaving ? undefined : onCancel

  return (
    <Dialog labelledBy="save-config-title" onClose={close} size="sm">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (canConfirm) onConfirm(consolePassword)
        }}
      >
        <DialogHeader
          description={
            isDemoMode
              ? "Demo modunda değişiklikler yalnızca bu tarayıcı oturumunun belleğinde tutulur; sayfa yenilendiğinde başlangıç ayarlarına dönülür."
              : "Değişiklikler yönetici fonksiyonu üzerinden hemen yayınlanır ve canlı uygulama kullanıcılarını etkileyebilir."
          }
          icon={
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
              <AlertTriangle aria-hidden className="size-4" />
            </span>
          }
          id="save-config-title"
          onClose={close}
        >
          {configLabel}: kaydet ve yayınla
        </DialogHeader>

        <DialogBody>
          <label className="block text-sm font-semibold text-ink">
            Konsol şifresi
            <Input
              autoComplete={isDemoMode ? "off" : "current-password"}
              autoFocus
              className="mt-2 w-full"
              onChange={(event) => setConsolePassword(event.target.value)}
              type="password"
              value={consolePassword}
            />
            <span className="mt-1 block text-xs text-muted">
              {isDemoMode
                ? "Demo modunda herhangi bir boş olmayan değer yeterlidir. Gerçek şifrenizi girmeyin."
                : "Kritik işlemlerde girişe ek olarak istenir. Bilmiyorsanız bir admin'e sorun."}
            </span>
          </label>
          {error ? <DialogError>{error}</DialogError> : null}
        </DialogBody>

        <DialogFooter>
          <Button disabled={isSaving} onClick={onCancel} variant="secondary">
            Vazgeç
          </Button>
          <Button disabled={!canConfirm} type="submit" variant="accent">
            {isSaving ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
            Kaydet ve yayınla
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
