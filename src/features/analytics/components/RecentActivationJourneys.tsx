import { useState } from "react"
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  ExternalLink,
  UserRound,
} from "lucide-react"
import { Link } from "react-router"

import { Badge, type BadgeTone } from "../../../components/atoms/Badge/Badge"
import { Card, CardHeader } from "../../../components/molecules/Card"
import { cn } from "../../../lib/utils"
import { useRecentActivationUsers } from "../hooks/useRecentActivationUsers"
import type {
  ActivationJourney,
  ActivationJourneyStatus,
  RecentActivationFilters,
} from "../types"
import { AnalyticsDrawer } from "./AnalyticsDrawer"

/** `key` matches the step name the backend sends; `label` is what people read. */
const FUNNEL_STEPS = [
  { key: "First open", label: "İlk açılış" },
  { key: "Onboarding start", label: "Tanıtım başladı" },
  { key: "Onboarding complete", label: "Tanıtım tamamlandı" },
  { key: "Sign up / login", label: "Kayıt veya giriş" },
  { key: "First garment", label: "İlk kıyafet eklendi" },
  { key: "Wardrobe ready", label: "Gardırop hazır" },
  { key: "Outfit created", label: "Kombin oluşturuldu" },
  { key: "Wear confirmed", label: "Giyildi olarak işaretlendi" },
]

const dateTime = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

function formatDate(value: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : dateTime.format(date)
}

function identity(journey: ActivationJourney) {
  return journey.profile?.displayName || journey.profile?.email || journey.anonymousLabel
}

function stepLabel(name: string) {
  return FUNNEL_STEPS.find((step) => step.key === name)?.label ?? name
}

const STATUS: Record<ActivationJourneyStatus, { label: string; tone: BadgeTone }> = {
  completed: { label: "Tamamladı", tone: "success" },
  dropped: { label: "Bıraktı", tone: "danger" },
  in_progress: { label: "Devam ediyor", tone: "warning" },
}

function StatusBadge({ status }: { status: ActivationJourneyStatus }) {
  const { label, tone } = STATUS[status]
  return (
    <Badge className="whitespace-nowrap" tone={tone}>
      {label}
    </Badge>
  )
}

export function RecentActivationJourneys({
  filters,
  preview = false,
}: {
  filters: RecentActivationFilters
  preview?: boolean
}) {
  const query = useRecentActivationUsers(filters)
  const [selected, setSelected] = useState<ActivationJourney | null>(null)
  const dataThrough = query.data?.dataThrough
  const isStale = dataThrough
    ? query.dataUpdatedAt - new Date(dataThrough).getTime() > 2 * 60 * 60 * 1000
    : false

  return (
    <Card className="overflow-hidden">
      <CardHeader
        actions={
          preview ? (
            <Link
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold text-accent hover:text-accent-strong hover:underline hover:underline-offset-4"
              to="/analytics/activation"
            >
              Tüm yolculuklar <ChevronRight aria-hidden size={16} />
            </Link>
          ) : dataThrough ? (
            <span className="shrink-0 text-xs tabular-nums text-muted">
              Veri {formatDate(dataThrough)} itibarıyla
            </span>
          ) : null
        }
        className="px-5 py-4"
        description={
          preview
            ? "Uygulamayı ilk kez açanlar ve ulaştıkları aktivasyon adımı."
            : "Huni yolunu ve önemli olayları görmek için bir satır açın."
        }
        title={preview ? "Son gelen kullanıcılar" : "Son kullanıcı yolculukları"}
      />

      {isStale && (
        <div className="flex items-center gap-2 border-t border-line bg-warning-soft px-5 py-3 text-xs font-medium text-warning">
          <AlertTriangle aria-hidden className="shrink-0" size={15} />
          Akış verisi iki saatten fazla geride; son adımlar eksik görünebilir.
        </div>
      )}

      {query.isPending ? (
        <div className="space-y-3 border-t border-line p-5">
          {Array.from({ length: preview ? 3 : 5 }).map((_, index) => (
            <div className="h-12 animate-pulse rounded-xl bg-surface-2" key={index} />
          ))}
        </div>
      ) : query.error ? (
        <div className="flex items-start gap-2 border-t border-line p-5 text-sm text-danger" role="alert">
          <AlertTriangle aria-hidden className="mt-0.5 shrink-0" size={17} />
          <span>{query.error.message}</span>
        </div>
      ) : !query.data?.journeys.length ? (
        <div className="border-t border-line px-5 py-10 text-center text-sm text-muted">
          Bu aralıkta ilk açılış yok. Tarih aralığını genişleterek önceki kullanıcıları görebilirsiniz.
        </div>
      ) : (
        <div className="relative overflow-x-auto border-t border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface-2 text-xs font-semibold text-muted">
              <tr>
                <th className="px-5 py-2.5 font-semibold" scope="col">Kullanıcı</th>
                <th className="px-5 py-2.5 font-semibold" scope="col">İlk açılış</th>
                {!preview && <th className="px-5 py-2.5 font-semibold" scope="col">Platform ve kaynak</th>}
                <th className="px-5 py-2.5 font-semibold" scope="col">Ulaştığı adım</th>
                <th className="px-5 py-2.5 font-semibold" scope="col">Durum</th>
                <th className="w-10 px-3 py-2.5" scope="col">
                  <span className="sr-only">Yolculuğu aç</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {query.data.journeys.map((journey) => (
                <tr
                  className="cursor-pointer border-t border-line transition-colors hover:bg-surface-2/60 focus-visible:bg-surface-2/60"
                  key={journey.journeyId}
                  onClick={() => setSelected(journey)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      setSelected(journey)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <td className="px-5 py-3">
                    <p className="max-w-[240px] truncate font-semibold text-ink">{identity(journey)}</p>
                    <p className="mt-0.5 max-w-[240px] truncate text-xs text-muted">
                      {journey.profile?.email || journey.anonymousLabel}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 tabular-nums text-ink-soft">
                    {formatDate(journey.firstOpenAt)}
                  </td>
                  {!preview && (
                    <td className="px-5 py-3 text-ink-soft">
                      <p>{journey.platform || "Bilinmiyor"} {journey.appVersion ? `· ${journey.appVersion}` : ""}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {journey.acquisitionSource || "(doğrudan)"}
                      </p>
                    </td>
                  )}
                  <td className="px-5 py-3 font-medium text-ink">
                    {stepLabel(journey.currentStep.name)}
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={journey.status} /></td>
                  <td className="px-3 py-3 text-muted"><ChevronRight aria-hidden size={17} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <JourneyDrawer journey={selected} onClose={() => setSelected(null)} />
      )}
    </Card>
  )
}

function JourneyDrawer({
  journey,
  onClose,
}: {
  journey: ActivationJourney
  onClose: () => void
}) {
  return (
    <AnalyticsDrawer
      closeLabel="Yolculuğu kapat"
      context="Kullanıcı yolculuğu"
      meta={<StatusBadge status={journey.status} />}
      onClose={onClose}
      title={identity(journey)}
    >
      <div className="space-y-6 p-6">
        {journey.profile && (
          <Link
            className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4 text-sm font-semibold text-ink transition-colors hover:border-line-strong hover:bg-surface-2"
            to={`/users/${journey.profile.uid}`}
          >
            <span className="flex items-center gap-2"><UserRound aria-hidden size={17} /> Kullanıcı profilini aç</span>
            <ExternalLink aria-hidden className="text-muted" size={15} />
          </Link>
        )}

        <section className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="font-bold text-ink">Aktivasyon hunisi</h3>
          <ol className="mt-4 space-y-3">
            {FUNNEL_STEPS.map((step, index) => {
              const order = index + 1
              const complete = order <= journey.currentStep.order
              const current = order === journey.currentStep.order
              return (
                <li className="flex items-center gap-3" key={step.key}>
                  <span className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border",
                    complete ? "border-accent bg-accent text-on-accent" : "border-line-strong text-muted",
                  )}>
                    {complete ? <Check aria-hidden size={14} /> : <Circle aria-hidden size={10} />}
                  </span>
                  <div>
                    <p className={cn("text-sm", current ? "font-bold text-ink" : "text-ink-soft")}>
                      {step.label}
                      {complete ? <span className="sr-only"> (tamamlandı)</span> : null}
                    </p>
                    {current && journey.currentStep.name !== step.key && (
                      <p className="text-xs text-muted">{stepLabel(journey.currentStep.name)}</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5">
          <h3 className="font-bold text-ink">Önemli olaylar</h3>
          {journey.events.length ? (
            <ol className="mt-4 space-y-4">
              {journey.events.map((event, index) => (
                <li className="flex gap-3" key={`${event.occurredAt}-${event.eventName}-${index}`}>
                  <div className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                    event.outcome === "failure" ? "bg-danger-soft text-danger" : "bg-surface-2 text-ink-soft",
                  )}>
                    {event.outcome === "failure" ? <AlertTriangle aria-hidden size={14} /> : <Clock3 aria-hidden size={14} />}
                  </div>
                  <div>
                    <p className={cn("text-sm font-medium", event.outcome === "failure" ? "text-danger" : "text-ink")}>{event.label}</p>
                    <p className="mt-0.5 text-xs tabular-nums text-muted">{formatDate(event.occurredAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-muted">Bu yolculuk için kayıtlı olay yok.</p>
          )}
        </section>
      </div>
    </AnalyticsDrawer>
  )
}
