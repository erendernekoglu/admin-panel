import type { ReactNode } from "react"
import { Search } from "lucide-react"

import { Input } from "../../../components/atoms/Input"
import type { UserListFilter, UserPlatformFilter } from "../services/userService"
import { Select } from "../../../components/molecules/Select"

export type UserFilterValue = UserListFilter

export type PlatformFilterValue = UserPlatformFilter

/** Mirrors the Input atom so native selects sit in the same toolbar. */
interface UserFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  userFilter: UserFilterValue
  onUserFilterChange: (value: UserFilterValue) => void
  platformFilter: PlatformFilterValue
  onPlatformFilterChange: (value: PlatformFilterValue) => void
  showPlatformFilter: boolean
  /** Optional summary shown at the end of the toolbar, e.g. result count. */
  summary?: ReactNode
}

export function UserFilters({
  onPlatformFilterChange,
  onSearchChange,
  onUserFilterChange,
  platformFilter,
  search,
  showPlatformFilter,
  summary,
  userFilter,
}: UserFiltersProps) {
  return (
    <div
      aria-label="Kullanıcı filtreleri"
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
      role="search"
    >
      <div className="relative w-full sm:max-w-sm sm:flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
        />
        <Input
          aria-label="Kullanıcı ara"
          className="w-full pl-10"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="E-posta, ad veya kullanıcı ID ile ara"
          type="search"
          value={search}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          aria-label="Kullanıcı türü"
          onChange={(event) =>
            onUserFilterChange(event.target.value as UserFilterValue)
          }
          value={userFilter}
        >
          <option value="all">Tüm kullanıcılar</option>
          <option value="free">Ücretsiz plan</option>
          <option value="pro">Pro plan</option>
          <option value="premium">Premium plan</option>
          <option value="test">Test kullanıcıları</option>
          <option value="admin">Yöneticiler</option>
        </Select>

        {showPlatformFilter && (
          <Select
            aria-label="Platform"
            onChange={(event) =>
              onPlatformFilterChange(event.target.value as PlatformFilterValue)
            }
            value={platformFilter}
          >
            <option value="all">Tüm platformlar</option>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </Select>
        )}
      </div>

      {summary && (
        <p className="text-sm text-muted sm:ml-auto" aria-live="polite">
          {summary}
        </p>
      )}
    </div>
  )
}
