

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { listRecords, type CollectionDto, type LookDto, type Resource } from "../../lib/admin/client";
import { Button, ErrorNotice, panelClass, PrivateImage, PublicationBadge } from "./ui";

type RecordDto = LookDto | CollectionDto;

export function RecordList({ resource }: { resource: Resource }) {
  const [items, setItems] = useState<RecordDto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<unknown>();
  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    const request = new AbortController();
    controller.current = request;
    lock.current = true;
    listRecords<RecordDto>(resource, undefined, request.signal).then((page) => {
      if (!request.signal.aborted) { setItems(page.items); setCursor(page.nextCursor); setLoaded(true); }
    }).catch((caught) => { if (!request.signal.aborted) setError(caught); }).finally(() => { if (!request.signal.aborted) { lock.current = false; setBusy(false); } });
    return () => request.abort();
  }, [resource]);

  async function more() {
    if (lock.current || (loaded && !cursor)) return;
    lock.current = true; setBusy(true); setError(undefined);
    const request = new AbortController();
    controller.current = request;
    try {
      const page = await listRecords<RecordDto>(resource, cursor ?? undefined, request.signal);
      if (request.signal.aborted) return;
      setItems((previous) => [...previous, ...page.items.filter((item) => !previous.some((existing) => existing.id === item.id))]);
      setCursor(page.nextCursor); setLoaded(true);
    } catch (caught) { if (!request.signal.aborted) setError(caught); }
    finally { if (!request.signal.aborted) { lock.current = false; setBusy(false); } }
  }

  useEffect(() => () => controller.current?.abort(), []);

  const isLooks = resource === "looks";
  return <div className="space-y-5">
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm text-muted">
      <p>Taslak, yayındaki ve arşivlenmiş kayıtlar. Her seferinde en fazla 20 kayıt yüklenir.</p>
      <p role="status" className="tabular-nums">{busy ? "Kayıtlar yükleniyor…" : loaded ? `${items.length} kayıt gösteriliyor` : "Liste yüklenemedi."}</p>
    </div>
    <ErrorNotice error={error} />
    {loaded && !items.length && <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center"><h2 className="font-bold text-ink">Henüz {isLooks ? "kombin" : "koleksiyon"} yok</h2><p className="mt-2 text-sm text-muted">İlk {isLooks ? "kombini" : "koleksiyonu"} oluşturmak için sayfa başındaki “{isLooks ? "Yeni kombin" : "Yeni koleksiyon"}” düğmesini kullanın.</p></div>}
    {isLooks ? <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">{items.map((item) => {
      const href = `/lookbook/${resource}/${encodeURIComponent(item.id)}`;
      const cover = "media" in item ? item.media[0] : undefined;
      return <li key={item.id} className="group min-w-0 space-y-3">
        <Link to={href} tabIndex={-1} aria-hidden="true" className="block overflow-hidden rounded-2xl bg-surface-2">
          {cover ? <PrivateImage lookId={item.id} storagePath={cover.storagePath} alt="" className="aspect-[3/4] w-full transition-transform duration-300 ease-out group-hover:scale-[1.02]" />
            : <div className="flex aspect-[3/4] w-full items-center justify-center text-sm text-muted">Görsel yok</div>}
        </Link>
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2"><PublicationBadge publication={item.webPublication} />{"code" in item && <span className="text-xs font-semibold text-muted">{item.code}</span>}</div>
          <h2 className="break-words text-[15px] font-bold leading-snug text-ink"><Link to={href} className="hover:text-accent">{item.title}</Link></h2>
          <p className="text-xs text-muted">Sürüm {item.revision} · <time dateTime={item.updatedAt}>{new Date(item.updatedAt).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}</time></p>
          <p className="break-all text-xs text-muted/80">ID: {item.id}</p>
        </div>
      </li>;
    })}</ul> : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <li key={item.id} className={`${panelClass} min-w-0 space-y-3`}>
      <PublicationBadge publication={item.webPublication} />
      <h2 className="break-words text-lg font-bold text-ink"><Link to={`/lookbook/${resource}/${encodeURIComponent(item.id)}`} className="hover:text-accent">{item.title}</Link></h2>
      {"lookIds" in item && <p className="text-sm text-ink-soft">{item.lookIds.length} kombin · /{item.slug}</p>}
      <p className="text-xs text-muted">Sürüm {item.revision} · Güncellendi: <time dateTime={item.updatedAt}>{new Date(item.updatedAt).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}</time></p>
      <p className="break-all text-xs text-muted/80">ID: {item.id}</p>
    </li>)}</ul>}
    {(!loaded || cursor) && <div className="flex justify-center"><Button secondary onClick={() => void more()} disabled={busy}>{busy ? "Yükleniyor…" : error ? "Tekrar dene" : "Daha fazla yükle"}</Button></div>}
  </div>;
}
