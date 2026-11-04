import { useState } from "react"
import { Gift, SearchX, Trash2, UserX } from "lucide-react"
import { Link } from "react-router"

import { Avatar } from "../../../components/atoms/Avatar"
import { IconButton } from "../../../components/atoms/IconButton"
import { Card } from "../../../components/molecules/Card"
import { toDateString, toDateTimeString } from "../../shared/format"
import { cn } from "../../../lib/utils"
import { formatPlatform } from "../labels"
import type { AdminUser } from "../types"
import { useAuth } from "../../auth/useAuth"
import { DeleteUserDialog } from "./DeleteUserDialog"
import { RoleBadge, UserStatusBadge } from "./UserStatusBadge"
import { UserSubscriptionBadge } from "./UserSubscriptionBadge"

const numberFormatter = new Intl.NumberFormat("tr-TR")

function displayValue(value: string | undefined) {
  return value && value.trim() ? value : "—"
}

const columns: Array<{ label: string; numeric?: boolean }> = [
  { label: "Kullanıcı" },
  { label: "E-posta" },
  { label: "Plan" },
  { label: "Rol" },
  { label: "Kredi", numeric: true },
  { label: "Gardırop", numeric: true },
  { label: "Kayıtlı", numeric: true },
  { label: "Şehir" },
  { label: "Platform" },
  { label: "Kayıt tarihi" },
  { label: "Son giriş" },
  { label: "İşlemler", numeric: true },
]

// Keep pointer events on disabled placeholders so the "yakında" tooltip still shows.
const disabledIconClass =
  "disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-soft disabled:active:scale-100"

export function UsersTable({ users }: { users: AdminUser[] }) {
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const canDelete = useAuth().can("users.delete")

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] border-collapse text-left">
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
              {users.map((user) => {
                const name = user.displayName || user.email || user.uid
                return (
                  <tr
                    className="border-t border-line transition-colors hover:bg-surface-2/60"
                    key={user.uid}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10" image={user.photoURL} name={name} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              className="max-w-[220px] truncate text-sm font-semibold text-ink hover:text-accent"
                              to={`/users/${user.uid}`}
                            >
                              {user.displayName || "İsimsiz kullanıcı"}
                            </Link>
                            {user.isTest && (
                              <UserStatusBadge tone="warning">Test</UserStatusBadge>
                            )}
                          </div>
                          <p className="mt-0.5 max-w-[220px] truncate font-mono text-xs text-muted">
                            {user.uid}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[240px] truncate px-4 py-3.5 text-sm text-ink-soft">
                      {user.email || "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <UserSubscriptionBadge subscription={user.subscription} />
                    </td>
                    <td className="px-4 py-3.5">
                      {user.role && user.role !== "user" ? (
                        <RoleBadge role={user.role} />
                      ) : (
                        <span className="text-sm text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-semibold tabular-nums text-ink">
                      {numberFormatter.format(user.credits)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm tabular-nums text-ink-soft">
                      {numberFormatter.format(user.wardrobeCount)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm tabular-nums text-ink-soft">
                      {numberFormatter.format(user.savedResultsCount)}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-ink-soft">
                      {displayValue(user.weatherCity)}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-ink-soft">
                      <div>{formatPlatform(user.platform)}</div>
                      <div className="text-xs text-muted">
                        {displayValue(user.appVersion)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm whitespace-nowrap tabular-nums text-ink-soft">
                      {toDateString(user.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-sm whitespace-nowrap tabular-nums text-ink-soft">
                      {toDateTimeString(user.lastLoginAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          className="mr-1 inline-flex h-8 items-center rounded-full border border-line-input bg-surface px-3.5 text-xs font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-surface-2"
                          to={`/users/${user.uid}`}
                        >
                          Ayrıntılar
                        </Link>
                        <IconButton
                          className={disabledIconClass}
                          disabled
                          label="Hediye kodu ata (yakında)"
                        >
                          <Gift aria-hidden="true" size={16} />
                        </IconButton>
                        <IconButton
                          className={disabledIconClass}
                          disabled
                          label="Hesabı askıya al (yakında)"
                        >
                          <UserX aria-hidden="true" size={16} />
                        </IconButton>
                        {canDelete && (
                          <IconButton
                            className="hover:bg-danger-soft hover:text-danger"
                            label={`Sil: ${name}`}
                            onClick={() => setDeleteTarget(user)}
                          >
                            <Trash2 aria-hidden="true" size={16} />
                          </IconButton>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 border-t border-line px-6 py-14 text-center">
            <SearchX aria-hidden="true" className="size-7 text-muted" />
            <p className="text-sm font-semibold text-ink">
              Bu filtrelere uyan kullanıcı yok.
            </p>
            <p className="max-w-sm text-sm text-muted">
              Arama metnini kısaltın ya da filtreyi “Tüm kullanıcılar” olarak
              değiştirin.
            </p>
          </div>
        )}
      </Card>

      <DeleteUserDialog
        onClose={() => setDeleteTarget(null)}
        targetUser={deleteTarget}
      />
    </>
  )
}
