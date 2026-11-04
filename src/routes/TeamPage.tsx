import { useState } from "react"
import { Loader2, ShieldCheck, UserPlus } from "lucide-react"

import { Avatar } from "../components/atoms/Avatar"
import { Badge } from "../components/atoms/Badge"
import { Button } from "../components/atoms/Button"
import { Input } from "../components/atoms/Input"
import { Card } from "../components/molecules/Card"
import { PageHeader } from "../components/molecules/PageHeader"
import { Select } from "../components/molecules/Select"
import { ConfirmWithPasswordDialog } from "../features/api-keys/components/ConfirmWithPasswordDialog"
import { useAuth } from "../features/auth/useAuth"
import { isDemoMode } from "../lib/config"
import { useSetRole, useTeam, type TeamMember } from "../features/team/teamService"
import { useUserSearch } from "../features/users/hooks/useUsers"
import {
  CONSOLE_ROLES,
  CONSOLE_ROLE_LABELS,
  PERMISSIONS,
  type ConsoleRole,
  type Permission,
} from "../lib/auth/permissions"

const ROLE_SUMMARY: Record<ConsoleRole, string> = {
  viewer: "Yalnızca toplu raporlar ve analitik. Kişisel kullanıcı verisi görmez.",
  editor: "Raporlara ek olarak içerik, Lookbook ve etkinlik hazırlığı, butik incelemesi.",
  support: "Raporlara ek olarak kullanıcı arama, kullanıcı detayı, kredi ve abonelik inceleme.",
  admin: "Her şey: para ve hesap işlemleri, yayınlama, gelir, sistem ayarları ve ekip yönetimi.",
}

const ROLE_TONE: Record<ConsoleRole, "neutral" | "accent" | "success" | "ink"> = {
  viewer: "neutral",
  editor: "accent",
  support: "success",
  admin: "ink",
}

interface PendingChange {
  uid: string
  label: string
  from: ConsoleRole | null
  to: ConsoleRole | null
}

function describe(change: PendingChange) {
  const to = change.to ? CONSOLE_ROLE_LABELS[change.to] : null
  if (!change.from) return `${change.label} ekibe ${to} olarak eklenecek.`
  if (!to) return `${change.label} ekipten çıkarılacak ve panele erişimi kapanacak.`
  return `${change.label} rolü ${CONSOLE_ROLE_LABELS[change.from]} → ${to} olarak değişecek.`
}

function memberLabel(member: Pick<TeamMember, "displayName" | "email" | "uid">) {
  return member.displayName || member.email || member.uid
}

export default function TeamPage() {
  const { user } = useAuth()
  const team = useTeam()
  const setRole = useSetRole()
  const [pending, setPending] = useState<PendingChange | null>(null)
  const [search, setSearch] = useState("")
  const [newRole, setNewRole] = useState<ConsoleRole>("viewer")
  const candidates = useUserSearch(search.trim())

  const members = team.data ?? []
  const memberIds = new Set(members.map((member) => member.uid))
  const adminCount = members.filter((member) => member.role === "admin").length

  async function confirm(consolePassword: string) {
    if (!pending) return
    try {
      await setRole.mutateAsync({ uid: pending.uid, role: pending.to, consolePassword })
      setPending(null)
      setSearch("")
    } catch {
      // The dialog shows the error and stays open.
    }
  }

  function open(change: PendingChange) {
    setRole.reset()
    setPending(change)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Panele kimin hangi rolle girebileceğini buradan yönetin. Her değişiklik konsol şifresi ister ve işlem kayıtlarına yazılır."
        icon={<ShieldCheck />}
        title="Ekip ve roller"
      />

      <Card className="overflow-hidden">
        {team.isPending ? (
          <p className="flex items-center gap-2 px-5 py-6 text-sm text-muted">
            <Loader2 aria-hidden className="size-4 animate-spin" /> Ekip yükleniyor…
          </p>
        ) : team.isError ? (
          <p className="px-5 py-6 text-sm text-danger" role="alert">
            {team.error.message}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {members.map((member) => {
              const label = memberLabel(member)
              const isSelf = member.uid === user?.uid
              const lastAdmin = member.role === "admin" && adminCount <= 1
              return (
                <li className="flex flex-wrap items-center gap-3 px-5 py-3.5" key={member.uid}>
                  <Avatar name={label} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {label}
                      {isSelf && <span className="font-normal text-muted"> (siz)</span>}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {member.email ?? member.uid}
                      {member.disabled && " · hesap devre dışı"}
                    </p>
                  </div>
                  <Badge tone={ROLE_TONE[member.role]}>{CONSOLE_ROLE_LABELS[member.role]}</Badge>
                  <Select
                    aria-label={`${label} için rol`}
                    className="w-40"
                    disabled={lastAdmin}
                    onChange={(event) =>
                      open({ uid: member.uid, label, from: member.role, to: event.target.value as ConsoleRole })
                    }
                    title={lastAdmin ? "Son admin'in rolü değiştirilemez." : undefined}
                    value={member.role}
                  >
                    {CONSOLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {CONSOLE_ROLE_LABELS[role]}
                      </option>
                    ))}
                  </Select>
                  <Button
                    disabled={lastAdmin}
                    onClick={() => open({ uid: member.uid, label, from: member.role, to: null })}
                    size="sm"
                    title={lastAdmin ? "Son admin ekipten çıkarılamaz." : undefined}
                    variant="secondary"
                  >
                    Çıkar
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card className="space-y-4 p-5">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <UserPlus aria-hidden className="size-4 text-accent" /> Ekibe kişi ekle
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Kişinin önce uygulamada bir hesabı olmalı. E-postanın başını ya da tam UID'yi yazın.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            aria-label="E-posta veya UID"
            className="min-w-60 flex-1"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ornek@example.test"
            value={search}
          />
          <Select
            aria-label="Verilecek rol"
            className="w-44"
            onChange={(event) => setNewRole(event.target.value as ConsoleRole)}
            value={newRole}
          >
            {CONSOLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {CONSOLE_ROLE_LABELS[role]}
              </option>
            ))}
          </Select>
        </div>
        {search.trim() && (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {candidates.isFetching && !candidates.data && (
              <li className="px-4 py-3 text-sm text-muted">Aranıyor…</li>
            )}
            {candidates.data?.length === 0 && <li className="px-4 py-3 text-sm text-muted">Hesap bulunamadı.</li>}
            {candidates.data?.slice(0, 6).map((candidate) => {
              const label = candidate.displayName || candidate.email || candidate.uid
              const already = memberIds.has(candidate.uid)
              return (
                <li className="flex items-center gap-3 px-4 py-2.5" key={candidate.uid}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{label}</p>
                    <p className="truncate font-mono text-xs text-muted">{candidate.email || candidate.uid}</p>
                  </div>
                  <Button
                    disabled={already}
                    onClick={() => open({ uid: candidate.uid, label, from: null, to: newRole })}
                    size="sm"
                    variant="accent"
                  >
                    {already ? "Zaten ekipte" : `${CONSOLE_ROLE_LABELS[newRole]} olarak ekle`}
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card className="p-5" tone="quiet">
        <h2 className="text-base font-semibold text-ink">Roller ne yapabilir?</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          {CONSOLE_ROLES.map((role) => (
            <div key={role}>
              <dt>
                <Badge tone={ROLE_TONE[role]}>{CONSOLE_ROLE_LABELS[role]}</Badge>
              </dt>
              <dd className="mt-1.5 text-sm text-ink-soft">
                {ROLE_SUMMARY[role]}{" "}
                <span className="text-muted">
                  ({(Object.keys(PERMISSIONS) as Permission[]).filter((p) =>
                    (PERMISSIONS[p] as readonly ConsoleRole[]).includes(role),
                  ).length}{" "}
                  yetki)
                </span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted">
          {isDemoMode
            ? "Demo modunda rol değişiklikleri yalnızca bu tarayıcı oturumunun belleğinde tutulur; sayfa yenilendiğinde başlangıç rollerine dönülür."
            : "Rol değişikliği sunucuda hemen geçerli olur. Kişinin panelindeki menüler bir sonraki girişte ya da sayfa yenilendiğinde güncellenir."}
        </p>
      </Card>

      <ConfirmWithPasswordDialog
        busy={setRole.isPending}
        confirmLabel={pending?.to ? "Rolü kaydet" : "Ekipten çıkar"}
        description={pending ? describe(pending) : ""}
        destructive={pending?.to === null || pending?.from === "admin"}
        error={setRole.error}
        onCancel={() => setPending(null)}
        onConfirm={confirm}
        open={pending !== null}
        title="Rol değişikliğini onayla"
      />
    </div>
  )
}
