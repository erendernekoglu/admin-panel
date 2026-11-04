import { useState } from "react"
import { ChevronLeft, ChevronRight, Eye, UserRound } from "lucide-react"
import { Link } from "react-router"

import { Badge, type BadgeTone } from "../../../components/atoms/Badge/Badge"
import { IconButton } from "../../../components/atoms/IconButton"
import { Card, CardHeader } from "../../../components/molecules/Card"
import { toDateTimeString } from "../../shared/format"
import type { DashboardNewUser } from "../types"

const PAGE_SIZE = 5

function formatPlatform(value?: string) {
  if (!value) return "Bilinmiyor"
  if (value.toLowerCase() === "ios") return "iOS"
  if (value.toLowerCase() === "android") return "Android"
  return value
}

function planTone(plan: string): BadgeTone {
  const value = plan.toLowerCase()
  if (value === "premium") return "accent"
  if (value === "pro") return "success"
  return "neutral"
}

export function DashboardNewUsers({ users }: { users: DashboardNewUser[] }) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleUsers = users.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  return (
    <Card className="overflow-hidden">
      <CardHeader
        actions={
          <Link
            className="shrink-0 rounded-full px-2 py-1 text-sm font-semibold text-accent hover:text-accent-strong hover:underline hover:underline-offset-4"
            to="/users"
          >
            Tüm kullanıcılar
          </Link>
        }
        className="px-5 py-4"
        description="Seçili aralıkta açılan hesaplar."
        title="Yeni kayıt olan kullanıcılar"
      />

      {visibleUsers.length ? (
        <div className="relative overflow-x-auto border-t border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface-2 text-xs font-semibold text-muted">
              <tr>
                <th className="px-5 py-2.5 font-semibold" scope="col">Kullanıcı</th>
                <th className="px-5 py-2.5 font-semibold" scope="col">Kayıt tarihi</th>
                <th className="px-5 py-2.5 font-semibold" scope="col">Platform</th>
                <th className="px-5 py-2.5 font-semibold" scope="col">Plan</th>
                <th className="w-12 px-3 py-2.5" scope="col">
                  <span className="sr-only">Profili aç</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr
                  className="border-t border-line transition-colors hover:bg-surface-2/60"
                  key={user.uid}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img
                          alt=""
                          className="size-9 shrink-0 rounded-full border border-line object-cover"
                          height={36}
                          src={user.photoURL}
                          width={36}
                        />
                      ) : (
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                          <UserRound aria-hidden size={16} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="max-w-[240px] truncate font-semibold text-ink">
                          {user.displayName || user.email || "İsimsiz kullanıcı"}
                        </p>
                        <p className="mt-0.5 max-w-[240px] truncate text-xs text-muted">
                          {user.email || user.uid}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap tabular-nums text-ink-soft">
                    {toDateTimeString(user.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    {formatPlatform(user.platform)}
                    {user.appVersion ? (
                      <span className="block text-xs tabular-nums text-muted">
                        v{user.appVersion}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-3">
                    <Badge className="capitalize" tone={planTone(user.subscription)}>
                      {user.subscription}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      aria-label={`${user.displayName || user.email || "Kullanıcı"} profilini aç`}
                      className="inline-flex size-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface-2 hover:text-accent"
                      to={`/users/${user.uid}`}
                    >
                      <Eye aria-hidden size={17} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border-t border-line px-5 py-10 text-center text-sm text-muted">
          Bu aralıkta yeni kayıt yok. Daha uzun bir aralık seçerek önceki kayıtları görebilirsiniz.
        </div>
      )}

      {users.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t border-line px-5 py-2.5 text-sm text-ink-soft">
          <span className="tabular-nums">
            {users.length.toLocaleString("tr-TR")} kullanıcı
          </span>
          <div className="flex items-center gap-1">
            <IconButton
              className="disabled:pointer-events-none disabled:opacity-40"
              disabled={safePage === 1}
              label="Önceki sayfa"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft aria-hidden size={16} />
            </IconButton>
            <span className="min-w-14 text-center text-xs tabular-nums">
              {safePage} / {totalPages}
            </span>
            <IconButton
              className="disabled:pointer-events-none disabled:opacity-40"
              disabled={safePage === totalPages}
              label="Sonraki sayfa"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              <ChevronRight aria-hidden size={16} />
            </IconButton>
          </div>
        </div>
      )}
    </Card>
  )
}
