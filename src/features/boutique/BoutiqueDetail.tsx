import { useAuth } from "../auth/useAuth";
import { TeamSettings } from "./TeamSettings";
import { AISettings } from "./AISettings";
import { PromotionSettings } from "./PromotionSettings";
import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Button } from "../../components/atoms/Button";
import { Badge, type BadgeTone } from "../../components/atoms/Badge/Badge";
import { Input } from "../../components/atoms/Input";
import { Card, CardHeader } from "../../components/molecules/Card";
import {
  CHART_COLORS,
  chartAxisStyle,
  chartGridStyle,
  chartTooltipStyle,
} from "../../lib/charts/chartTheme";
import { cn } from "../../lib/utils";
import {
  boutiqueRequest,
  type BoutiqueDetailData,
  type BoutiqueAnalytics,
  type BoutiqueEntity,
} from "../../lib/api/boutique";
import { Select } from "../../components/molecules/Select";

const eventLabels: Record<string, string> = {
  session_start: "Oturum başlangıcı",
  collection_open: "Koleksiyon açılışı",
  product_click: "Ürün tıklaması",
  outfit_click: "Kombin tıklaması",
  try_start: "Deneme başlangıcı",
  photo_capture: "Fotoğraf çekimi",
  demo_result: "Demo sonucu",
  qr_open: "Ekranda QR penceresi açılışı",
  qr_landing_open: "Telefonda QR bağlantısı açılışı",
  qr_app_open: "Uygulamayı aç butonu",
  qr_app_store_click: "App Store yönlendirmesi",
  qr_play_store_click: "Google Play yönlendirmesi",
  qr_connected: "Tamamlanan hesap bağlantısı",
  filter_change: "Filtre değişimi",
};
const sourceLabels: Record<string, string> = {
  native: "Ekran uygulaması",
  "qr-mobile": "QR üzerinden telefon",
  web: "Web",
  "native-demo": "Demo uygulaması",
};
const labels: Record<string, string> = {
  id: "Kayıt kimliği",
  name: "Ad",
  email: "E-posta",
  phone: "Telefon",
  address: "Adres",
  mobileUrl: "Mobil bağlantı",
  logo: "Logo",
  category: "Kategori",
  price: "Fiyat",
  stock: "Stok",
  sku: "SKU",
  color: "Renk",
  material: "Kumaş",
  sizes: "Bedenler",
  fit: "Kalıp",
  season: "Sezon",
  care: "Bakım",
  description: "Açıklama",
  status: "Durum",
  image: "Görsel dosyası",
  cell: "Görsel hücresi",
  productIds: "Ürünler",
  outfitIds: "Kombinler",
  mediaIds: "Medya",
  url: "Dosya adresi",
  type: "Tür",
  seconds: "Süre (sn)",
  location: "Konum",
  orientation: "Yön",
  theme: "Tema",
  behavior: "Davranış ve süre ayarları",
  accent: "Vurgu rengi",
  background: "Arka plan",
  text: "Yazı rengi",
  showPrices: "Fiyatları göster",
  headline: "Başlık",
  subtitle: "Alt başlık",
  cta: "Dokunma çağrısı",
  mediaDurations: "Medya süreleri",
  idleSeconds: "Boşta bekleme (sn)",
  enabled: "Etkin",
};
const tabs = {
  team: "Ekip ve kullanıcı limiti",
  analytics: "Analizler",
  promotion: "QR ve mobil uygulama",
  ai: "Yapay zekâ özellikleri",
  products: "Ürünler",
  outfits: "Kombinler",
  media: "Medya",
  screens: "Ekranlar",
  boutique: "Butik bilgileri",
  activity: "İşlem geçmişi",
};
type Tab = keyof typeof tabs;
const stamp = (value: string | number | null | undefined) =>
  value ? new Date(value).toLocaleString("tr-TR") : "—";
const money = (value: unknown) =>
  typeof value === "number"
    ? new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
      }).format(value)
    : "—";
function download(name: string, data: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function valueText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Açık" : "Kapalı";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}
const isImageSource = (value: unknown): value is string =>
  typeof value === "string" && /^(https?:\/\/|data:image\/|\/)/.test(value);
function thumbnail(item: BoutiqueEntity) {
  if (item.type === "video") return undefined;
  return [item.image, item.url, item.logo].find(isImageSource);
}
function Fields({
  item,
  resolve,
}: {
  item: Record<string, unknown>;
  resolve?: (id: string) => string;
}) {
  return (
    <dl className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
      {Object.entries(item).map(([key, value]) => (
        <div key={key} className="min-w-0">
          <dt className="text-xs font-semibold text-muted">
            {labels[key] || key}
          </dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-ink">
            {key === "price"
              ? money(value)
              : key.endsWith("Ids") && Array.isArray(value)
                ? value.map((id) => resolve?.(String(id)) || id).join(", ") ||
                  "—"
                : valueText(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
function Table({
  heads,
  rows,
}: {
  heads: string[];
  rows: ReactNode[][];
}) {
  // Columns whose cells are all numbers are right-aligned with tabular figures.
  const numeric = heads.map(
    (_, j) => rows.length > 0 && rows.every((row) => typeof row[j] === "number"),
  );
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-2">
          <tr>
            {heads.map((h, j) => (
              <th key={h} className={cn("whitespace-nowrap px-4 py-3 text-xs font-semibold text-muted", numeric[j] && "text-right")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-line hover:bg-surface-2/60">
              {row.map((v, j) => (
                <td key={j} className={cn("px-4 py-3 text-ink-soft", j === 0 && "font-medium text-ink", numeric[j] && "text-right tabular-nums")}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td
                colSpan={heads.length}
                className="p-8 text-center text-sm text-muted"
              >
                Bu seçim için kayıt yok. Dönemi veya filtreleri değiştirmeyi deneyin.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-2xl font-extrabold leading-none tracking-tight tabular-nums text-ink">{value}</p>
      <p className="mt-1.5 text-xs font-medium text-muted">{label}</p>
    </div>
  );
}
export function BoutiqueDetail({ id }: { id: string }) {
  const [tab, setTab] = useState<Tab>("analytics");
  // AI settings are a system setting on the boutique server (system.manage).
  const canManageSystem = useAuth().can("system.manage");
  const [days, setDays] = useState(7);
  const [screen, setScreen] = useState("");
  const [source, setSource] = useState("");
  const [search, setSearch] = useState("");
  const detail = useQuery({
    queryKey: ["boutique", "detail", id],
    refetchInterval:60000,
    refetchIntervalInBackground:false,
    queryFn: () =>
      boutiqueRequest<BoutiqueDetailData>(
        `/boutiques/${encodeURIComponent(id)}`,
      ),
    staleTime: 60000,
    retry: 1,
  });
  const analytics = useQuery({
    queryKey: ["boutique", "analytics", id, days, screen, source],
    queryFn: () =>
      boutiqueRequest<BoutiqueAnalytics>(
        `/boutiques/${encodeURIComponent(id)}/analytics?${new URLSearchParams({ days: String(days), screen, source })}`,
      ),
    enabled: tab === "analytics",
    staleTime: 60000,
    retry: 1,
  });
  if (detail.isPending)
    return <p role="status" className="border-t border-line pt-6 text-sm text-muted">Butik verileri yükleniyor…</p>;
  if (detail.error)
    return (
      <div role="alert" className="flex animate-pop-in flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger">
        <p><strong className="font-semibold">{detail.error.message}</strong> Yeniden deneyin veya başka bir butik seçin.</p>
        <Button size="sm" variant="secondary" onClick={() => void detail.refetch()}>Yeniden dene</Button>
      </div>
    );
  const d = detail.data,
    s = d.state,
    a = analytics.data;
  const names = new Map(
    [...s.products, ...s.outfits, ...s.media, ...s.screens].map((x) => [
      x.id,
      x.name,
    ]),
  );
  const resolve = (key: string) => names.get(key) || key;
  const entities = (
    ["products", "outfits", "media", "screens"].includes(tab)
      ? s[tab as "products" | "outfits" | "media" | "screens"]
      : []
  ) as BoutiqueEntity[];
  const filtered = entities.filter((x) =>
    JSON.stringify(x)
      .toLocaleLowerCase("tr-TR")
      .includes(search.toLocaleLowerCase("tr-TR")),
  );
  const ranks = (kind: string) =>
    a?.entities
      .filter((e) => e.kind === kind)
      .map((e) => [
        e.name,
        sourceLabels[e.source] || e.source,
        e.clicks,
        e.tries,
        e.qr,
      ]) ?? [];
  const connection = (screenId: string): [string, BadgeTone] => {
    const device = d.devices.find((x) => x.id === screenId);
    if (!device) return ["Eşleşmemiş", "neutral"];
    const online = !!device.lastSeen && detail.dataUpdatedAt - Date.parse(device.lastSeen) < 420000;
    return online ? ["Çevrimiçi", "success"] : ["Sinyal yok", "warning"];
  };
  return (
    <section
      className="space-y-5 border-t border-line pt-6"
      aria-label="Seçilen butik detayları"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words text-2xl font-bold text-ink">
            {String(s.boutique.name || "Butik")}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {String(s.boutique.email || "")} · Kayıt: {stamp(d.createdAt)} ·
            Veri sürümü: {d.revision}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={detail.isFetching || analytics.isFetching}
            onClick={() => {
              void detail.refetch();
              if (tab === "analytics") void analytics.refetch();
            }}
          >
            <RefreshCw aria-hidden="true" className={cn("size-3.5", (detail.isFetching || analytics.isFetching) && "animate-spin")} />
            Verileri yenile
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => download(`butik-${id}.json`, d)}
          >
            <Download aria-hidden="true" className="size-3.5" />
            Verileri indir
          </Button>
        </div>
      </div>
      <Card className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-4">
        {(
          [
            ["Ürün", s.products.length],
            ["Kombin", s.outfits.length],
            ["Medya", s.media.length],
            ["Ekran", s.screens.length],
          ] as const
        ).map(([label, n]) => (
          <Stat key={label} label={label} value={n} />
        ))}
      </Card>
      <div
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
        role="group"
        aria-label="Butik veri bölümleri"
      >
        {Object.entries(tabs)
          .filter(([key]) => key !== "ai" || canManageSystem)
          .map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={tab === key}
              onClick={() => {
                setTab(key as Tab);
                setSearch("");
              }}
              className={cn(
                "h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors duration-150",
                tab === key
                  ? "bg-ink text-canvas"
                  : "border border-line bg-surface text-ink-soft hover:bg-surface-2 hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
      </div>
      <Card tone="quiet" className="space-y-3 p-5">
        <CardHeader title="Ekran ve uygulama durumu" />
        <Table
          heads={["Ekran", "Bağlantı", "Uygulama", "Son sinyal"]}
          rows={s.screens.map((screen) => {
            const device = d.devices.find((x) => x.id === screen.id);
            const online = !!device?.lastSeen && detail.dataUpdatedAt - Date.parse(device.lastSeen) < 420000;
            const fresh = online && !!device?.appStateAt && detail.dataUpdatedAt - Date.parse(device.appStateAt) < 420000;
            const [label, tone] = connection(screen.id);
            return [
              screen.name,
              <Badge key="c" tone={tone}>{label}</Badge>,
              fresh ? (device?.appState === "active" ? "Açık / ön planda" : device?.appState === "background" ? "Arka planda" : "Bilinmiyor") : "Bilinmiyor",
              stamp(device?.lastSeen),
            ];
          })}
        />
        <p className="text-xs leading-relaxed text-muted">Cihaz 5 dakikada bir sinyal gönderir. 7 dakika sinyal gelmezse durum bilinmiyor olarak gösterilir; cihazın kapalı olması veya internetin kesilmesi ayırt edilemez.</p>
      </Card>
      {tab === "ai" && canManageSystem && <AISettings id={id} />}
      {tab === "team" && <TeamSettings id={id} />}
      {tab === "promotion" && <PromotionSettings id={id} onSaved={() => { void detail.refetch(); }} />}
      {tab === "analytics" && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            <label className="text-sm font-semibold text-ink">
              Dönem
              <Select
                className="ml-2 h-9 px-3"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              >
                {[1, 7, 30, 90].map((n) => (
                  <option key={n} value={n}>
                    Son {n} gün
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-sm font-semibold text-ink">
              Ekran
              <Select
                className="ml-2 h-9 px-3"
                value={screen}
                onChange={(e) => setScreen(e.target.value)}
              >
                <option value="">Tüm ekranlar</option>
                {s.screens.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-sm font-semibold text-ink">
              Kaynak
              <Select
                className="ml-2 h-9 px-3"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="">Tüm kaynaklar</option>
                {Object.entries(sourceLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          {analytics.isPending ? (
            <p role="status" className="text-sm text-muted">Analizler yükleniyor…</p>
          ) : analytics.error ? (
            <div role="alert" className="flex animate-pop-in flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger">
              <p className="font-semibold">{analytics.error.message}</p>
              <Button size="sm" variant="secondary" onClick={() => void analytics.refetch()}>Yeniden dene</Button>
            </div>
          ) : (
            a && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                  <p>
                    {stamp(a.from)} – {stamp(a.to)} · {a.events} olay ·{" "}
                    {a.sessions} oturum (tekil müşteri sayısı değildir)
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-semibold text-accent underline-offset-4 hover:underline"
                    onClick={() => download(`butik-${id}-analiz.json`, a)}
                  >
                    <Download aria-hidden="true" className="size-3.5" />
                    Analizleri indir
                  </button>
                </div>
                {!a.events && (
                  <p className="rounded-xl bg-surface-2 p-4 text-sm text-ink-soft">
                    Seçilen dönemde ve filtrelerde kaydedilmiş etkileşim yok. Daha uzun bir dönem veya “Tüm ekranlar” seçmeyi deneyin.
                  </p>
                )}
                <Card className="p-5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <p className="text-3xl font-extrabold leading-none tracking-tight tabular-nums text-ink">{a.qrVisitors || 0}</p>
                    <p className="text-sm font-semibold text-ink">QR üzerinden tekil ziyaret oturumu</p>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted">Seçili butiğe ve ekrana ait QR ziyaretleri gösterilir. Aynı tarayıcı sekmesindeki tekrarlar tekilleştirilir; bu sayı kesin kişi sayısı değildir. App Store ve Google Play sayıları indirme butonu tıklamalarıdır, tamamlanan indirme değildir. Gerçek indirmeler henüz ölçülmüyor. Hesap bağlantısı, uygulamada onaylanıp mağaza ekranına ulaşan bağlantıdır.</p>
                </Card>
                <Card tone="quiet" className="grid grid-cols-2 gap-x-5 gap-y-6 p-5 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7">
                  {Object.entries(eventLabels).map(([key, label]) => (
                    <Stat key={key} label={label} value={a.totals[key] || 0} />
                  ))}
                </Card>
                <Card className="p-5">
                  <CardHeader title="Günlük etkileşimler" className="mb-4" />
                  <div
                    className="h-64"
                    role="img"
                    aria-label="Günlük kaydedilen olay sayıları"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={a.daily}>
                        <CartesianGrid {...chartGridStyle} vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(v) => String(v).slice(5)}
                          {...chartAxisStyle}
                        />
                        <YAxis allowDecimals={false} {...chartAxisStyle} />
                        <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "var(--surface-2)" }} />
                        <Bar
                          dataKey="count"
                          name="Etkileşim"
                          fill={CHART_COLORS.primary}
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                <h3 className="pt-2 text-base font-bold text-ink">
                  Ürün performansı · deneme sayısına göre
                </h3>
                <Table
                  heads={["Ürün", "Kaynak", "Tıklama", "Deneme", "QR"]}
                  rows={ranks("product")}
                />
                <h3 className="pt-2 text-base font-bold text-ink">
                  Kombin performansı · deneme sayısına göre
                </h3>
                <Table
                  heads={["Kombin", "Kaynak", "Tıklama", "Deneme", "QR"]}
                  rows={ranks("outfit")}
                />
                <h3 className="pt-2 text-base font-bold text-ink">Ekran performansı</h3>
                <Table
                  heads={["Ekran", "Olay", "Tıklama", "Deneme", "QR penceresi", "QR ziyareti", "Mağazaya yönlendirme", "Hesap bağlantısı"]}
                  rows={a.screens.map((e) => [
                    resolve(e.id),
                    e.events,
                    e.clicks,
                    e.tries,
                    e.qr,
                    e.scans || 0,
                    e.storeClicks || 0,
                    e.connections || 0,
                  ])}
                />
                <h3 className="pt-2 text-base font-bold text-ink">Son 30 etkileşim</h3>
                <Table
                  heads={["Zaman", "Ekran", "İşlem", "Kaynak", "Ürün / kombin"]}
                  rows={a.recent.map((e) => [
                    stamp(e.at),
                    resolve(e.screen),
                    eventLabels[e.type] || e.type,
                    sourceLabels[e.source] || e.source,
                    e.entities.map((x) => x.name).join(", ") || "—",
                  ])}
                />
              </>
            )
          )}
        </div>
      )}
      {["products", "outfits", "media", "screens"].includes(tab) && (
        <div className="space-y-3">
          <Input
            aria-label="Butik verilerinde ara"
            className="w-full"
            placeholder="Ad, açıklama veya kayıt bilgisinde ara"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {!filtered.length && (
            <p className="rounded-2xl border border-dashed border-line-strong p-6 text-center text-sm text-muted">
              {search ? "Aramaya uyan kayıt yok. Farklı bir kelime deneyin." : "Bu bölümde henüz kayıt yok. Butik panelden eklediğinde burada görünür."}
            </p>
          )}
          {filtered.map((item) => {
            const device = d.devices.find((x) => x.id === item.id);
            const image = thumbnail(item);
            const showFrame = tab === "products" || tab === "outfits" || tab === "media";
            const [connectionLabel, connectionTone] = connection(item.id);
            return (
              <details
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-line bg-surface"
              >
                <summary className="flex cursor-pointer list-none items-center gap-4 p-3 pr-4 hover:bg-surface-2/60 [&::-webkit-details-marker]:hidden">
                  {showFrame && (
                    <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-2 text-xs text-muted">
                      {image ? (
                        <img
                          src={image}
                          alt=""
                          width={64}
                          height={64}
                          loading="lazy"
                          className="size-full object-cover"
                          onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
                        />
                      ) : (
                        item.type === "video" ? "Video" : "—"
                      )}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink">{item.name}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      {tab === "products" ? (
                        <>
                          <span className="tabular-nums">{money(item.price)} · Stok: {String(item.stock)}</span>
                          <Badge tone={item.status === "active" ? "success" : "neutral"}>{item.status === "active" ? "Aktif" : "Taslak"}</Badge>
                        </>
                      ) : tab === "outfits" ? (
                        `${Array.isArray(item.productIds) ? item.productIds.length : 0} ürün`
                      ) : tab === "media" ? (
                        `${item.type === "video" ? "Video" : "Görsel"} · ${item.seconds ?? 0} sn`
                      ) : (
                        <>
                          <Badge tone={item.enabled ? "success" : "neutral"}>{item.enabled ? "Etkin" : "Kapalı"}</Badge>
                          <Badge tone={connectionTone}>{connectionLabel}</Badge>
                        </>
                      )}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-lg leading-none text-muted transition-transform duration-200 ease-[var(--ease-panel)] group-open:rotate-90">›</span>
                </summary>
                {tab === "screens" && (
                  <div className="border-t border-line p-4 text-sm text-ink">
                    <p className="font-semibold">
                      {!device?'Eşleşmemiş':!device.lastSeen||detail.dataUpdatedAt-Date.parse(device.lastSeen)>420000?'Bağlantı yok · Durum bilinmiyor':device.appStateAt&&detail.dataUpdatedAt-Date.parse(device.appStateAt)<420000?(device.appState==='active'?'Çevrimiçi · Uygulama açık':device.appState==='background'?'Çevrimiçi · Uygulama arka planda':'Çevrimiçi · Uygulama durumu bilinmiyor'):'Çevrimiçi · Uygulama durumu bilinmiyor'}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      {device?.deviceReport && <span>{device.deviceReportAt && detail.dataUpdatedAt-Date.parse(device.deviceReportAt)>420000 ? 'Son bildirilen: ' : ''}{device.deviceReport.screenOn?'Ekran açık':'Ekran kapalı'} · {device.deviceReport.locked?'Kilitli':'Kilitsiz'} · {device.deviceReport.maintenance?'Bakım modu':device.deviceReport.kioskLocked?'Kiosk kilitli':'Kiosk kilitli değil'} · {device.deviceReport.deviceOwner?'Yönetilen cihaz':'Yönetim kurulmamış'} · Android {device.deviceReport.androidVersion} · {device.deviceReport.model}<br/>Cihaz bilgisi: {stamp(device.deviceReportAt)}<br/></span>}
                      Son bağlantı: {stamp(device?.lastSeen)} · Son yayın:{" "}
                      {stamp(device?.publishedAt)}
                    </p>
                  </div>
                )}
                <div className="border-t border-line">
                  {showFrame && image && (
                    <div className="px-5 pt-5">
                      <img src={image} alt={item.name} loading="lazy" className="max-h-80 w-auto rounded-2xl bg-surface-2 object-contain" />
                    </div>
                  )}
                  <Fields item={item} resolve={resolve} />
                </div>
              </details>
            );
          })}
        </div>
      )}
      {tab === "boutique" && (
        <Card>
          <Fields item={s.boutique} />
        </Card>
      )}
      {tab === "activity" && (
        <Table
          heads={["Zaman", "İşlem"]}
          rows={s.activity.map((e) => [stamp(e.time), e.text])}
        />
      )}
    </section>
  );
}
