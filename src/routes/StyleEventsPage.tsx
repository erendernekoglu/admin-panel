import { detailedEventTemplate } from "../features/style-events/detailedEventTemplate";
import { EventAboutEditor } from "../features/style-events/EventAboutEditor"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { Link } from "react-router"
import { CalendarDays, Copy, ImageOff, Plus, Sparkles } from "lucide-react"
import { Button } from "../components/atoms/Button"
import { Badge, type BadgeTone } from "../components/atoms/Badge/Badge"
import { Card, CardHeader } from "../components/molecules/Card"
import { PageHeader } from "../components/molecules/PageHeader"
import { cn } from "../lib/utils"
import { useAuth } from "../features/auth/useAuth"
import { getWinner, completeEvent, disqualifyEntry, listEntries, listEvents, markDelivered, saveEvent, uploadEventImage, type Entry, type StyleEvent } from "../features/style-events/styleEventService"

const blank = (): StyleEvent => ({ aboutSections: [], id: "", title: "", description: "", rules: "", coverUrl: "", startsAt: Date.now() + 3600000, endsAt: Date.now() + 7 * 86400000, status: "draft", prize: { kind: "aura", title: "", description: "", imageUrl: "", aura: 100 } })
const dateInput = (value: number) => new Date(value - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16)
/** Mirrors the shared Input atom; used for inputs, selects and textareas on this page. */
const inputClass = "mt-1.5 block w-full min-h-10 rounded-xl border border-line-input bg-surface px-3.5 py-2 text-sm font-normal text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted hover:border-ink/30 focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60 file:mr-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-ink"
const labelClass = "block text-sm font-semibold text-ink"
const statusLabel = (event: StyleEvent, now: number) => event.status === "draft" ? "Taslak" : event.status === "completed" ? "Tamamlandı" : event.endsAt <= now ? "Sonuç bekliyor" : event.startsAt > now ? "Zamanlandı" : "Aktif"
const statusTone: Record<string, BadgeTone> = { Taslak: "neutral", Tamamlandı: "ink", "Sonuç bekliyor": "warning", Zamanlandı: "accent", Aktif: "success" }

function StatusBadge({ event, now }: { event: StyleEvent; now: number }) {
  const label = statusLabel(event, now)
  return <Badge tone={statusTone[label] ?? "neutral"}>{label}</Badge>
}

function Note({ children, tone = "quiet" }: { children: ReactNode; tone?: "quiet" | "warning" }) {
  return <p className={cn("rounded-xl p-3 text-sm leading-relaxed", tone === "warning" ? "bg-warning-soft text-warning" : "bg-surface-2 text-ink-soft")}>{children}</p>
}

export default function StyleEventsPage() {
  const [now, setNow] = useState(Date.now)
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  const [events, setEvents] = useState<StyleEvent[]>([]); const [selected, setSelected] = useState<StyleEvent>(blank)
  const [entries, setEntries] = useState<Entry[]>([]); const [entryCursor, setEntryCursor] = useState<string | null>(null)
  const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(true)
  const [winnerUid, setWinnerUid] = useState<string | null>(null)
  const { can } = useAuth()
  const canPickWinner = can("events.pickWinner")
  const canConfirmPrize = can("events.confirmPrize")
  const [reason, setReason] = useState(""); const selectedId = useRef("")
  const savedEvent = events.find(event => event.id === selected.id)
  const locked = savedEvent?.status === "completed" || (savedEvent?.status === "published" && savedEvent.startsAt <= now)
  const refresh = useCallback(async () => {
    const all: StyleEvent[] = []; let cursor: string | undefined
    do { const page = await listEvents(cursor); all.push(...page.items); cursor = page.cursor ?? undefined } while (cursor)
    setEvents(all); return all
  }, [])
  useEffect(() => { let alive = true; void refresh().catch(error => { if (alive) setError(error.message) }).finally(() => { if (alive) setLoading(false) }); return () => { alive = false } }, [refresh])
  const select = async (event: StyleEvent) => {
    selectedId.current = event.id; setWinnerUid(null); setSelected(event); setEntries([]); setEntryCursor(null); setError(""); setMessage("")
    if (!event.id) return
    if (event.winnerPostId && canConfirmPrize) void getWinner(event.id).then(result => { if (selectedId.current === event.id) setWinnerUid(result.uid) }).catch(error => setError(error.message))
    try { const page = await listEntries(event.id); if (selectedId.current === event.id) { setEntries(page.items); setEntryCursor(page.cursor) } } catch (error) { if (selectedId.current === event.id) setError((error as Error).message) }
  }
  const run = async (work: () => Promise<void>) => {
    setBusy(true); setError(""); setMessage("")
    try { await work() } catch (error) { setError((error as Error).message) } finally { setBusy(false) }
  }
  const update = (patch: Partial<StyleEvent>) => setSelected(old => ({ ...old, ...patch }))
  const upload = (file: File | undefined, prize: boolean) => {
    if (!file) return
    void run(async () => { const url = await uploadEventImage(file); setSelected(old => prize ? { ...old, prize: { ...old.prize, imageUrl: url } } : { ...old, coverUrl: url }) })
  }
  return <section className="space-y-6">
    <PageHeader
      title="Etkinlikler"
      description="Mobil Keşfet etkinliklerini, ödülleri ve sonuçları yönet."
      actions={<>
        <Button variant="secondary" disabled={busy} onClick={() => void select({ ...blank(), aboutSections: detailedEventTemplate() })}><Sparkles aria-hidden="true" className="size-4" />Detaylı etkinlik oluştur</Button>
        <Button variant="accent" disabled={busy} onClick={() => void select(blank())}><Plus aria-hidden="true" className="size-4" />Yeni etkinlik</Button>
      </>}
    />
    {error && <div role="alert" className="flex animate-pop-in flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger"><p className="font-semibold">{error}</p><Button size="sm" variant="secondary" onClick={() => void run(async () => { await refresh() })}>Yeniden dene</Button></div>}
    {message && <p role="status" className="animate-pop-in rounded-xl border border-success/25 bg-success-soft p-4 text-sm font-semibold text-success">{message}</p>}
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside aria-label="Etkinlik listesi" className="space-y-2 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:self-start xl:overflow-y-auto xl:pr-1">
        {loading ? <p role="status" className="text-sm text-muted">Etkinlikler yükleniyor…</p>
          : events.length === 0 ? <div className="rounded-2xl border border-dashed border-line-strong p-6 text-center text-sm text-muted">{error ? "Etkinlik listesi yüklenemedi. Yukarıdaki “Yeniden dene” düğmesini kullanın." : "Henüz etkinlik yok. “Yeni etkinlik” ile ilkini oluşturun."}</div>
            : events.map(event => <button type="button" disabled={busy} key={event.id} onClick={() => void select(event)} aria-current={selected.id === event.id ? "true" : undefined} className={cn(
              "flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-colors duration-150 disabled:opacity-60",
              selected.id === event.id ? "border-ink/30 bg-surface-3" : "border-line bg-surface hover:bg-surface-2",
            )}>
              <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-2 text-muted">
                {event.coverUrl ? <img src={event.coverUrl} alt="" width={64} height={64} loading="lazy" className="size-full object-cover" /> : <ImageOff aria-hidden="true" className="size-5" />}
              </span>
              <span className="min-w-0 flex-1 space-y-1">
                <strong className="block truncate text-sm text-ink">{event.title}</strong>
                <span className="flex flex-wrap items-center gap-2"><StatusBadge event={event} now={now} /></span>
                <span className="flex items-center gap-1 text-xs text-muted"><CalendarDays aria-hidden="true" className="size-3.5" />{new Date(event.endsAt).toLocaleString("tr-TR")}</span>
              </span>
            </button>)}
      </aside>
      <div className="min-w-0 space-y-6">
        <Card className="p-5 sm:p-6">
          <CardHeader
            title={selected.id ? selected.title || "Etkinlik" : "Yeni etkinlik"}
            description={selected.id ? <span className="inline-flex items-center gap-2"><StatusBadge event={selected} now={now} /><span>Kayıt: {selected.id}</span></span> : "Bilgileri doldurup kaydedin. Taslak olarak kaydedilen etkinlik uygulamada görünmez."}
            actions={selected.id ? <Button size="sm" variant="secondary" disabled={busy} onClick={() => void select({ ...blank(), title: `${selected.title} — kopya`, description: selected.description, rules: selected.rules, coverUrl: selected.coverUrl, prize: { ...selected.prize }, countryCode: selected.countryCode, rewardDesignId: selected.rewardDesignId, runwayReward: selected.runwayReward, aboutSections: selected.aboutSections ? structuredClone(selected.aboutSections) : [] })}><Copy aria-hidden="true" className="size-3.5" />Yeni etkinlik için kopyala</Button> : undefined}
          />
          <form className="mt-6 space-y-5" onSubmit={event => { event.preventDefault(); void run(async () => { const saved = await saveEvent(selected); await refresh(); await select(saved); setMessage("Etkinlik kaydedildi.") }) }}>
            {locked && <Note tone="warning">Etkinlik başladı. Katılım koşulları kilitlendi; yalnızca sonuç ve teslimat işlemleri yapılabilir.</Note>}
            <fieldset disabled={busy || locked} className="space-y-5">
              <label className={labelClass}>Başlık<input required maxLength={120} className={inputClass} value={selected.title} onChange={event => update({ title: event.target.value })} /></label>
              <label className={labelClass}>Açıklama<textarea required rows={3} maxLength={3000} className={inputClass} value={selected.description} onChange={event => update({ description: event.target.value })} /></label>
              <label className={labelClass}>Ek katılım kuralları<textarea rows={3} maxLength={3000} className={inputClass} value={selected.rules} onChange={event => update({ rules: event.target.value })} /></label>
              <Note>En fazla 3 kombin, isteğe bağlı anonimlik. Dijital ödülde en iyi kombiniyle ilk üç farklı hesap kazanır; diğer ödüllerde tek kazanan seçilir. Eşitlikte önce gönderilen kazanır.</Note>

              <div className="grid gap-5 border-t border-line pt-5 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="space-y-5">
                  <label className={labelClass}>Kapak görseli yükle<input type="file" accept="image/jpeg,image/png,image/webp" className={inputClass} onChange={event => upload(event.target.files?.[0], false)} /></label>
                  <label className={labelClass}>Kapak görseli adresi<input required type="url" className={inputClass} value={selected.coverUrl} onChange={event => update({ coverUrl: event.target.value })} /></label>
                </div>
                <div className="flex aspect-[3/2] items-center justify-center overflow-hidden rounded-2xl bg-surface-2 text-center text-xs text-muted">
                  {selected.coverUrl ? <img src={selected.coverUrl} alt="Etkinlik kapağı" className="size-full object-cover" /> : <span className="px-4">Kapak görseli burada görünür</span>}
                </div>
              </div>

              <div className="grid gap-4 border-t border-line pt-5 md:grid-cols-2"><label className={labelClass}>Başlangıç<input required type="datetime-local" className={inputClass} value={dateInput(selected.startsAt)} onChange={event => { const value = new Date(event.target.value).getTime(); if (Number.isFinite(value)) update({ startsAt: value }) }} /></label><label className={labelClass}>Bitiş<input required type="datetime-local" className={inputClass} value={dateInput(selected.endsAt)} onChange={event => { const value = new Date(event.target.value).getTime(); if (Number.isFinite(value)) update({ endsAt: value }) }} /></label></div>
              <p className="text-xs text-muted">Saat dilimi: {Intl.DateTimeFormat().resolvedOptions().timeZone}. Başladıktan sonra süre ve ödül değiştirilemez.</p>

              <div className="space-y-5 border-t border-line pt-5">
                <h3 className="text-base font-bold text-ink">Ödül</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className={labelClass}>Ödül türü<select className={inputClass} value={selected.prize.kind} onChange={event => update({ rewardDesignId: event.target.value === "digital" ? "autumn-2026-tr" : undefined, countryCode: event.target.value === "digital" ? "TR" : undefined, prize: { ...selected.prize, kind: event.target.value as "aura" | "physical" | "digital", aura: event.target.value === "aura" ? Math.max(1, selected.prize.aura) : 0 } })}><option value="aura">Aura</option><option value="physical">Özel / fiziksel ödül — manuel teslim</option><option value="digital">Türkiye Sonbahar 2026 — ilk 3 rozet + katılım teması</option></select></label>
                  <label className={labelClass}>Etkinlik ülkesi (ISO kodu)<input className={inputClass} maxLength={2} pattern="[A-Z]{2}" disabled={selected.prize.kind === "digital"} value={selected.countryCode ?? ""} placeholder="TR" onChange={event => update({ countryCode: event.target.value.toUpperCase() || undefined })} /></label>
                </div>
                <p className="text-xs text-muted">TR: Türkiye, DE: Almanya, US: ABD. Boş bırakılan etkinlikler tüm ülkelere açıktır. Sonbahar 2026 dijital ödül tasarımı Türkiye'ye özeldir.</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className={labelClass}>Ödül adı<input required maxLength={200} className={inputClass} value={selected.prize.title} onChange={event => update({ prize: { ...selected.prize, title: event.target.value } })} /></label>
                  {selected.prize.kind === "aura" && <label className={labelClass}>Aura miktarı<input required type="number" min={1} max={1000000} step={1} className={cn(inputClass, "tabular-nums")} value={selected.prize.aura} onChange={event => update({ prize: { ...selected.prize, aura: Number(event.target.value) } })} /></label>}
                </div>
                <label className={labelClass}>Ödül açıklaması<textarea rows={3} maxLength={2000} className={inputClass} value={selected.prize.description} onChange={event => update({ prize: { ...selected.prize, description: event.target.value } })} /></label>
                <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="space-y-5">
                    <label className={labelClass}>Ödül görseli yükle<input type="file" accept="image/jpeg,image/png,image/webp" className={inputClass} onChange={event => upload(event.target.files?.[0], true)} /></label>
                    <label className={labelClass}>Ödül görseli adresi<input type="url" className={inputClass} value={selected.prize.imageUrl} onChange={event => update({ prize: { ...selected.prize, imageUrl: event.target.value } })} /></label>
                  </div>
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-surface-2 text-center text-xs text-muted">
                    {selected.prize.imageUrl ? <img src={selected.prize.imageUrl} alt="Ödül" className="size-full object-contain p-3" /> : <span className="px-4">Ödül görseli burada görünür</span>}
                  </div>
                </div>
                <Note><strong className="text-ink">Otomatik dağıtım:</strong> {selected.prize.kind === 'aura' ? 'Birinci olan uygun hesaba belirtilen Aura tutarı.' : selected.prize.kind === 'digital' ? 'İlk üç farklı hesaba mevcut Sonbahar rozetleri. Geçerli katılımda geçici tema; kalıcı tema için kesintisiz 7 gün ve kapanışta yayında kalma koşulu.' : 'Otomatik Aura/rozet dağıtımı yok; ödül teslimatı panelden takip edilir.'}</Note>
              </div>

              <EventAboutEditor event={selected} key={selected.id || 'new'} sections={selected.aboutSections ?? []} disabled={busy || !!locked} onChange={aboutSections => update({ aboutSections })} onBusyChange={setBusy} />

              <div className="flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-end sm:justify-between">
                <label className={cn(labelClass, "sm:w-80")}>Yayın durumu<select className={inputClass} value={selected.status} onChange={event => update({ status: event.target.value as "draft" | "published" })}><option value="draft">Taslak</option><option value="published">Yayınla / başlangıçta otomatik göster</option>{selected.status === "completed" && <option value="completed">Tamamlandı</option>}</select></label>
                {!locked && <Button type="submit" disabled={busy}>{busy ? "Kaydediliyor…" : "Etkinliği kaydet"}</Button>}
              </div>
            </fieldset>
          </form>
        </Card>

        {selected.id && <Card className="space-y-5 p-5 sm:p-6">
          <CardHeader title="Katılımlar ve sonuç" description={`${entries.length} katılım gösteriliyor.`} />
          {selected.status === "published" && selected.endsAt <= now && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-warning-soft p-4"><p className="text-sm font-semibold text-warning">{canPickWinner ? "Etkinlik bitti. Sonucu onaylayınca ödül dağıtılır." : "Etkinlik bitti. Sonucu yalnızca bir admin onaylayabilir."}</p>{canPickWinner && <Button disabled={busy} onClick={() => void run(async () => { await completeEvent(selected.id); const all = await refresh(); const next = all.find(event => event.id === selected.id); if (next) await select(next); setMessage("Sonuç onaylandı. Aura ödülü varsa hesaba eklendi.") })}>Sonucu onayla ve ödülü ver</Button>}</div>}
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {selected.status === "completed" && <div><dt className="text-xs font-semibold text-muted">Kazanan gönderi</dt><dd className="mt-0.5 break-all text-ink">{selected.winnerPostId || "Uygun kazanan bulunamadı."}</dd></div>}
            {selected.winners?.map(winner => <div key={winner.rank}><dt className="text-xs font-semibold text-muted">{winner.rank}. sıra</dt><dd className="mt-0.5 break-all text-ink">{winner.postId}</dd></div>)}
            {selected.themeDelivery && <div><dt className="text-xs font-semibold text-muted">Katılım temaları</dt><dd className="mt-1"><Badge tone={selected.themeDelivery === "completed" ? "success" : "warning"}>{selected.themeDelivery === "completed" ? "Dağıtıldı" : "Dağıtılıyor"}</Badge></dd></div>}
            {selected.deliveryStatus && <div><dt className="text-xs font-semibold text-muted">Ödül teslimatı</dt><dd className="mt-1"><Badge tone={selected.deliveryStatus === "delivered" ? "success" : "warning"}>{selected.deliveryStatus === "delivered" ? "Teslim edildi" : "Teslim bekliyor"}</Badge></dd></div>}
          </dl>
          <div className="flex flex-wrap items-center gap-3">
            {winnerUid && <Link className="text-sm font-semibold text-accent underline-offset-4 hover:underline" to={`/users/${winnerUid}`}>Kazananın hesabını aç / teslimat takibi</Link>}
            {selected.deliveryStatus === "pending" && canConfirmPrize && <Button size="sm" variant="secondary" disabled={busy} onClick={() => void run(async () => { await markDelivered(selected.id); update({ deliveryStatus: "delivered" }); await refresh() })}>Teslim edildi olarak işaretle</Button>}
          </div>
          {!!selected.runwayFinalists?.length && <div className="space-y-2 rounded-xl bg-surface-2 p-4 text-sm"><h3 className="font-bold text-ink">Yapay zekâ podyumu için seçilen kombinler</h3>{selected.runwayFinalists.map(finalist => <p key={finalist.rank} className="break-all text-ink-soft">{finalist.rank}. sıra: {finalist.postId}</p>)}<p className="text-xs text-muted">Bu liste podyum üretimi içindir. Avatar görselleri etkinlik sonrasında hazırlanır.</p></div>}
          <label className={cn(labelClass, "max-w-xl")}>Yarışmadan çıkarma gerekçesi<input className={inputClass} maxLength={500} value={reason} placeholder="Çıkarmadan önce gerekçeyi yazın" onChange={event => setReason(event.target.value)} /></label>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 2xl:grid-cols-4">{entries.map(entry => <article key={entry.post.id} className="min-w-0 space-y-2">
            <div className="relative overflow-hidden rounded-2xl bg-surface-2">
              <img src={entry.post.media[0]?.url} alt={entry.post.caption || "Katılan kombin"} loading="lazy" className={cn("aspect-[3/4] w-full object-contain", entry.disqualified && "opacity-40 grayscale")} />
              {entry.disqualified && <Badge tone="danger" className="absolute left-2 top-2">Yarışmadan çıkarıldı</Badge>}
            </div>
            <div className="flex items-baseline justify-between gap-2"><p className="truncate text-sm font-semibold text-ink">{entry.post.isAnonymous ? "Anonim katılımcı" : entry.post.author?.displayName}</p><p className="shrink-0 text-xs tabular-nums text-muted">{entry.likes} beğeni</p></div>
            {entry.post.caption && <p className="line-clamp-2 text-xs text-ink-soft">{entry.post.caption}</p>}
            {!entry.disqualified && selected.status !== "completed" && <Button size="sm" variant="secondary" disabled={busy || !reason.trim()} title={!reason.trim() ? "Önce gerekçeyi yazın" : undefined} onClick={() => void run(async () => { await disqualifyEntry(selected.id, entry.post.id, reason); await select(selected) })}>Yarışmadan çıkar</Button>}
          </article>)}</div>
          {!entries.length && <p className="rounded-2xl border border-dashed border-line-strong p-6 text-center text-sm text-muted">Henüz katılım yok. Etkinlik yayında olduğunda gönderilen kombinler burada görünür.</p>}
          {entryCursor && <div className="flex justify-center"><Button variant="secondary" disabled={busy} onClick={() => void run(async () => { const page = await listEntries(selected.id, entryCursor); setEntries(old => [...old, ...page.items.filter(item => !old.some(existing => existing.post.id === item.post.id))]); setEntryCursor(page.cursor) })}>Daha fazla göster</Button></div>}
        </Card>}
      </div>
    </div>
  </section>
}
