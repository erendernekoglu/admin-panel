import { useEffect, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"

import { Button } from "../../../components/atoms/Button"
import { Input } from "../../../components/atoms/Input"
import { useRedeemCodeMutations } from "../hooks/useRedeemCodeMutations"
import type { RedeemCodeType } from "../types"
import { DialogError, DialogNotice } from "../../../components/molecules/Dialog"
import { DialogShell, fieldLabelClassName } from "./DialogShell"
import { redeemCodeTypeLabels } from "../labels"
import { Select } from "../../../components/molecules/Select"

interface CreateRedeemCodeDialogProps {
  onClose: () => void
  open: boolean
}

const typeOrder: RedeemCodeType[] = [
  "credit",
  "subscription",
  "discount",
  "wardrobe",
  "custom",
]

export function CreateRedeemCodeDialog({
  onClose,
  open,
}: CreateRedeemCodeDialogProps) {
  const { createRedeemCode } = useRedeemCodeMutations()
  // `reset` is stable across renders, unlike the mutation object itself.
  const resetCreate = createRedeemCode.reset
  const [code, setCode] = useState("")
  const [type, setType] = useState<RedeemCodeType>("credit")
  const [value, setValue] = useState(0)
  const [maxUsage, setMaxUsage] = useState(1)
  const [expiresAt, setExpiresAt] = useState("")

  useEffect(() => {
    if (!open) return
    resetCreate()
    setCode("")
    setType("credit")
    setValue(0)
    setMaxUsage(1)
    setExpiresAt("")
  }, [open, resetCreate])

  if (!open) return null

  const canSubmit = code.trim().length > 0 && maxUsage > 0 && expiresAt.length > 0

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    try {
      await createRedeemCode.mutateAsync({
        code: code.trim(),
        type,
        value,
        maxUsage,
        expiresAt,
      })
      onClose()
    } catch {
      // The service intentionally surfaces the backend TODO error below.
    }
  }

  return (
    <DialogShell
      className="max-w-xl"
      description="Kod, değer, kullanım sınırı ve son geçerlilik tarihini girin. Kayıt sunucu fonksiyonu üzerinden oluşturulur."
      footer={
        <>
          <Button onClick={onClose} variant="secondary">
            Vazgeç
          </Button>
          <Button
            disabled={!canSubmit || createRedeemCode.isPending}
            type="submit"
            variant="accent"
          >
            {createRedeemCode.isPending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            Kodu oluştur
          </Button>
        </>
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Yeni hediye kodu"
      titleId="create-redeem-code-title"
    >
      <DialogNotice>
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>
          Demo modunda kod bu tarayıcı oturumunda oluşturulur ve sayfa
          yenilendiğinde sıfırlanır. Canlı ortamda yetkili yönetim servisi gerekir.
        </span>
      </DialogNotice>

      <label className={fieldLabelClassName}>
        Kod
        <Input
          autoComplete="off"
          autoFocus
          className="mt-2 w-full font-mono"
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="YAZ-100"
          value={code}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={fieldLabelClassName}>
          Tür
          <Select
            className="mt-2 w-full"
            onChange={(event) => setType(event.target.value as RedeemCodeType)}
            value={type}
          >
            {typeOrder.map((option) => (
              <option key={option} value={option}>
                {redeemCodeTypeLabels[option]}
              </option>
            ))}
          </Select>
        </label>

        <label className={fieldLabelClassName}>
          Değer
          <Input
            className="mt-2 w-full tabular-nums"
            min={0}
            onChange={(event) => setValue(Number(event.target.value))}
            type="number"
            value={value}
          />
        </label>

        <label className={fieldLabelClassName}>
          Kullanım sınırı
          <Input
            className="mt-2 w-full tabular-nums"
            min={1}
            onChange={(event) => setMaxUsage(Number(event.target.value))}
            type="number"
            value={maxUsage}
          />
        </label>

        <label className={fieldLabelClassName}>
          Son geçerlilik
          <Input
            className="mt-2 w-full"
            onChange={(event) => setExpiresAt(event.target.value)}
            type="datetime-local"
            value={expiresAt}
          />
        </label>
      </div>

      {createRedeemCode.error && (
        <DialogError>
          {createRedeemCode.error instanceof Error
            ? createRedeemCode.error.message
            : "Kod oluşturulamadı. Birkaç saniye sonra tekrar deneyin."}
        </DialogError>
      )}
    </DialogShell>
  )
}
