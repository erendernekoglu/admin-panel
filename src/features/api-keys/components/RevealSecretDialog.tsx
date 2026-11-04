import { useState } from "react"
import { Check, Copy, ShieldAlert } from "lucide-react"

import { Button } from "../../../components/atoms/Button"
import { isDemoMode } from "../../../lib/config"
import type { MintedApiKey } from "../types"
import { Dialog, DialogFooter, DialogHeader } from "../../../components/molecules/Dialog"

interface RevealSecretDialogProps {
  minted: MintedApiKey | null
  onClose: () => void
}

/**
 * The only screen that ever shows a secret.
 *
 * The backend stores a digest, so closing this dialog puts the key beyond
 * recovery — deliberately. Copying is offered, dismissing takes a second
 * confirmation, and the plaintext leaves with the component.
 */
export function RevealSecretDialog({
  minted,
  onClose,
}: RevealSecretDialogProps) {
  const [copied, setCopied] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)

  if (!minted) return null

  async function handleCopy() {
    if (!minted) return
    try {
      await navigator.clipboard.writeText(minted.plaintext)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard permission can be denied; the value stays selectable on screen.
    }
  }

  const graceEnds = minted.graceEndsAt
    ? new Date(minted.graceEndsAt).toLocaleString("tr-TR")
    : null

  // No onClose on the Dialog: Escape must not dismiss a secret that has not been stored.
  return (
    <Dialog labelledBy="reveal-secret-title">
      <DialogHeader
        description="Şimdi kopyalayın; bu anahtar bir daha gösterilmeyecek."
        id="reveal-secret-title"
      >
        {minted.previousKeyId ? "Anahtar yenilendi" : "Anahtar oluşturuldu"}
      </DialogHeader>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        <div className="rounded-xl border border-line-strong bg-surface-2 p-3 sm:p-4">
          <p className="break-all font-mono text-sm leading-relaxed text-ink select-all">
            {minted.plaintext}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
            <span aria-live="polite" className="text-xs font-medium text-muted">
              {copied ? (
                <span className="inline-flex animate-pop-in items-center gap-1.5 text-success">
                  <Check aria-hidden className="size-3.5" />
                  Panoya kopyalandı
                </span>
              ) : (
                "Değeri seçip kopyalayabilir ya da düğmeyi kullanabilirsiniz."
              )}
            </span>
            <Button onClick={handleCopy} size="sm" variant="secondary">
              <Copy aria-hidden className="size-3.5" />
              Anahtarı kopyala
            </Button>
          </div>
        </div>

        <div className="flex gap-2.5 rounded-xl bg-danger-soft px-3.5 py-3 text-sm leading-relaxed text-danger">
          <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            Bu anahtarın yalnızca özeti saklanır. Kaybolursa kurtarılamaz, yenilenmesi
            gerekir. Alıcıya güvendiği bir kanaldan gönderin; e-posta ya da sohbette düz
            metin olarak paylaşmayın.
          </span>
        </div>

        {minted.previousKeyId && (
          isDemoMode ? (
            <p className="rounded-xl bg-warning-soft px-3.5 py-3 text-sm leading-relaxed text-warning">
              Demo modunda önceki örnek anahtar (
              <span className="font-semibold">{minted.previousKeyId}</span>) hemen devre
              dışı bırakıldı; geçiş süresi uygulanmaz. Bu yalnızca yerel sentetik veriyi
              etkiler.
            </p>
          ) : (
            <p className="rounded-xl bg-warning-soft px-3.5 py-3 text-sm leading-relaxed text-warning">
              Önceki anahtar (<span className="font-semibold">{minted.previousKeyId}</span>){" "}
              {graceEnds ? `${graceEnds} tarihine kadar` : "geçiş süresi bitene kadar"}{" "}
              çalışmaya devam eder; sahibi kesinti olmadan yenisine geçebilir.
            </p>
          )
        )}

        {!minted.consolePasswordEnforced && (
          <p className="rounded-xl bg-warning-soft px-3.5 py-3 text-sm leading-relaxed text-warning">
            Sunucuda konsol şifresi tanımlı olmadığı için bu kontrol atlandı. Zorunlu
            kılmak için yönetici konsolu şifresi sunucu tarafında yapılandırılmalıdır.
          </p>
        )}

        <label className="flex min-h-6 cursor-pointer items-start gap-3 text-sm font-medium text-ink">
          <input
            checked={acknowledged}
            className="mt-0.5 size-4 shrink-0"
            onChange={(event) => setAcknowledged(event.target.checked)}
            type="checkbox"
          />
          Bu anahtarı güvenli bir yere kaydettim.
        </label>
      </div>

      <DialogFooter>
        <Button disabled={!acknowledged} onClick={onClose}>
          Kaydettim, kapat
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
