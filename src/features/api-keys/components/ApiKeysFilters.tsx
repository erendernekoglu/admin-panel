import { Search } from "lucide-react"

import { Input } from "../../../components/atoms/Input"
import { API_SCOPES, type ApiKeyFilters } from "../types"
import { Select } from "../../../components/molecules/Select"

interface ApiKeysFiltersProps {
  filters: ApiKeyFilters
  onFiltersChange: (filters: ApiKeyFilters) => void
}

export function ApiKeysFilters({
  filters,
  onFiltersChange,
}: ApiKeysFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:flex lg:items-center">
      <label className="relative sm:col-span-3 lg:flex-1">
        <span className="sr-only">Anahtarlarda ara</span>
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
        />
        <Input
          className="w-full pl-10"
          onChange={(event) =>
            onFiltersChange({ ...filters, search: event.target.value })
          }
          placeholder="Ad, sahip ya da anahtar kimliğiyle ara"
          type="search"
          value={filters.search}
        />
      </label>

      <Select
        aria-label="Durum"
        className="w-full lg:w-auto"
        onChange={(event) =>
          onFiltersChange({
            ...filters,
            status: event.target.value as ApiKeyFilters["status"],
          })
        }
        value={filters.status}
      >
        <option value="all">Tüm durumlar</option>
        <option value="active">Etkin</option>
        <option value="disabled">Devre dışı</option>
        <option value="revoked">İptal edildi</option>
      </Select>

      <Select
        aria-label="Ortam"
        className="w-full lg:w-auto"
        onChange={(event) =>
          onFiltersChange({
            ...filters,
            env: event.target.value as ApiKeyFilters["env"],
          })
        }
        value={filters.env}
      >
        <option value="all">Tüm ortamlar</option>
        <option value="live">Canlı</option>
        <option value="test">Test</option>
      </Select>

      <Select
        aria-label="İzin"
        className="w-full lg:w-auto"
        onChange={(event) =>
          onFiltersChange({
            ...filters,
            scope: event.target.value as ApiKeyFilters["scope"],
          })
        }
        value={filters.scope}
      >
        <option value="all">Tüm izinler</option>
        {API_SCOPES.map((scope) => (
          <option key={scope} value={scope}>
            {scope}
          </option>
        ))}
      </Select>
    </div>
  )
}
