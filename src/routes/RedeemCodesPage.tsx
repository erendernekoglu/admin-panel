import { useMemo, useState } from "react"
import { AlertTriangle, Loader2, Ticket } from "lucide-react"

import { Button } from "../components/atoms/Button"
import { Card } from "../components/molecules/Card"
import { AssignRedeemCodeDialog } from "../features/redeem-codes/components/AssignRedeemCodeDialog"
import { CreateRedeemCodeDialog } from "../features/redeem-codes/components/CreateRedeemCodeDialog"
import { DialogError } from "../components/molecules/Dialog"
import { DialogShell } from "../features/redeem-codes/components/DialogShell"
import { RedeemCodesErrorState } from "../features/redeem-codes/components/RedeemCodesErrorState"
import { RedeemCodesFilters } from "../features/redeem-codes/components/RedeemCodesFilters"
import { RedeemCodesHeader } from "../features/redeem-codes/components/RedeemCodesHeader"
import { RedeemCodesKpiGrid } from "../features/redeem-codes/components/RedeemCodesKpiGrid"
import { RedeemCodesSkeleton } from "../features/redeem-codes/components/RedeemCodesSkeleton"
import { RedeemCodesTable } from "../features/redeem-codes/components/RedeemCodesTable"
import { useRedeemCodeMutations } from "../features/redeem-codes/hooks/useRedeemCodeMutations"
import { useRedeemCodes } from "../features/redeem-codes/hooks/useRedeemCodes"
import type {
  RedeemCode,
  RedeemCodeFilters,
} from "../features/redeem-codes/types"
import { toDate } from "../features/shared/format"

const formatter = new Intl.NumberFormat("tr-TR")

function isExpired(code: RedeemCode) {
  const expiresAt = toDate(code.expiresAt)
  return code.status === "expired" || Boolean(expiresAt && expiresAt < new Date())
}

function matchesSearch(code: RedeemCode, search: string) {
  const query = search.trim().toLowerCase()
  if (!query) return true

  return [
    code.code,
    code.type,
    code.assignedUserId,
    code.assignedUserEmail,
    code.createdByAdminId,
  ]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(query))
}

function DisableRedeemCodeDialog({
  code,
  error,
  isPending,
  onClose,
  onConfirm,
}: {
  code: RedeemCode | null
  error: unknown
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  if (!code) return null

  return (
    <DialogShell
      description="Demo modunda kod durumu yalnızca bu tarayıcı oturumunda değişir; canlı ortamda yetkili yönetim servisi gerekir."
      footer={
        <>
          <Button disabled={isPending} onClick={onClose} variant="secondary">
            Vazgeç
          </Button>
          <Button disabled={isPending} onClick={onConfirm} variant="danger">
            {isPending ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            Devre dışı bırak
          </Button>
        </>
      }
      icon={
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
          <AlertTriangle aria-hidden="true" size={20} />
        </div>
      }
      onClose={onClose}
      title="Kodu devre dışı bırak"
      titleId="disable-redeem-code-title"
    >
      <dl className="space-y-2 rounded-xl bg-surface-2 p-4 text-sm">
        <div className="flex gap-3">
          <dt className="w-20 shrink-0 text-muted">Kod</dt>
          <dd className="font-mono font-semibold text-ink">{code.code}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-20 shrink-0 text-muted">Kullanım</dt>
          <dd className="tabular-nums text-ink">{code.usageLabel}</dd>
        </div>
      </dl>

      {error ? (
        <DialogError>
          {error instanceof Error
            ? error.message
            : "Kod devre dışı bırakılamadı. Birkaç saniye sonra tekrar deneyin."}
        </DialogError>
      ) : null}
    </DialogShell>
  )
}

export default function RedeemCodesPage() {
  const [filters, setFilters] = useState<RedeemCodeFilters>({
    search: "",
    status: "all",
    type: "all",
  })
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState<RedeemCode | null>(null)
  const [disableTarget, setDisableTarget] = useState<RedeemCode | null>(null)
  const { data, error, isError, isPending } = useRedeemCodes()
  const { disableRedeemCode } = useRedeemCodeMutations()

  const codes = useMemo(() => data ?? [], [data])

  const metrics = useMemo(() => {
    return codes.reduce(
      (acc, code) => {
        acc.totalCodes += 1
        if (code.status === "active") acc.activeCodes += 1
        if (code.status === "used") acc.usedCodes += 1
        if (isExpired(code)) acc.expiredCodes += 1
        if (code.assignedUserId || code.assignedUserEmail) {
          acc.assignedCodes += 1
        }
        return acc
      },
      {
        activeCodes: 0,
        assignedCodes: 0,
        expiredCodes: 0,
        totalCodes: 0,
        usedCodes: 0,
      },
    )
  }, [codes])

  const filteredCodes = useMemo(() => {
    return codes.filter((code) => {
      const matchesStatus =
        filters.status === "all" || code.status === filters.status
      const matchesType = filters.type === "all" || code.type === filters.type
      return matchesStatus && matchesType && matchesSearch(code, filters.search)
    })
  }, [codes, filters])

  async function handleDisableConfirm() {
    if (!disableTarget) return

    try {
      await disableRedeemCode.mutateAsync(disableTarget.id)
      setDisableTarget(null)
    } catch {
      // The service intentionally surfaces the backend TODO error in the dialog.
    }
  }

  const isEmpty = codes.length === 0

  return (
    <section className="space-y-6">
      <RedeemCodesHeader onCreateClick={() => setCreateDialogOpen(true)} />

      {isPending ? (
        <RedeemCodesSkeleton />
      ) : isError ? (
        <RedeemCodesErrorState error={error} />
      ) : isEmpty ? (
        <Card className="flex flex-col items-center px-6 py-16 text-center" tone="quiet">
          <Ticket aria-hidden="true" className="size-8 text-muted" />
          <h2 className="mt-3 text-base font-semibold text-ink">
            Henüz hediye kodu yok
          </h2>
          <p className="mt-1 max-w-md text-sm text-ink-soft">
            İlk kodu yukarıdaki “Kod oluştur” düğmesiyle ekleyin. Oluşturulan
            kodlar burada durum ve kullanım bilgileriyle listelenir.
          </p>
        </Card>
      ) : (
        <>
          <RedeemCodesKpiGrid
            activeCodes={metrics.activeCodes}
            assignedCodes={metrics.assignedCodes}
            expiredCodes={metrics.expiredCodes}
            totalCodes={metrics.totalCodes}
            usedCodes={metrics.usedCodes}
          />

          <div className="space-y-4">
            <RedeemCodesFilters
              filters={filters}
              onFiltersChange={setFilters}
              summary={
                <>
                  <span className="font-semibold tabular-nums text-ink">
                    {formatter.format(filteredCodes.length)}
                  </span>{" "}
                  / {formatter.format(codes.length)} kod
                </>
              }
            />

            <RedeemCodesTable
              codes={filteredCodes}
              onAssign={setAssignTarget}
              onDisable={(code) => {
                disableRedeemCode.reset()
                setDisableTarget(code)
              }}
            />
          </div>
        </>
      )}

      <CreateRedeemCodeDialog
        onClose={() => setCreateDialogOpen(false)}
        open={createDialogOpen}
      />
      <AssignRedeemCodeDialog
        code={assignTarget}
        onClose={() => setAssignTarget(null)}
      />
      <DisableRedeemCodeDialog
        code={disableTarget}
        error={disableRedeemCode.error}
        isPending={disableRedeemCode.isPending}
        onClose={() => setDisableTarget(null)}
        onConfirm={() => void handleDisableConfirm()}
      />
    </section>
  )
}
