import { Search, SearchX } from "lucide-react"

import { Badge, type BadgeTone } from "../../../components/atoms/Badge/Badge"
import { Input } from "../../../components/atoms/Input"
import { Card, CardHeader } from "../../../components/molecules/Card"
import {
  getOperationLabel,
  isCreditLoad,
  isCreditSpend,
} from "../../../lib/credits/creditUtils"
import { toDateTimeString } from "../../shared/format"
import { cn } from "../../../lib/utils"
import type { CreditTransaction } from "../types"
import { Select } from "../../../components/molecules/Select"

export type CreditTypeFilter = "all" | "load" | "spend" | "other"

interface CreditTransactionsTableProps {
  transactions: CreditTransaction[]
  search: string
  typeFilter: CreditTypeFilter
  onSearchChange: (value: string) => void
  onTypeFilterChange: (value: CreditTypeFilter) => void
  /** Total before filtering; enables the "x / y işlem" summary. */
  totalCount?: number
}

const typeOptions: Array<{ label: string; value: CreditTypeFilter }> = [
  { label: "Tüm hareketler", value: "all" },
  { label: "Yüklemeler", value: "load" },
  { label: "Harcamalar", value: "spend" },
  { label: "İade ve diğer", value: "other" },
]

const typeLabels: Record<string, string> = {
  spend: "Harcama",
  purchase: "Satın alma",
  renewal: "Yenileme",
  manual_add: "Elle ekleme",
  manual_remove: "Elle düşme",
  signup_bonus: "Kayıt bonusu",
  revoke: "Geri alma",
  refund: "İade",
}

const numberFormatter = new Intl.NumberFormat("tr-TR")

function getTypeBadge(transaction: CreditTransaction): {
  label: string
  tone: BadgeTone
} {
  const type = transaction.type.toLowerCase()
  const label = typeLabels[type] ?? transaction.type
  if (["refund", "revoke"].includes(type)) return { label, tone: "warning" }
  if (isCreditLoad(type, transaction.amount)) return { label, tone: "success" }
  if (isCreditSpend(type, transaction.amount)) return { label, tone: "neutral" }
  return { label, tone: "neutral" }
}

function getUserLabel(transaction: CreditTransaction) {
  return (
    transaction.displayName ||
    getDetailString(transaction, "email") ||
    transaction.userId ||
    "Bilinmeyen kullanıcı"
  )
}

function getDetailString(transaction: CreditTransaction, key: string) {
  const value = transaction.details?.[key]
  return typeof value === "string" && value.trim() ? value : undefined
}

function getSource(transaction: CreditTransaction) {
  if (transaction.reason) return transaction.reason
  if (transaction.operation) return getOperationLabel(transaction.operation)
  return getDetailString(transaction, "source") ?? "—"
}

function getStatus(transaction: CreditTransaction) {
  return (
    getDetailString(transaction, "status") ??
    getDetailString(transaction, "state") ??
    "—"
  )
}

function formatAmount(amount: number) {
  return `${amount > 0 ? "+" : ""}${numberFormatter.format(amount)}`
}

const columns: Array<{ label: string; numeric?: boolean }> = [
  { label: "Kullanıcı" },
  { label: "Tür" },
  { label: "Miktar", numeric: true },
  { label: "Kaynak / neden" },
  { label: "Tarih" },
  { label: "Durum" },
]

export function CreditTransactionsTable({
  transactions,
  search,
  typeFilter,
  onSearchChange,
  onTypeFilterChange,
  totalCount,
}: CreditTransactionsTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="space-y-4 p-5 sm:p-6">
        <CardHeader
          description="Yalnızca yönetici özetindeki alanlar gösterilir; özel profil ayrıntıları bu listede yer almaz."
          title="Son kredi hareketleri"
        />
        <div
          aria-label="Kredi hareketi filtreleri"
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
          role="search"
        >
          <div className="relative w-full sm:max-w-sm sm:flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
            />
            <Input
              aria-label="Kredi hareketlerinde ara"
              className="w-full pl-10"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Kullanıcı ID, ad veya e-posta ara"
              type="search"
              value={search}
            />
          </div>
          <Select
            aria-label="Hareket türü"
            onChange={(event) =>
              onTypeFilterChange(event.target.value as CreditTypeFilter)
            }
            value={typeFilter}
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {typeof totalCount === "number" ? (
            <p aria-live="polite" className="text-sm text-muted sm:ml-auto">
              <span className="font-semibold tabular-nums text-ink">
                {numberFormatter.format(transactions.length)}
              </span>{" "}
              / {numberFormatter.format(totalCount)} işlem
            </p>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left">
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
            {transactions.map((transaction) => {
              const badge = getTypeBadge(transaction)
              const email = getDetailString(transaction, "email")
              return (
                <tr
                  className="border-t border-line align-top transition-colors hover:bg-surface-2/60"
                  key={transaction.id}
                >
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-ink">
                      {getUserLabel(transaction)}
                    </p>
                    <p className="mt-0.5 max-w-[220px] truncate font-mono text-xs text-muted">
                      {transaction.userId || "—"}
                    </p>
                    {email ? (
                      <p className="mt-0.5 max-w-[220px] truncate text-xs text-ink-soft">
                        {email}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        transaction.amount >= 0 ? "text-success" : "text-danger",
                      )}
                    >
                      {formatAmount(transaction.amount)}
                    </span>
                  </td>
                  <td className="max-w-[260px] px-4 py-3.5 text-sm text-ink-soft">
                    {getSource(transaction)}
                  </td>
                  <td className="px-4 py-3.5 text-sm whitespace-nowrap tabular-nums text-ink-soft">
                    {toDateTimeString(transaction.createdAt)}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-ink-soft">
                    {getStatus(transaction)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 border-t border-line px-6 py-14 text-center">
          <SearchX aria-hidden="true" className="size-7 text-muted" />
          <p className="text-sm font-semibold text-ink">
            Bu filtrelere uyan kredi hareketi yok.
          </p>
          <p className="max-w-md text-sm text-muted">
            Aramayı temizleyin ya da hareket türünü “Tüm hareketler” yapın.
          </p>
        </div>
      ) : null}
    </Card>
  )
}
