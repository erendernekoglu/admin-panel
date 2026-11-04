import { Search } from "lucide-react"

import { Input } from "../../../components/atoms/Input"
import type { AuditActionType, AuditLogFilters, AuditLogStatus } from "../types"
import { AUDIT_ACTION_LABELS, AUDIT_STATUS_LABELS } from "../labels"
import { Select } from "../../../components/molecules/Select"

interface AuditLogsFiltersProps {
  filters: AuditLogFilters
  onFiltersChange: (filters: AuditLogFilters) => void
  targetTypes: string[]
}

// Copies the Input atom (DESIGN.md: selects copy its classes).
const ACTION_TYPES = Object.keys(AUDIT_ACTION_LABELS) as AuditActionType[]
const STATUSES = Object.keys(AUDIT_STATUS_LABELS) as AuditLogStatus[]

export function AuditLogsFilters({
  filters,
  onFiltersChange,
  targetTypes,
}: AuditLogsFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:flex lg:items-center">
      <label className="relative sm:col-span-3 lg:flex-1">
        <span className="sr-only">Denetim kayıtlarında ara</span>
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
        />
        <Input
          className="w-full pl-10"
          onChange={(event) =>
            onFiltersChange({ ...filters, search: event.target.value })
          }
          placeholder="Yönetici, işlem, hedef türü ya da hedef kimliğiyle ara"
          type="search"
          value={filters.search}
        />
      </label>

      <Select
        aria-label="İşlem türü"
        className="w-full lg:w-auto"
        onChange={(event) =>
          onFiltersChange({
            ...filters,
            actionType: event.target.value as AuditActionType | "all",
          })
        }
        value={filters.actionType}
      >
        <option value="all">Tüm işlem türleri</option>
        {ACTION_TYPES.map((type) => (
          <option key={type} value={type}>
            {AUDIT_ACTION_LABELS[type]}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Durum"
        className="w-full lg:w-auto"
        onChange={(event) =>
          onFiltersChange({
            ...filters,
            status: event.target.value as AuditLogStatus | "all",
          })
        }
        value={filters.status}
      >
        <option value="all">Tüm durumlar</option>
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {AUDIT_STATUS_LABELS[status]}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Hedef türü"
        className="w-full lg:w-auto"
        onChange={(event) =>
          onFiltersChange({
            ...filters,
            targetType: event.target.value,
          })
        }
        value={filters.targetType}
      >
        <option value="all">Tüm hedefler</option>
        {targetTypes.map((targetType) => (
          <option key={targetType} value={targetType}>
            {targetType}
          </option>
        ))}
      </Select>
    </div>
  )
}
