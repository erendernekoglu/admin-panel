import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router";
import { useAuth } from "../features/auth/useAuth";
import { ActorContext } from "../features/lookbook/actor";
import {
  AdminClientError,
  getLookbookSession,
  isUnsupportedOperationError,
  openLookbookSession,
  type LookbookSession,
} from "../features/lookbook/lib/admin/client";
import { RecordList } from "../features/lookbook/components/admin/RecordList";
import { LookEditor } from "../features/lookbook/components/admin/LookEditor";
import { CollectionEditor } from "../features/lookbook/components/admin/CollectionEditor";
import { Button, ErrorNotice, Field, inputClass, linkButtonAccentClass, linkButtonSecondaryClass } from "../features/lookbook/components/admin/ui";
import { ExternalLink, Plus } from "lucide-react";
import { PageHeader } from "../components/molecules/PageHeader";
import { isDemoMode } from "../lib/config";
import { cn } from "../lib/utils";

type View = "looks" | "collections" | "look" | "collection";

/** Optional public site URL for the "open on the web" action; never hard-coded. */
const configuredPublicSite = (): string => {
  const raw: unknown = import.meta.env.VITE_PUBLIC_SITE_URL;
  if (typeof raw !== "string") return "";
  const value = raw.trim();
  return /^https?:\/\//i.test(value) ? value : "";
};

export default function LookbookPage({ view = "looks" }: { view?: View }) {
  const { user } = useAuth();
  const { id } = useParams();
  const [session, setSession] = useState<LookbookSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [password, setPassword] = useState("");
  const publicSiteUrl = configuredPublicSite();

  useEffect(() => {
    let alive = true;
    setSession(null);
    setLoading(true);
    setError(undefined);
    getLookbookSession()
      .then((value) => {
        if (!alive) return;
        if (user?.uid && value.uid !== user.uid) {
          setError(new Error("Editör oturumu farklı bir hesapla açık. Yeniden giriş yapıp tekrar deneyin."));
          return;
        }
        setSession(value);
      })
      .catch((caught: unknown) => {
        if (!alive) return;
        // A missing session is expected before the editor opens one.
        if (!(caught instanceof AdminClientError && caught.status === 401)) setError(caught);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [user?.uid]);

  async function connect(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const value = await openLookbookSession(password ? { password } : {});
      if (user?.uid && value.uid !== user.uid) {
        throw new Error("Editör oturumu bu hesapla eşleşmiyor. Yeniden giriş yapıp tekrar deneyin.");
      }
      setSession(value);
      setPassword("");
    } catch (caught) {
      setError(
        caught instanceof AdminClientError && isUnsupportedOperationError(caught)
          ? new Error(
              "Bu yönetim API'si editör oturumu açma işlemini uygulamıyor. Tarayıcıda Google/SSO yeniden doğrulaması yapılmaz; yöneticinizden sunucu tarafındaki oturum uç noktasını etkinleştirmesini isteyin.",
            )
          : caught,
      );
    } finally {
      setBusy(false);
    }
  }

  const isLookView = view === "looks" || view === "look";
  const listResource = view === "looks" || view === "collections" ? view : null;
  const description = view === "looks" ? "Web sitesindeki kombinleri hazırla, sırala ve yayımla."
    : view === "collections" ? "Kombinleri koleksiyonlarda bir araya getir ve yayın sırasını belirle."
      : view === "look" ? "Kombinin görsellerini, parçalarını ve yayın durumunu düzenle."
        : "Koleksiyonun bilgilerini ve kombin sırasını düzenle.";
  const tabs = [
    { href: "/lookbook/looks", label: "Kombinler", current: isLookView },
    { href: "/lookbook/collections", label: "Koleksiyonlar", current: !isLookView },
  ];

  return <section className="space-y-6">
    <PageHeader
      title="Lookbook"
      description={description}
      actions={<>
        {publicSiteUrl
          ? <a href={publicSiteUrl} target="_blank" rel="noopener noreferrer" className={linkButtonSecondaryClass}>
              Web sitesinde aç<ExternalLink aria-hidden="true" className="size-4" />
            </a>
          : <span
              className={cn(linkButtonSecondaryClass, "cursor-not-allowed opacity-60")}
              aria-disabled="true"
              title="VITE_PUBLIC_SITE_URL yapılandırılmadığı için canlı site önizlemesi açılamıyor."
            >
              Canlı önizleme yapılandırılmadı
            </span>}
        {session && listResource && <Link to={`/lookbook/${listResource}/new`} className={linkButtonAccentClass}>
          <Plus aria-hidden="true" className="size-4" />{listResource === "looks" ? "Yeni kombin" : "Yeni koleksiyon"}
        </Link>}
      </>}
    />
    {isDemoMode && <p role="status" className="rounded-xl border border-line bg-surface-2 p-3 text-sm leading-relaxed text-ink-soft">
      Demo modu: kombinler, koleksiyonlar ve editör oturumu yalnızca bu sekmenin belleğinde tutulur. Değişiklikler sayfa yenilenince başlangıç verisine döner ve hiçbir ağ isteği gönderilmez.
    </p>}
    <nav aria-label="Lookbook bölümleri" className="inline-flex rounded-full border border-line bg-surface p-1">
      {tabs.map(tab => <Link key={tab.href} to={tab.href} aria-current={tab.current ? "page" : undefined} className={cn(
        "inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold transition-colors duration-150",
        tab.current ? "bg-ink text-canvas" : "text-ink-soft hover:bg-surface-2 hover:text-ink",
      )}>{tab.label}</Link>)}
    </nav>
    {loading ? <p role="status" className="text-sm text-muted">Editör yetkisi doğrulanıyor…</p> : !session ? <form onSubmit={connect} className="max-w-lg space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-card">
      <div className="space-y-2">
        <h2 className="text-lg font-bold text-ink">Editör oturumunu aç</h2>
        <p className="text-sm leading-relaxed text-muted">Web sitesindeki kombinleri ve koleksiyonları burada yönetebilirsin. Hesabında aktif editör yetkisi gerekir. Oturum doğrulaması yönetim API'sinde yapılır; bu panel tarayıcıda Google/SSO penceresi açmaz ve kendi başına oturum oluşturmaz.</p>
        <p className="text-sm leading-relaxed text-muted">Hesabın parolasız bir sağlayıcı kullanıyorsa bu formla yeniden doğrulanamaz. Yöneticinizden oturum uç noktasını etkinleştirmesini veya mevcut oturumla devam etmenizi isteyin.</p>
      </div>
      <ErrorNotice error={error} />
      <Field label="Şifre (isteğe bağlı)">{fieldId => <input id={fieldId} type="password" autoComplete="current-password" className={inputClass} value={password} onChange={event => setPassword(event.target.value)} disabled={busy} />}</Field>
      <Button accent type="submit" disabled={busy}>{busy ? "Doğrulanıyor…" : "Editör oturumunu aç"}</Button>
    </form> : <ActorContext.Provider value={session.uid}>
      {view === "looks" || view === "collections" ? <RecordList key={view} resource={view} />
        : view === "look" ? <LookEditor key={id ?? "new-look"} lookId={id} appChannelEnabled={session.appChannelEnabled} />
          : <CollectionEditor key={id ?? "new-collection"} collectionId={id} />}
    </ActorContext.Provider>}
  </section>;
}
