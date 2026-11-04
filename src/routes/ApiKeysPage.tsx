import { useMemo, useState } from "react"
import { KeyRound, Plus } from "lucide-react"

import { Button } from "../components/atoms/Button"
import { Card } from "../components/molecules/Card"
import { ApiKeysErrorState } from "../features/api-keys/components/ApiKeysErrorState"
import { ApiKeysFilters } from "../features/api-keys/components/ApiKeysFilters"
import { ApiKeysHeader } from "../features/api-keys/components/ApiKeysHeader"
import { ApiKeysKpiGrid } from "../features/api-keys/components/ApiKeysKpiGrid"
import { ApiKeysSkeleton } from "../features/api-keys/components/ApiKeysSkeleton"
import { ApiKeysTable } from "../features/api-keys/components/ApiKeysTable"
import { ConfirmWithPasswordDialog } from "../features/api-keys/components/ConfirmWithPasswordDialog"
import { CreateApiKeyDialog } from "../features/api-keys/components/CreateApiKeyDialog"
import { RevealSecretDialog } from "../features/api-keys/components/RevealSecretDialog"
import { useApiKeyMutations } from "../features/api-keys/hooks/useApiKeyMutations"
import { useApiKeys } from "../features/api-keys/hooks/useApiKeys"
import type {
  ApiKey,
  ApiKeyFilters,
  MintedApiKey,
} from "../features/api-keys/types"

const INITIAL_FILTERS: ApiKeyFilters = {
  search: "",
  status: "all",
  env: "all",
  scope: "all",
}

export default function ApiKeysPage() {
  const { data, error, isError, isPending } = useApiKeys()
  const { revokeApiKey, rotateApiKey } = useApiKeyMutations()

  const [filters, setFilters] = useState<ApiKeyFilters>(INITIAL_FILTERS)
  const [createOpen, setCreateOpen] = useState(false)
  const [minted, setMinted] = useState<MintedApiKey | null>(null)
  const [rotateTarget, setRotateTarget] = useState<ApiKey | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null)

  const keys = useMemo(() => data ?? [], [data])

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase()

    return keys.filter((key) => {
      if (filters.status !== "all" && key.status !== filters.status) return false
      if (filters.env !== "all" && key.env !== filters.env) return false
      if (filters.scope !== "all" && !key.scopes.includes(filters.scope)) {
        return false
      }
      if (!search) return true

      return (
        key.name.toLowerCase().includes(search) ||
        key.ownerEmail.toLowerCase().includes(search) ||
        key.keyId.includes(search)
      )
    })
  }, [filters, keys])

  async function handleRotate(consolePassword: string) {
    if (!rotateTarget) return
    try {
      const result = await rotateApiKey.mutateAsync({
        keyId: rotateTarget.keyId,
        consolePassword,
      })
      setRotateTarget(null)
      setMinted(result)
    } catch {
      // The dialog renders the error inline and stays open.
    }
  }

  async function handleRevoke(consolePassword: string) {
    if (!revokeTarget) return
    try {
      await revokeApiKey.mutateAsync({
        keyId: revokeTarget.keyId,
        consolePassword,
      })
      setRevokeTarget(null)
    } catch {
      // The dialog renders the error inline and stays open.
    }
  }

  const ready = !isPending && !isError

  // The header stays mounted across loading → loaded so the title reveals once.
  return (
    <>
      <ApiKeysHeader onCreateClick={ready ? () => setCreateOpen(true) : undefined} />

      {isPending ? (
        <ApiKeysSkeleton />
      ) : isError ? (
        <ApiKeysErrorState error={error} />
      ) : keys.length === 0 ? (
        <Card className="flex flex-col items-center px-6 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-surface-2 text-muted">
            <KeyRound aria-hidden className="size-5" />
          </span>
          <p className="mt-4 text-base font-bold text-ink">Henüz API anahtarı yok.</p>
          <p className="mt-1 max-w-md text-sm text-ink-soft">
            Bir iş ortağının Outfit Engine, Image Processing ya da Garment Taxonomy'ı
            çağırabilmesi için ilk anahtarı oluşturun.
          </p>
          <Button className="mt-5" onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden className="size-4" />
            İlk anahtarı oluştur
          </Button>
        </Card>
      ) : (
        <>
          <ApiKeysKpiGrid keys={keys} />

          <div className="space-y-4">
            <ApiKeysFilters filters={filters} onFiltersChange={setFilters} />
            <ApiKeysTable
              keys={filtered}
              onRevoke={setRevokeTarget}
              onRotate={setRotateTarget}
            />
            <div className="flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
              <p className="tabular-nums">
                {keys.length} anahtarın {filtered.length} tanesi gösteriliyor.
              </p>
              <p className="flex items-center gap-2">
                <KeyRound aria-hidden className="size-4 shrink-0" />
                Gizli anahtar yalnızca bir kez gösterilir; kaybolan anahtar kurtarılmaz, yenilenir.
              </p>
            </div>
          </div>
        </>
      )}

      <CreateApiKeyDialog
        onClose={() => setCreateOpen(false)}
        onCreated={setMinted}
        open={createOpen}
      />

      <ConfirmWithPasswordDialog
        busy={rotateApiKey.isPending}
        confirmLabel="Anahtarı yenile"
        description={
          rotateTarget
            ? `"${rotateTarget.name}" için yeni bir gizli anahtar üretilir. Eskisi kısa bir geçiş süresi boyunca çalışmaya devam eder; sahibi kesinti olmadan yenisine geçebilir.`
            : ""
        }
        error={rotateApiKey.error}
        onCancel={() => setRotateTarget(null)}
        onConfirm={handleRotate}
        open={rotateTarget !== null}
        title="API anahtarını yenile"
      />

      <ConfirmWithPasswordDialog
        busy={revokeApiKey.isPending}
        confirmLabel="Anahtarı iptal et"
        description={
          revokeTarget
            ? `"${revokeTarget.name}" bir dakika içinde çalışmayı bırakır ve yeniden açılamaz. Sahibinin yalnızca yeni bir gizli anahtara ihtiyacı varsa yenilemeyi kullanın.`
            : ""
        }
        destructive
        error={revokeApiKey.error}
        onCancel={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        open={revokeTarget !== null}
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
