import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Ban, Check, Loader2, RefreshCw, Save } from "lucide-react"
import { Link, useParams } from "react-router"

import { Button } from "../components/atoms/Button"
import { Card, CardHeader } from "../components/molecules/Card"
import { PageHeader } from "../components/molecules/PageHeader"
import { toDateTimeString } from "../features/shared/format"
import { cn } from "../lib/utils"
import {
  ApiKeyEnvBadge,
  ApiKeyStatusBadge,
} from "../features/api-keys/components/ApiKeyStatusBadge"
import { ApiKeysErrorState } from "../features/api-keys/components/ApiKeysErrorState"
import { ConfirmWithPasswordDialog } from "../features/api-keys/components/ConfirmWithPasswordDialog"
import { labelClass, textareaClass } from "../features/api-keys/components/fieldClasses"
import { RevealSecretDialog } from "../features/api-keys/components/RevealSecretDialog"
import { ServiceConfigEditor } from "../features/api-keys/components/ServiceConfigEditor"
import { useApiKeyMutations } from "../features/api-keys/hooks/useApiKeyMutations"
import { useApiKey, useApiKeyUsage } from "../features/api-keys/hooks/useApiKeys"
import {
  DEFAULT_SERVICES,
  SERVICE_LABELS,
  type ApiKeyServices,
  type ApiScope,
  type MintedApiKey,
  type ServiceId,
} from "../features/api-keys/types"

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

function isoDaysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
}

const SERVICE_IDS: ServiceId[] = ["outfitEngine", "imageProcessing", "taxonomy"]

function UsagePanel({ keyId }: { keyId: string }) {
  const startDate = isoDaysAgo(29)
  const endDate = isoDaysAgo(0)
  const { data, isError, isPending } = useApiKeyUsage(keyId, startDate, endDate)

  const totals = useMemo(() => {
    const days = data ?? []
    const perService = SERVICE_IDS.map((id) => ({
      id,
      total: days.reduce((sum, day) => sum + (day.byService?.[id] ?? 0), 0),
    }))

    return {
      grand: days.reduce((sum, day) => sum + day.total, 0),
      perService,
      busiest: [...days].sort((a, b) => b.total - a.total)[0] ?? null,
    }
  }, [data])

  return (
    <Card className="p-5 sm:p-6" tone="quiet">
      <CardHeader
        description="Son 30 gün, UTC. Sayaçlar belirli aralıklarla yazıldığı için bugünün değeri canlı trafiğin biraz gerisinde kalır."
        title="Kullanım"
      />

      {isPending && (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted" role="status">
          <Loader2 aria-hidden className="size-4 animate-spin" />
          Kullanım yükleniyor…
        </p>
      )}

      {isError && (
        <p className="mt-4 text-sm text-ink-soft">
          Kullanım verisi yüklenemedi. Biraz sonra sayfayı yenileyip tekrar deneyin.
        </p>
      )}

      {!isPending && !isError && (
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-5">
          <div>
            <dt className="text-xs font-medium text-muted">Toplam istek</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums text-ink">
              {totals.grand.toLocaleString("tr-TR")}
            </dd>
          </div>
          {totals.perService.map((entry) => (
            <div key={entry.id}>
              <dt className="text-xs font-medium text-muted">{SERVICE_LABELS[entry.id]}</dt>
              <dd className="mt-1 text-2xl font-bold tabular-nums text-ink">
                {entry.total.toLocaleString("tr-TR")}
              </dd>
            </div>
          ))}
          {totals.busiest && (
            <div>
              <dt className="text-xs font-medium text-muted">En yoğun gün</dt>
              <dd className="mt-1 text-sm font-semibold tabular-nums text-ink">
                {totals.busiest.date}
                <span className="block text-xs font-medium text-muted">
                  {totals.busiest.total.toLocaleString("tr-TR")} istek
                </span>
              </dd>
            </div>
          )}
        </dl>
      )}
    </Card>
  )
}

function BackLink() {
  return (
    <Link
      className="inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-ink-soft transition-colors hover:text-accent"
      to="/api-keys"
    >
      <ArrowLeft aria-hidden className="size-4" />
      API anahtarları
    </Link>
  )
}

export default function ApiKeyDetailPage() {
  const { keyId } = useParams<{ keyId: string }>()
  const { data, error, isError, isPending } = useApiKey(keyId)
  const { revokeApiKey, rotateApiKey, updateApiKey } = useApiKeyMutations()

  const [scopes, setScopes] = useState<ApiScope[]>([])
  const [services, setServices] = useState<ApiKeyServices>(DEFAULT_SERVICES)
  const [notes, setNotes] = useState("")
  const [minted, setMinted] = useState<MintedApiKey | null>(null)
  const [rotateOpen, setRotateOpen] = useState(false)
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  // Re-seed the form whenever the server view changes, including after a save.
  useEffect(() => {
    if (!data) return
    setScopes(data.scopes)
    setServices(data.services ?? DEFAULT_SERVICES)
    setNotes(data.notes ?? "")
  }, [data])

  if (isPending || isError) {
    return (
      <>
        <PageHeader
          context={<BackLink />}
          description={isPending ? "Anahtar bilgileri yükleniyor." : undefined}
          title="API anahtarı"
        />
        {isPending ? (
          <div aria-busy="true" className="space-y-6" role="status">
            <div className="h-48 animate-pulse rounded-2xl bg-surface-2" />
            <div className="h-32 animate-pulse rounded-2xl bg-surface-2" />
            <div className="h-96 animate-pulse rounded-2xl bg-surface-2" />
          </div>
        ) : (
          <ApiKeysErrorState error={error} title="Bu API anahtarı yüklenemedi." />
        )}
      </>
    )
  }

  const readOnly = data.status === "revoked"
  const dirty =
    JSON.stringify({ scopes: [...scopes].sort(), services, notes }) !==
    JSON.stringify({
      scopes: [...data.scopes].sort(),
      services: data.services ?? DEFAULT_SERVICES,
      notes: data.notes ?? "",
    })

  async function handleSave() {
    if (!keyId) return
    try {
      await updateApiKey.mutateAsync({ keyId, scopes, services, notes })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 3000)
    } catch {
      // The inline banner below shows the error.
    }
  }

  async function handleRotate(consolePassword: string) {
    if (!keyId) return
    try {
      const result = await rotateApiKey.mutateAsync({ keyId, consolePassword })
      setRotateOpen(false)
      setMinted(result)
    } catch {
      // The dialog keeps the error visible.
    }
  }

  async function handleRevoke(consolePassword: string) {
    if (!keyId) return
    try {
      await revokeApiKey.mutateAsync({ keyId, consolePassword })
      setRevokeOpen(false)
    } catch {
      // The dialog keeps the error visible.
    }
  }

  return (
    <>
      <PageHeader
        actions={
          <>
            <Button disabled={readOnly} onClick={() => setRotateOpen(true)} variant="secondary">
              <RefreshCw aria-hidden className="size-4" />
              Anahtarı yenile
            </Button>
            <Button disabled={readOnly} onClick={() => setRevokeOpen(true)} variant="danger">
              <Ban aria-hidden className="size-4" />
              İptal et
            </Button>
          </>
        }
        context={<BackLink />}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <ApiKeyEnvBadge env={data.env} />
            <ApiKeyStatusBadge status={data.status} />
            <span className="font-mono text-sm text-ink-soft">
              {data.displayPrefix}_…{data.lastFour}
            </span>
          </span>
        }
        title={data.name}
      />

      {readOnly && (
        <p className="rounded-2xl border border-danger/25 bg-danger-soft px-5 py-4 text-sm font-medium text-danger">
          Bu anahtar iptal edildi. Denetim kaydı için saklanıyor; düzenlenemez ve yeniden
          etkinleştirilemez. Sahibine yeni bir anahtar oluşturabilirsiniz.
        </p>
      )}

      <Card className="p-5 sm:p-6">
        <CardHeader title="Anahtar bilgileri" />
        <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Anahtar kimliği" value={<span className="font-mono text-[13px]">{data.keyId}</span>} />
          <Field label="Sahip" value={data.ownerEmail} />
          <Field label="Oluşturulma" value={<span className="tabular-nums">{toDateTimeString(data.createdAt)}</span>} />
          <Field label="Bitiş" value={<span className="tabular-nums">{toDateTimeString(data.expiresAt)}</span>} />
          <Field label="Son kullanım" value={<span className="tabular-nums">{toDateTimeString(data.lastUsedAt)}</span>} />
          <Field label="Son kullanılan servis" value={data.lastUsedService || "—"} />
          <Field
            label="Yenilendiği anahtar"
            value={data.rotatedFrom ? <span className="font-mono text-[13px]">{data.rotatedFrom}</span> : "—"}
          />
          <Field
            label="Yerine gelen anahtar"
            value={data.rotatedTo ? <span className="font-mono text-[13px]">{data.rotatedTo}</span> : "—"}
          />
          <div className="sm:col-span-2 xl:col-span-4">
            <Field
              label="İzin verilen kökenler"
              value={
                data.allowedOrigins.length
                  ? data.allowedOrigins.join(", ")
                  : "Yalnızca sunucudan sunucuya"
              }
            />
          </div>
        </dl>
      </Card>

      <UsagePanel keyId={data.keyId} />

      <Card className="p-5 sm:p-6">
        <CardHeader
          actions={
            <div className="flex shrink-0 items-center gap-3">
              {saved && (
                <span
                  className="inline-flex animate-pop-in items-center gap-1.5 text-sm font-semibold text-success"
                  role="status"
                >
                  <Check aria-hidden className="size-4" />
                  Kaydedildi
                </span>
              )}
              <Button
                disabled={!dirty || readOnly || updateApiKey.isPending}
                onClick={handleSave}
                variant="accent"
              >
                {updateApiKey.isPending ? (
                  <Loader2 aria-hidden className="size-4 animate-spin" />
                ) : (
                  <Save aria-hidden className="size-4" />
                )}
                Değişiklikleri kaydet
              </Button>
            </div>
          }
          className="flex-col sm:flex-row"
          description="Değişiklikler, servislerin anahtar önbelleği yenilendiğinde, yaklaşık bir dakika içinde geçerli olur."
          title="Servis erişimi ve ayarlar"
        />

        {updateApiKey.error && (
          <p
            className="mt-4 animate-pop-in rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger"
            role="alert"
          >
            {updateApiKey.error instanceof Error
              ? updateApiKey.error.message
              : "Değişiklikler kaydedilemedi. Tekrar deneyin."}
          </p>
        )}

        <fieldset
          className={cn("mt-6 min-w-0", readOnly && "opacity-60")}
          disabled={readOnly}
        >
          <ServiceConfigEditor
            onScopesChange={setScopes}
            onServicesChange={setServices}
            scopes={scopes}
            services={services}
          />

          <label className={cn(labelClass, "mt-5")}>
            Notlar
            <textarea
              className={cn(textareaClass, "mt-2 w-full")}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Bu anahtarı kim, neden istedi?"
              rows={3}
              value={notes}
            />
          </label>
        </fieldset>
      </Card>

      <ConfirmWithPasswordDialog
        busy={rotateApiKey.isPending}
        confirmLabel="Anahtarı yenile"
        description={`"${data.name}" için yeni bir gizli anahtar üretilir. Eskisi kısa bir geçiş süresi boyunca çalışmaya devam eder; sahibi kesinti olmadan yenisine geçebilir.`}
        error={rotateApiKey.error}
        onCancel={() => setRotateOpen(false)}
        onConfirm={handleRotate}
        open={rotateOpen}
        title="API anahtarını yenile"
      />

      <ConfirmWithPasswordDialog
        busy={revokeApiKey.isPending}
        confirmLabel="Anahtarı iptal et"
        description={`"${data.name}" bir dakika içinde çalışmayı bırakır ve yeniden açılamaz. Sahibinin yalnızca yeni bir gizli anahtara ihtiyacı varsa yenilemeyi kullanın.`}
        destructive
        error={revokeApiKey.error}
        onCancel={() => setRevokeOpen(false)}
        onConfirm={handleRevoke}
        open={revokeOpen}
        title="API anahtarını iptal et"
      />

      {/* Keyed by key id so the "I stored it" checkbox starts unticked for every new secret. */}
      <RevealSecretDialog
        key={minted?.keyId ?? "none"}
        minted={minted}
        onClose={() => setMinted(null)}
      />
    </>
  )
}
