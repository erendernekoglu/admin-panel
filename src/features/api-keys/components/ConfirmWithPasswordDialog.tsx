import { useEffect, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"

import { Button } from "../../../components/atoms/Button"
import { Input } from "../../../components/atoms/Input"
import { isDemoMode } from "../../../lib/config"
import { cn } from "../../../lib/utils"
import { hintClass, labelClass } from "./fieldClasses"
import { Dialog, DialogFooter, DialogHeader } from "../../../components/molecules/Dialog"

interface ConfirmWithPasswordDialogProps {
  busy: boolean
  confirmLabel: string
  description: string
  destructive?: boolean
  error: unknown
  onCancel: () => void
  onConfirm: (consolePassword: string) => void
  open: boolean
  title: string
}

/**
 * Second factor for the calls that mint or destroy a key.
 *
 * Admin sign-in already gates these; this covers the narrower case of a session
 * left open on an unlocked machine. The backend fails closed: the operation is
 * refused while no password is configured on the server.
 */
export function ConfirmWithPasswordDialog({
  busy,
  confirmLabel,
  description,
  destructive = false,
  error,
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmWithPasswordDialogProps) {
  const [consolePassword, setConsolePassword] = useState("")

  useEffect(() => {
    if (open) setConsolePassword("")
  }, [open])

  if (!open) return null

  return (
    <Dialog labelledBy="confirm-password-title" onClose={onCancel} size="sm">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!busy) onConfirm(consolePassword)
        }}
      >
        <DialogHeader id="confirm-password-title" onClose={onCancel}>
          {title}
        </DialogHeader>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <div
            className={cn(
              "flex gap-2.5 rounded-xl px-3.5 py-3 text-sm leading-relaxed",
              destructive ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning",
            )}
          >
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>{description}</span>
          </div>

          <label className={labelClass}>
            Konsol şifresi
            <Input
              autoComplete={isDemoMode ? "off" : "current-password"}
              autoFocus
              className="mt-2 w-full"
              onChange={(event) => setConsolePassword(event.target.value)}
              type="password"
              value={consolePassword}
            />
            <span className={hintClass}>
              {isDemoMode
                ? "Demo modunda herhangi bir boş olmayan değer yeterlidir. Gerçek şifrenizi girmeyin."
                : "Kritik işlemlerde girişe ek olarak istenir. Bilmiyorsanız bir admin'e sorun."}
            </span>
          </label>

          {error != null && (
            <p
              className="animate-pop-in rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger"
              role="alert"
            >
              {error instanceof Error
                ? error.message
                : "İşlem tamamlanamadı. Şifreyi kontrol edip tekrar deneyin."}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onCancel} variant="secondary">
            Vazgeç
          </Button>
          <Button disabled={busy} type="submit" variant={destructive ? "danger" : "accent"}>
            {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
