import { useState, type ReactNode } from "react"
import { AlertCircle, ArrowLeft, Gift, History, Smartphone, Trash2, UserSearch } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"

import { Avatar } from "../components/atoms/Avatar"
import { Badge } from "../components/atoms/Badge"
import { Button } from "../components/atoms/Button"
import { Card, CardHeader } from "../components/molecules/Card"
import { PageHeader } from "../components/molecules/PageHeader"
import { toDateString, toDateTimeString } from "../features/shared/format"
import { useAuth } from "../features/auth/useAuth"
import { isDemoMode } from "../lib/config"
import { DeleteUserDialog } from "../features/users/components/DeleteUserDialog"
import { RoleBadge, UserStatusBadge } from "../features/users/components/UserStatusBadge"
import { UserSubscriptionBadge } from "../features/users/components/UserSubscriptionBadge"
import { formatPlatform, getRoleLabel, subscriptionLabels } from "../features/users/labels"
import { useUserDetail } from "../features/users/hooks/useUserDetail"
import type { AdminUser } from "../features/users/types"

const numberFormatter = new Intl.NumberFormat("tr-TR")

function displayValue(value: string | undefined) {
  return value && value.trim() ? value : "—"
}

/** One label/value row in a definition list. */
function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="min-w-0 text-sm font-medium break-words text-ink">{value}</dd>
    </div>
  )
}

/** Key numbers inside the profile header, separated by hairlines. */
function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 bg-surface px-5 py-4">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="mt-1 truncate text-lg font-bold tabular-nums text-ink">{value}</dd>
    </div>
  )
}

function ProfileHeader({ user }: { user: AdminUser }) {
  const name = user.displayName || user.email || user.uid

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        <Avatar className="size-16 text-xl sm:size-20 sm:text-2xl" image={user.photoURL} name={name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-ink sm:text-2xl">
              {user.displayName || "İsimsiz kullanıcı"}
            </h2>
            <UserSubscriptionBadge subscription={user.subscription} />
            <RoleBadge role={user.role} />
            {user.isTest && <UserStatusBadge tone="warning">Test hesabı</UserStatusBadge>}
          </div>
          <p className="mt-1 text-sm break-all text-ink-soft">{user.email || "E-posta yok"}</p>
          <p className="mt-1 font-mono text-xs break-all text-muted">{user.uid}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px border-t border-line bg-line lg:grid-cols-4">
        <Fact label="Kredi" value={numberFormatter.format(user.credits)} />
        <Fact label="Gardırop" value={numberFormatter.format(user.wardrobeCount)} />
        <Fact label="Kayıtlı sonuç" value={numberFormatter.format(user.savedResultsCount)} />
        <Fact label="Son giriş" value={<span className="text-base">{toDateTimeString(user.lastLoginAt)}</span>} />
      </dl>
    </Card>
  )
}

function AccountDetails({ user }: { user: AdminUser }) {
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        description="Yönetim profilinde kayıtlı hesap bilgileri."
        title="Hesap bilgileri"
      />
      <dl className="mt-3 divide-y divide-line">
        <Field label="Görünen ad" value={displayValue(user.displayName)} />
        <Field label="E-posta" value={displayValue(user.email)} />
        <Field
          label="Kullanıcı ID"
          value={<span className="font-mono text-xs break-all">{user.uid}</span>}
        />
        <Field label="Rol" value={getRoleLabel(user.role)} />
        <Field label="Plan" value={subscriptionLabels[user.subscription] ?? user.subscription} />
        <Field label="Kayıt tarihi" value={toDateString(user.createdAt)} />
        <Field label="Platform" value={formatPlatform(user.platform)} />
        <Field label="Uygulama sürümü" value={displayValue(user.appVersion)} />
        <Field label="Hava durumu şehri" value={displayValue(user.weatherCity)} />
        <Field
          label="Hava durumuna göre kombin"
          value={
            user.weatherOutfitEnabled ? (
              <Badge tone="success">Açık</Badge>
            ) : (
              <Badge>Kapalı</Badge>
            )
          }
        />
      </dl>
    </Card>
  )
}

const upcomingSections = [
  {
    icon: Gift,
    title: "Atanan hediye kodları",
    text: "Kod atamaları sunucu fonksiyonu hazır olduğunda burada görünecek.",
  },
  {
    icon: History,
    title: "Son yönetici işlemleri",
    text: "İşlem kayıtları bağlandığında bu kullanıcıya ait geçmiş listelenecek.",
  },
  {
    icon: Smartphone,
    title: "Uygulama etkinliği",
    text: "Analitik ekranları bağlandığında kullanım özeti eklenecek.",
  },
]

export default function UserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: user, error, isLoading } = useUserDetail(id)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const canDelete = useAuth().can("users.delete")

  return (
    <section className="space-y-6">
      <PageHeader
        context={
          <Link
            className="inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-ink-soft transition-colors hover:text-accent"
            to="/users"
          >
            <ArrowLeft aria-hidden="true" size={16} />
            Kullanıcılara dön
          </Link>
        }
        description="Seçili kullanıcının profilini, hesap durumunu ve yönetim işlemlerini görüntüleyin."
        title="Kullanıcı profili"
      />

      {isLoading && (
        <Card aria-busy="true" aria-label="Kullanıcı yükleniyor" className="p-6">
          <div className="flex items-center gap-5">
            <div className="size-20 animate-pulse rounded-full bg-surface-2" />
            <div className="space-y-2">
              <div className="h-6 w-56 animate-pulse rounded-full bg-surface-2" />
              <div className="h-4 w-40 animate-pulse rounded-full bg-surface-2" />
            </div>
          </div>
        </Card>
      )}

      {!isLoading && error && (
        <Card className="flex items-start gap-3 p-5" role="alert">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger" />
          <div>
            <h2 className="text-sm font-semibold text-ink">Kullanıcı yüklenemedi</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Sayfayı yenileyip tekrar deneyin ya da kullanıcı listesine dönüp
              kaydı yeniden açın.
            </p>
            <p className="mt-2 font-mono text-xs break-all text-muted">
              {error instanceof Error
                ? error.message
                : "Yönetim servisi beklenmeyen bir hata döndürdü."}
            </p>
          </div>
        </Card>
      )}

      {!isLoading && !error && !user && (
        <Card className="flex flex-col items-center px-6 py-14 text-center" tone="quiet">
          <UserSearch aria-hidden="true" className="size-8 text-muted" />
          <h2 className="mt-3 text-base font-semibold text-ink">Kullanıcı bulunamadı</h2>
          <p className="mt-1 max-w-md text-sm text-ink-soft">
            <span className="font-mono break-all text-ink">{id ?? "bilinmiyor"}</span>{" "}
            kimliğiyle bir kayıt yok. Hesap silinmiş olabilir; kullanıcı
            listesinden arayarak tekrar açın.
          </p>
          <Link
            className="mt-5 inline-flex h-10 items-center rounded-full border border-line-strong bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-surface-2"
            to="/users"
          >
            Kullanıcı listesine git
          </Link>
        </Card>
      )}

      {!isLoading && !error && user && (
        <>
          <ProfileHeader user={user} />

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <AccountDetails user={user} />

            <div className="space-y-6">
              <Card className="p-5" tone="quiet">
                <CardHeader title="Yakında eklenecek" />
                <ul className="mt-4 space-y-4">
                  {upcomingSections.map(({ icon: Icon, text, title }) => (
                    <li className="flex gap-3" key={title}>
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-muted">
                        <Icon aria-hidden="true" size={16} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">{title}</p>
                        <p className="mt-0.5 text-sm text-ink-soft">{text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>

              {canDelete && (
                <section
                  aria-labelledby="danger-zone-title"
                  className="rounded-2xl border border-danger/30 p-5"
                >
                  <h2 className="text-base font-bold text-danger" id="danger-zone-title">
                    Kalıcı işlemler
                  </h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    {isDemoMode
                      ? "Demo modunda silme yalnızca bu tarayıcı oturumunun belleğini değiştirir; sayfa yenilendiğinde kullanıcı geri gelir."
                      : "Kullanıcıyı silmek geri alınamaz. İşlem sunucu tarafında yönetici yetkisi doğrulandıktan sonra yapılır."}
                  </p>
                  <Button
                    className="mt-4 w-full sm:w-auto"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    variant="danger"
                  >
                    <Trash2 aria-hidden="true" size={16} />
                    Kullanıcıyı sil
                  </Button>
                </section>
              )}
            </div>
          </div>

          <DeleteUserDialog
            onClose={() => setIsDeleteDialogOpen(false)}
            onDeleted={() => navigate("/users", { replace: true })}
            targetUser={isDeleteDialogOpen ? user : null}
          />
        </>
      )}
    </section>
  )
}
