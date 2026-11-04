import { useEffect, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"

import { Button } from "../../../components/atoms/Button"
import { Input } from "../../../components/atoms/Input"
import { useRedeemCodeMutations } from "../hooks/useRedeemCodeMutations"
import type { RedeemCode } from "../types"
import { DialogError, DialogNotice } from "../../../components/molecules/Dialog"
import { DialogShell, fieldLabelClassName } from "./DialogShell"

interface AssignRedeemCodeDialogProps {
  code: RedeemCode | null
  onClose: () => void
}

export function AssignRedeemCodeDialog({
  code,
  onClose,
}: AssignRedeemCodeDialogProps) {
  const { assignRedeemCode } = useRedeemCodeMutations()
  // `reset` is stable across renders, unlike the mutation object itself.
  const resetAssign = assignRedeemCode.reset
  const [userIdOrEmail, setUserIdOrEmail] = useState("")

  useEffect(() => {
    if (!code) return
    resetAssign()
    setUserIdOrEmail(code.assignedUserEmail || code.assignedUserId || "")
  }, [code, resetAssign])

  if (!code) return null

  const selectedCode = code
  const target = userIdOrEmail.trim()
  const canSubmit = target.length > 0
  const isEmail = target.includes("@")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    try {
      await assignRedeemCode.mutateAsync({
        codeId: selectedCode.id,
        code: selectedCode.code,
        userEmail: isEmail ? target : undefined,
        userId: isEmail ? undefined : target,
      })
      onClose()
    } catch {
      // The service intentionally surfaces the backend TODO error below.
    }
  }

  return (
    <DialogShell
      description={
        <span className="font-mono font-semibold text-ink">{code.code}</span>
      }
      footer={
        <>
          <Button onClick={onClose} variant="secondary">
            Vazgeç
          </Button>
          <Button
            disabled={!canSubmit || assignRedeemCode.isPending}
            type="submit"
          >
            {assignRedeemCode.isPending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            Kodu ata
          </Button>
        </>
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Hediye kodunu kullanıcıya ata"
      titleId="assign-redeem-code-title"
    >
      <DialogNotice>
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>
          Demo modunda atama bu tarayıcı oturumunda tutulur ve sayfa
          yenilendiğinde sıfırlanır.
        </span>
      </DialogNotice>

      <label className={fieldLabelClassName}>
        Kullanıcı ID veya e-posta
        <Input
          autoFocus
          className="mt-2 w-full"
          onChange={(event) => setUserIdOrEmail(event.target.value)}
          placeholder="uid_123 ya da ornek@eposta.com"
          value={userIdOrEmail}
        />
      </label>

      {assignRedeemCode.error && (
        <DialogError>
          {assignRedeemCode.error instanceof Error
            ? assignRedeemCode.error.message
            : "Kod atanamadı. Birkaç saniye sonra tekrar deneyin."}
        </DialogError>
      )}
    </DialogShell>
  )
}
