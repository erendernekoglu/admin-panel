import { useState } from "react"
import {
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  UserRound,
  Users,
} from "lucide-react"
import { Link } from "react-router"

import { Badge } from "../../../components/atoms/Badge"
import { IconButton } from "../../../components/atoms/IconButton"
import { Card, CardHeader } from "../../../components/molecules/Card"
import { useDailyActiveUsers } from "../hooks/useDailyActiveUsers"
import type { AcquisitionData, LaunchAnalyticsFilters } from "../types"
import { AnalyticsDrawer } from "./AnalyticsDrawer"

const DAYS_PER_PAGE = 7

const dateTime = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

function formatDateTime(value: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : dateTime.format(date)
}

function formatDay(value: string) {
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
}

export function DailyActiveUsers({
  daily,
  filters,
}: {
  daily: AcquisitionData["daily"]
  filters: LaunchAnalyticsFilters
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ key: "", page: 1 })
  const paginationKey = [
    filters.startDate,
    filters.endDate,
    filters.platform,
    filters.language,
    filters.notificationStatus,
  ].join("|")
  const orderedDays = [...daily].reverse()
  const pageCount = Math.max(1, Math.ceil(orderedDays.length / DAYS_PER_PAGE))
  const requestedPage = pagination.key === paginationKey ? pagination.page : 1
  const currentPage = Math.min(requestedPage, pageCount)
  const visibleDays = orderedDays.slice(
    (currentPage - 1) * DAYS_PER_PAGE,
    currentPage * DAYS_PER_PAGE,
  )

  const goToPage = (page: number) => {
    setPagination({
      key: paginationKey,
      page: Math.max(1, Math.min(page, pageCount)),
    })
  }

  const query = useDailyActiveUsers(
    selectedDate
      ? {
          date: selectedDate,
          platform: filters.platform,
          language: filters.language,
          notificationStatus: filters.notificationStatus,
          limit: 100,
        }
      : null,
  )

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader
          className="px-5 py-4"
          description="En az bir oturum başlatan kullanıcılar. Kimlerin aktif olduğunu görmek için bir gün seçin."
          title="Günlük aktif kullanıcılar"
        />
        {daily.length ? (
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="bg-surface-2 text-xs font-semibold text-muted">
                <tr>
                  <th className="px-5 py-2.5 font-semibold" scope="col">Tarih</th>
                  <th className="px-5 py-2.5 text-right font-semibold" scope="col">Aktif kullanıcı</th>
                  <th className="w-14 px-3 py-2.5" scope="col">
                    <span className="sr-only">Kullanıcıları gör</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleDays.map((point) => (
                  <tr
                    className="border-t border-line transition-colors hover:bg-surface-2/60"
                    key={point.d}
                  >
                    <td className="px-5 py-3 font-semibold text-ink">
                      <span className="inline-flex flex-wrap items-center gap-2">
                        {formatDay(point.d)}
                        {point.provisional && <Badge tone="warning">Geçici</Badge>}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-ink">
                      {Number(point.dau || 0).toLocaleString("tr-TR")}
                    </td>
                    <td className="px-3 py-2">
                      <IconButton
                        className="hover:text-accent disabled:pointer-events-none disabled:opacity-35"
                        disabled={!Number(point.dau)}
                        label={`${formatDay(point.d)} aktif kullanıcılarını gör`}
                        onClick={() => setSelectedDate(point.d)}
                      >
                        <ChevronRight aria-hidden size={17} />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pageCount > 1 && (
              <div className="flex items-center justify-between border-t border-line px-5 py-2.5">
                <p className="text-xs tabular-nums text-muted">
                  {daily.length} gün · {currentPage} / {pageCount}
                </p>
                <div className="flex items-center gap-1">
                  <IconButton
                    className="disabled:pointer-events-none disabled:opacity-35"
                    disabled={currentPage === 1}
                    label="Daha yeni günler"
                    onClick={() => goToPage(currentPage - 1)}
                  >
                    <ChevronLeft aria-hidden size={17} />
                  </IconButton>
                  <IconButton
                    className="disabled:pointer-events-none disabled:opacity-35"
                    disabled={currentPage === pageCount}
                    label="Daha eski günler"
                    onClick={() => goToPage(currentPage + 1)}
                  >
                    <ChevronRight aria-hidden size={17} />
                  </IconButton>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border-t border-line px-5 py-10 text-center text-sm text-muted">
            Bu aralıkta aktif kullanıcı yok. Tarih aralığını genişletmeyi ya da filtreleri kaldırmayı deneyin.
          </div>
        )}
      </Card>

      {selectedDate && (
        <AnalyticsDrawer
          className="max-w-2xl"
          closeLabel="Paneli kapat"
          context="Günlük aktif kullanıcılar"
          onClose={() => setSelectedDate(null)}
          title={formatDay(selectedDate)}
        >
          {query.isPending ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div className="h-16 animate-pulse rounded-xl bg-surface-2" key={index} />
              ))}
            </div>
          ) : query.error ? (
            <div className="m-6 flex animate-pop-in items-start gap-2 rounded-xl bg-danger-soft p-4 text-sm text-danger" role="alert">
              <AlertTriangle aria-hidden className="mt-0.5 shrink-0" size={17} />
              <span>{query.error.message}</span>
            </div>
          ) : query.data ? (
            <div className="space-y-5 p-6">
              <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line min-[420px]:grid-cols-3">
                <SummaryCard icon={Activity} label="Toplam" value={query.data.totalUsers} />
                <SummaryCard icon={UserRound} label="Tanınan" value={query.data.identifiedUsers} />
                <SummaryCard icon={Users} label="Anonim" value={query.data.anonymousUsers} />
              </dl>

              <section className="overflow-hidden rounded-2xl border border-line bg-surface">
                <ul>
                  {query.data.users.map((user) => {
                    const name = user.profile?.displayName || user.profile?.email || user.anonymousLabel
                    return (
                      <li
                        className="flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0"
                        key={user.activityId}
                      >
                        {user.profile?.photoURL ? (
                          <img
                            alt=""
                            className="size-10 shrink-0 rounded-full border border-line object-cover"
                            height={40}
                            src={user.profile.photoURL}
                            width={40}
                          />
                        ) : (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                            <UserRound aria-hidden size={18} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{name}</p>
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {user.profile?.email || "Bağlı hesap yok"} · {user.platform || "Bilinmiyor"}
                            {user.appVersion ? ` · v${user.appVersion}` : ""}
                          </p>
                          <p className="mt-0.5 text-xs tabular-nums text-muted">
                            Son oturum {formatDateTime(user.lastSessionAt)}
                          </p>
                        </div>
                        {user.profile && (
                          <Link
                            aria-label={`${name} profilini aç`}
                            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface-2 hover:text-accent"
                            to={`/users/${user.profile.uid}`}
                          >
                            <ExternalLink aria-hidden size={16} />
                          </Link>
                        )}
                      </li>
                    )
                  })}
                </ul>
                {!query.data.users.length && (
                  <div className="p-8 text-center text-sm text-muted">
                    Bu gün için kullanıcı ayrıntısı yok. Veri gecikmeli gelebilir; birkaç saat sonra tekrar bakın.
                  </div>
                )}
              </section>
              {query.data.totalUsers > query.data.users.length && (
                <p className="text-center text-xs tabular-nums text-muted">
                  {query.data.totalUsers.toLocaleString("tr-TR")} aktif kullanıcının en son{" "}
                  {query.data.users.length.toLocaleString("tr-TR")} tanesi gösteriliyor.
                </p>
              )}
            </div>
          ) : null}
        </AnalyticsDrawer>
      )}
    </>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity
  label: string
  value: number
}) {
  return (
    <div className="flex flex-col bg-surface p-4">
      <dt className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
        <Icon aria-hidden className="text-muted" size={15} /> {label}
      </dt>
      <dd className="mt-2 text-3xl leading-none font-extrabold tracking-tight tabular-nums text-ink">
        {value.toLocaleString("tr-TR")}
      </dd>
    </div>
  )
}
