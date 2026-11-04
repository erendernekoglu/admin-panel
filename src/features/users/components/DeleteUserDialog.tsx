import { useEffect, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"

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
import type { AdminUser } from "../types"
import { useDeleteUser } from "../hooks/useDeleteUser"

interface DeleteUserDialogProps {
  targetUser: AdminUser | null
  onClose: () => void
  onDeleted?: (uid: string) => void
}

export function DeleteUserDialog({
  onClose,
  onDeleted,
  targetUser,
}: DeleteUserDialogProps) {
  const [confirmText, setConfirmText] = useState("")
  const [consolePassword, setConsolePassword] = useState("")
  const deleteUser = useDeleteUser()
  // `reset` is stable across renders, unlike the mutation object itself.
  const resetDelete = deleteUser.reset
  const isOpen = Boolean(targetUser)
  const canDelete =
    confirmText === "SIL" && consolePassword.length > 0 && Boolean(targetUser)

  useEffect(() => {
    if (isOpen) {
      setConfirmText("")
      setConsolePassword("")
      resetDelete()
    }
  }, [isOpen, resetDelete])

  if (!targetUser) return null

  async function handleDelete() {
    if (!targetUser || !canDelete) return

    try {
      await deleteUser.mutateAsync({ uid: targetUser.uid, consolePassword })
      onDeleted?.(targetUser.uid)
      onClose()
    } catch {
      // The mutation error is rendered below.
    }
  }

  // While the delete runs, Escape and the close button are disabled.
  const close = deleteUser.isPending ? undefined : onClose

  return (
    <Dialog className="max-w-lg" labelledBy="delete-user-title" onClose={close} size="sm">
      <DialogHeader
        description={
          isDemoMode
            ? "Demo modunda bu işlem yalnızca tarayıcı belleğindeki sentetik kullanıcıyı siler; sayfa yenilendiğinde kullanıcı geri gelir."
            : "Bu işlem kullanıcıyı ve ilişkili verilerini kalıcı olarak silebilir. Silme işlemi yönetim adaptörü üzerinden yapılır."
        }
        icon={
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
            <AlertTriangle aria-hidden="true" size={20} />
          </div>
        }
        id="delete-user-title"
        onClose={close}
      >
        Kullanıcıyı sil
      </DialogHeader>

      <DialogBody>
        <dl className="space-y-2 rounded-xl bg-surface-2 p-4 text-sm">
          <div className="flex gap-3">
            <dt className="w-16 shrink-0 text-muted">Ad</dt>
            <dd className="min-w-0 font-medium text-ink">
              {targetUser.displayName || "—"}
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-16 shrink-0 text-muted">E-posta</dt>
            <dd className="min-w-0 break-all text-ink">{targetUser.email}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-16 shrink-0 text-muted">ID</dt>
            <dd className="min-w-0 break-all font-mono text-xs leading-5 text-ink-soft">
              {targetUser.uid}
            </dd>
          </div>
        </dl>

        <label className="block">
          <span className="text-sm font-medium text-ink">
            Onaylamak için <span className="font-mono font-semibold">SIL</span>{" "}
            yazın
          </span>
          <Input
            autoComplete="off"
            autoFocus
            className="mt-2 w-full font-mono font-semibold focus:border-danger focus:ring-danger/15"
            disabled={deleteUser.isPending}
            onChange={(event) => setConfirmText(event.target.value)}
            value={confirmText}
          />
        </label>

        <label className="block text-sm font-medium text-ink">
          Konsol şifresi
          <Input
            autoComplete={isDemoMode ? "off" : "current-password"}
            className="mt-2 w-full"
            disabled={deleteUser.isPending}
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

        {deleteUser.error && (
          <DialogError>
            {deleteUser.error instanceof Error
              ? deleteUser.error.message
              : "Kullanıcı silinemedi. Birkaç saniye sonra tekrar deneyin."}
          </DialogError>
        )}
      </DialogBody>

      <DialogFooter>
        <Button
          disabled={deleteUser.isPending}
          onClick={onClose}
          variant="secondary"
        >
          Vazgeç
        </Button>
        <Button
          disabled={!canDelete || deleteUser.isPending}
          onClick={handleDelete}
          variant="danger"
        >
          {deleteUser.isPending && (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          )}
          Kullanıcıyı sil
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
