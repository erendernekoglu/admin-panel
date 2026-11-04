import type { ReactNode } from "react"
import { Search } from "lucide-react"

import { Input } from "../../../components/atoms/Input"
import type {
  RedeemCodeFilters,
  RedeemCodeStatus,
  RedeemCodeType,
} from "../types"
import {
  redeemCodeStatusLabels,
  redeemCodeTypeLabels,
} from "../labels"
import { Select } from "../../../components/molecules/Select"

interface RedeemCodesFiltersProps {
  filters: RedeemCodeFilters
  onFiltersChange: (filters: RedeemCodeFilters) => void
  /** Optional summary shown at the end of the toolbar, e.g. result count. */
  summary?: ReactNode
}

const statusOrder: RedeemCodeStatus[] = ["active", "used", "expired", "disabled"]
const typeOrder: RedeemCodeType[] = [
  "credit",
  "subscription",
  "discount",
  "wardrobe",
  "custom",
]

export function RedeemCodesFilters({
  filters,
  onFiltersChange,
  summary,
}: RedeemCodesFiltersProps) {
  return (
    <div
      aria-label="Hediye kodu filtreleri"
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
      role="search"
    >
      <div className="relative w-full sm:max-w-sm sm:flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
        />
        <Input
          aria-label="Hediye kodlarında ara"
          className="w-full pl-10"
          onChange={(event) =>
            onFiltersChange({ ...filters, search: event.target.value })
          }
          placeholder="Kod, kullanıcı veya tür ara"
          type="search"
          value={filters.search}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          aria-label="Durum"
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              status: event.target.value as RedeemCodeStatus | "all",
            })
          }
          value={filters.status}
        >
          <option value="all">Tüm durumlar</option>
          {statusOrder.map((status) => (
            <option key={status} value={status}>
              {redeemCodeStatusLabels[status]}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Tür"
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              type: event.target.value as RedeemCodeType | "all",
            })
          }
          value={filters.type}
        >
          <option value="all">Tüm türler</option>
          {typeOrder.map((type) => (
            <option key={type} value={type}>
              {redeemCodeTypeLabels[type]}
            </option>
          ))}
        </Select>
      </div>

      {summary ? (
        <p aria-live="polite" className="text-sm text-muted sm:ml-auto">
          {summary}
        </p>
      ) : null}
    </div>
  )
}
