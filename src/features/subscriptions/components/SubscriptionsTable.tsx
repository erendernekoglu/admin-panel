import { Search, SearchX } from "lucide-react"

import { Badge, type BadgeTone } from "../../../components/atoms/Badge/Badge"
import { Input } from "../../../components/atoms/Input"
import { Card, CardHeader } from "../../../components/molecules/Card"
import { Pagination } from "../../../components/molecules/Pagination"
import { toDate, toDateString, toDateTimeString } from "../../shared/format"
import { useClientPagination } from "../../../lib/useClientPagination"
import { cn } from "../../../lib/utils"
import type { SubscriptionRecord } from "../types"
import { Select } from "../../../components/molecules/Select"

export type SubscriptionPlanFilter = "all" | "free" | "pro" | "premium"
export type SubscriptionStatusFilter =
  | "all"
  | "active"
  | "cancelled"
  | "expired"
  | "unknown"

interface SubscriptionsTableProps {
  onPlanFilterChange: (value: SubscriptionPlanFilter) => void
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: SubscriptionStatusFilter) => void
  planFilter: SubscriptionPlanFilter
  records: SubscriptionRecord[]
  search: string
  statusFilter: SubscriptionStatusFilter
  /** Total before filtering; enables the "x / y kayıt" summary. */
  totalCount?: number
}

const planOptions: Array<{ label: string; value: SubscriptionPlanFilter }> = [
  { label: "Tüm planlar", value: "all" },
  { label: "Ücretsiz", value: "free" },
  { label: "Pro", value: "pro" },
  { label: "Premium", value: "premium" },
]

const statusOptions: Array<{ label: string; value: SubscriptionStatusFilter }> = [
  { label: "Tüm durumlar", value: "all" },
  { label: "Aktif", value: "active" },
  { label: "İptal edildi", value: "cancelled" },
  { label: "Süresi doldu", value: "expired" },
  { label: "Bilinmiyor", value: "unknown" },
]

const numberFormatter = new Intl.NumberFormat("tr-TR")
const PAGE_SIZE = 50

function getPlan(record: SubscriptionRecord): { label: string; tone: BadgeTone } {
  const value = `${record.productId} ${record.basePlanId}`.toLowerCase()
  if (value.includes("premium")) return { label: "Premium", tone: "ink" }
  if (value.includes("pro")) return { label: "Pro", tone: "accent" }
  if (value.includes("free")) return { label: "Ücretsiz", tone: "neutral" }
  return {
    label: record.basePlanId || record.productId || "Bilinmiyor",
    tone: "neutral",
  }
}

/** Display-only status, mirroring how the page groups records for filtering. */
function getStatus(record: SubscriptionRecord): { label: string; tone: BadgeTone } {
  const status = record.status.toLowerCase()
  const expiryDate = toDate(record.expiryTime)
  const isExpired = expiryDate ? expiryDate.getTime() < Date.now() : false

  if (record.isActive && !isExpired && !record.wasRevoked) {
    return { label: "Aktif", tone: "success" }
  }
  if (record.wasRevoked) return { label: "Geri alındı", tone: "danger" }
  if (status.includes("cancel")) return { label: "İptal edildi", tone: "warning" }
  if (status.includes("expire") || isExpired) {
    return { label: "Süresi doldu", tone: "neutral" }
  }
  return { label: record.status || "Bilinmiyor", tone: "neutral" }
}

function formatPrice(record: SubscriptionRecord) {
  if (typeof record.price !== "number") return "—"
  const currency = record.currency || "USD"
  return new Intl.NumberFormat("tr-TR", {
    currency,
    style: "currency",
  }).format(record.price)
}

function getProvider(record: SubscriptionRecord) {
  return record.platform || record.provider || "—"
}

const columns: Array<{ label: string; numeric?: boolean }> = [
  { label: "Kullanıcı" },
  { label: "Plan" },
  { label: "Durum" },
  { label: "Platform / sağlayıcı" },
  { label: "Başlangıç" },
  { label: "Yenileme / bitiş" },
  { label: "Fiyat", numeric: true },
  { label: "Son güncelleme" },
]

export function SubscriptionsTable({
  onPlanFilterChange,
  onSearchChange,
  onStatusFilterChange,
  planFilter,
  records,
  search,
  statusFilter,
  totalCount,
}: SubscriptionsTableProps) {
  const pagination = useClientPagination(records, PAGE_SIZE)

  return (
    <Card className="overflow-hidden">
      <div className="space-y-4 p-5 sm:p-6">
        <CardHeader
          description="Abonelik kayıtlarının salt okunur görünümü."
          title="Son abonelik kayıtları"
        />
        <div
          aria-label="Abonelik filtreleri"
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
          role="search"
        >
          <div className="relative w-full sm:max-w-sm sm:flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
            />
            <Input
              aria-label="Aboneliklerde ara"
              className="w-full pl-10"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Kullanıcı ID, e-posta veya ad ara"
              type="search"
              value={search}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Select
              aria-label="Plan"
              onChange={(event) =>
                onPlanFilterChange(event.target.value as SubscriptionPlanFilter)
              }
              value={planFilter}
            >
              {planOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Durum"
              onChange={(event) =>
                onStatusFilterChange(
                  event.target.value as SubscriptionStatusFilter,
                )
              }
              value={statusFilter}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          {typeof totalCount === "number" ? (
            <p aria-live="polite" className="text-sm text-muted sm:ml-auto">
              <span className="font-semibold tabular-nums text-ink">
                {numberFormatter.format(records.length)}
              </span>{" "}
              / {numberFormatter.format(totalCount)} kayıt
            </p>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse text-left">
          <thead className="bg-surface-2">
            <tr>
              {columns.map((column) => (
                <th
                  className={cn(
                    "px-4 py-3 text-xs font-semibold whitespace-nowrap text-muted",
                    column.numeric && "text-right",
                  )}
                  key={column.label}
                  scope="col"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagination.pageItems.map((record) => {
              const plan = getPlan(record)
              const status = getStatus(record)
              return (
                <tr
                  className="border-t border-line align-top transition-colors hover:bg-surface-2/60"
                  key={record.purchaseToken}
                >
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-ink">
                      {record.displayName || record.email || "Bilinmeyen kullanıcı"}
                    </p>
                    <p className="mt-0.5 max-w-[220px] truncate font-mono text-xs text-muted">
                      {record.userId || "—"}
                    </p>
                    {record.email ? (
                      <p className="mt-0.5 max-w-[220px] truncate text-xs text-ink-soft">
                        {record.email}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge tone={plan.tone}>{plan.label}</Badge>
                    <p className="mt-1.5 max-w-[180px] truncate font-mono text-xs text-muted">
                      {record.basePlanId || record.productId || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span title={record.status || undefined}>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-ink-soft">
                    {getProvider(record)}
                  </td>
                  <td className="px-4 py-3.5 text-sm whitespace-nowrap tabular-nums text-ink-soft">
                    {toDateString(record.startedAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm whitespace-nowrap tabular-nums text-ink-soft">
                      {toDateString(record.expiryTime)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {record.autoRenewing
                        ? "Otomatik yenilenir"
                        : "Otomatik yenilenmez"}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm whitespace-nowrap tabular-nums text-ink">
                    {formatPrice(record)}
                  </td>
                  <td className="px-4 py-3.5 text-sm whitespace-nowrap tabular-nums text-ink-soft">
                    {toDateTimeString(record.updatedAt)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {pagination.isPaginated ? (
        <div className="border-t border-line px-5 py-4">
          <Pagination
            hasNext={pagination.hasNext}
            hasPrevious={pagination.hasPrevious}
            onNext={pagination.goNext}
            onPrevious={pagination.goPrevious}
            page={pagination.page + 1}
            pageCount={pagination.pageCount}
            summary={`${numberFormatter.format(pagination.start + 1)}–${numberFormatter.format(pagination.start + pagination.pageItems.length)} / ${numberFormatter.format(records.length)} kayıt`}
          />
        </div>
      ) : null}

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 border-t border-line px-6 py-14 text-center">
          <SearchX aria-hidden="true" className="size-7 text-muted" />
          <p className="text-sm font-semibold text-ink">
            Bu filtrelere uyan abonelik kaydı yok.
          </p>
          <p className="max-w-md text-sm text-muted">
            Aramayı temizleyin ya da filtreleri “Tüm planlar” ve “Tüm
            durumlar” olarak değiştirin.
          </p>
        </div>
      ) : null}
    </Card>
  )
}
