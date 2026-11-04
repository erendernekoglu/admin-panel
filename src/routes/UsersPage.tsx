import { useEffect, useMemo, useState } from "react"
import { AlertCircle, Users } from "lucide-react"

import type { AdminCursor } from "../types/admin"

import { Card } from "../components/molecules/Card"
import { PageHeader } from "../components/molecules/PageHeader"
import { Pagination } from "../components/molecules/Pagination"
import {
  UserFilters,
  type PlatformFilterValue,
  type UserFilterValue,
} from "../features/users/components/UserFilters"
import { UsersTable } from "../features/users/components/UsersTable"
import {
  useUserSearch,
  useUsersCount,
  useUsersPage,
} from "../features/users/hooks/useUsers"
import { USERS_PAGE_SIZE } from "../features/users/services/userService"
import type { AdminUser } from "../features/users/types"

const numberFormatter = new Intl.NumberFormat("tr-TR")
const SEARCH_DEBOUNCE_MS = 300

function normalizePlatform(platform: string | undefined) {
  return platform?.toLowerCase().replace(/\s+/g, "") ?? ""
}

// Search results are a small server-side set, so the toolbar filters apply here.
function matchesUserFilter(user: AdminUser, filter: UserFilterValue) {
  if (filter === "all") return true
  if (filter === "test") return user.isTest
  if (filter === "admin") return user.role === "admin"
  return user.subscription === filter
}

function matchesPlatformFilter(
  user: AdminUser,
  platformFilter: PlatformFilterValue,
) {
  if (platformFilter === "all") return true
  return normalizePlatform(user.platform) === platformFilter
}

const URL_PATTERN = /(https:\/\/\S+)/

/** Adapter errors may carry a helpful documentation link; keep it clickable. */
function ErrorMessage({ error }: { error: unknown }) {
  const message =
    error instanceof Error ? error.message : "Yönetim servisi beklenmeyen bir hata döndürdü."
  return (
    <p className="mt-2 font-mono text-xs break-all text-muted">
      {message.split(URL_PATTERN).map((part, index) =>
        URL_PATTERN.test(part) ? (
          <a
            className="text-accent underline underline-offset-2"
            href={part}
            key={index}
            rel="noreferrer"
            target="_blank"
          >
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </p>
  )
}

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [delay, value])
  return debounced
}

export default function UsersPage() {
  const [search, setSearch] = useState("")
  const [userFilter, setUserFilter] = useState<UserFilterValue>("all")
  const [platformFilter, setPlatformFilter] =
    useState<PlatformFilterValue>("all")
  // cursors[i] is the opaque cursor page i starts after; page 0 has none.
  const [cursors, setCursors] = useState<Array<AdminCursor | null>>([null])
  const pageIndex = cursors.length - 1

  const searchTerm = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS)
  const isSearching = searchTerm.length > 0
  const filters = useMemo(
    () => ({ platformFilter, userFilter }),
    [platformFilter, userFilter],
  )

  const pageQuery = useUsersPage(filters, pageIndex, cursors[pageIndex] ?? null, !isSearching)
  const countQuery = useUsersCount(filters)
  const searchQuery = useUserSearch(searchTerm)

  const activeQuery = isSearching ? searchQuery : pageQuery
  const { error } = activeQuery
  const isLoading = activeQuery.isPending

  const users = useMemo(() => {
    if (isSearching) {
      return (searchQuery.data ?? []).filter(
        (user) =>
          matchesUserFilter(user, userFilter) &&
          matchesPlatformFilter(user, platformFilter),
      )
    }
    return pageQuery.data?.users ?? []
  }, [isSearching, pageQuery.data, platformFilter, searchQuery.data, userFilter])

  const nextCursor = pageQuery.data?.nextCursor ?? null
  const total = countQuery.data
  const isFiltered = userFilter !== "all" || platformFilter !== "all"
  const hasPlatformData =
    platformFilter !== "all" || users.some((user) => Boolean(user.platform))
  const isEmptyCollection =
    !isSearching && !isFiltered && pageIndex === 0 && users.length === 0

  const resetPages = () => setCursors([null])
  const handleUserFilterChange = (value: UserFilterValue) => {
    setUserFilter(value)
    resetPages()
  }
  const handlePlatformFilterChange = (value: PlatformFilterValue) => {
    setPlatformFilter(value)
    resetPages()
  }

  const pageStart = pageIndex * USERS_PAGE_SIZE
  const pageCount =
    total === undefined ? undefined : Math.max(1, Math.ceil(total / USERS_PAGE_SIZE))
  const summary = isSearching ? (
    <>
      <span className="font-semibold tabular-nums text-ink">
        {numberFormatter.format(users.length)}
      </span>{" "}
      sonuç
    </>
  ) : total === undefined ? null : (
    <>
      <span className="font-semibold tabular-nums text-ink">
        {numberFormatter.format(total)}
      </span>{" "}
      {isFiltered ? "eşleşen kullanıcı" : "kullanıcı"}
    </>
  )

  return (
    <section className="space-y-6">
      <PageHeader
        description="Uygulama kullanıcılarını arayın, plan ve hesap durumlarını inceleyin, ayrıntılar için bir kullanıcı açın."
        title="Kullanıcılar"
      />

      {!isLoading && !error && isEmptyCollection ? (
        <Card className="flex flex-col items-center justify-center px-6 py-16 text-center" tone="quiet">
          <Users aria-hidden="true" className="size-8 text-muted" />
          <h2 className="mt-3 text-base font-semibold text-ink">
            Henüz kullanıcı yok
          </h2>
          <p className="mt-1 max-w-sm text-sm text-ink-soft">
            Uygulamada ilk hesap açıldığında burada listelenir. Kayıt olduğunu
            bildiğiniz kullanıcılar görünmüyorsa yönetim servisi bağlantısını kontrol edin.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <UserFilters
            onPlatformFilterChange={handlePlatformFilterChange}
            onSearchChange={setSearch}
            onUserFilterChange={handleUserFilterChange}
            platformFilter={platformFilter}
            search={search}
            showPlatformFilter={hasPlatformData}
            summary={summary}
            userFilter={userFilter}
          />

          {isLoading ? (
            <Card aria-busy="true" aria-label="Kullanıcılar yükleniyor" className="overflow-hidden">
              <div className="h-11 bg-surface-2" />
              <div className="divide-y divide-line">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div className="flex items-center gap-3 px-4 py-3.5" key={index}>
                    <div className="size-10 animate-pulse rounded-full bg-surface-2" />
                    <div className="h-4 w-48 animate-pulse rounded-full bg-surface-2" />
                  </div>
                ))}
              </div>
            </Card>
          ) : error ? (
            <Card className="flex items-start gap-3 p-5" role="alert">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger" />
              <div>
                <h2 className="text-sm font-semibold text-ink">Kullanıcılar yüklenemedi</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Sayfayı yenileyip tekrar deneyin. Filtre yeni bir sorgu
                  birleşimi kullanıyorsa yönetim servisi desteklenen
                  filtreleri doğrulayacaktır.
                </p>
                <ErrorMessage error={error} />
              </div>
            </Card>
          ) : (
            <>
              <UsersTable users={users} />
              {!isSearching && (
                <Pagination
                  hasNext={nextCursor !== null}
                  hasPrevious={pageIndex > 0}
                  isLoading={pageQuery.isFetching}
                  onNext={() => {
                    if (nextCursor) setCursors((current) => [...current, nextCursor])
                  }}
                  onPrevious={() => setCursors((current) => current.slice(0, -1))}
                  page={pageIndex + 1}
                  pageCount={pageCount}
                  summary={
                    users.length > 0
                      ? `${numberFormatter.format(pageStart + 1)}–${numberFormatter.format(pageStart + users.length)} arası gösteriliyor`
                      : null
                  }
                />
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}
