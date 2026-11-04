

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { adminFetch, AdminClientError, isConcurrencyConflict, resourcePath, type AdminRecordDto, type AppPublicationAction, type AppPublicationOutcome, type AppPublicationRequest, type AppPublicationResult, type CollectionDto, type DeleteMediaDto, type EditorialLookContent, type LookDto, type LookCollectionContent, type PublicationAction, type Resource } from "../../lib/admin/client";
import { assetIdFromPath } from "../../lib/looks/media";
import { PENDING_PREFIX, useAdminUid } from "../../actor";

type Content = EditorialLookContent | LookCollectionContent;
type RecordDto = LookDto | CollectionDto;
interface PendingCreate<T> {
  key: string;
  content: T;
  preparedId?: string;
  createdId?: string;
  submittedContent?: T;
  removedPaths: string[];
}
interface ActionRequest { action: PublicationAction; key: string; revision: number }

const appPublicationNotices: Record<AppPublicationOutcome, string> = {
  published: "Aktif web sürümü için uygulama yayını oluşturuldu. Web yayını değiştirilmedi.",
  updated: "Uygulama yayını aktif web sürümüyle güncellendi. Web yayını değiştirilmedi.",
  already_published: "Bu web sürümü için uygulama yayını zaten kayıtlı; yeni bir yayın oluşturulmadı.",
  withdrawn: "Uygulama yayını geri çekildi. Web yayını değiştirilmedi.",
  already_withdrawn: "Uygulama yayını zaten geri çekilmiş veya yayımlanmamış; web yayını değiştirilmedi.",
};

export function contentOf<T extends Content>(record: T & AdminRecordDto): T {
  if ("kind" in record) {
    const look = record as LookDto;
    return {
      title: look.title, kind: look.kind, caption: look.caption, media: look.media, tags: look.tags,
      ...(look.parts !== undefined ? { parts: look.parts } : {}),
      ...(look.occasionIds !== undefined ? { occasionIds: look.occasionIds } : {}),
      ...(look.styleNote !== undefined ? { styleNote: look.styleNote } : {}),
      ...(look.relatedLooks !== undefined ? { relatedLooks: look.relatedLooks } : {}),
      ...(look.outfitRef !== undefined ? { outfitRef: look.outfitRef } : {}),
    } as T;
  }
  const collection = record as CollectionDto;
  return { title: collection.title, slug: collection.slug, lookIds: collection.lookIds, ...(collection.description !== undefined ? { description: collection.description } : {}) } as T;
}

function isUncertain(error: unknown) {
  return !(error instanceof AdminClientError) || error.status === 0 || error.status >= 500;
}

export function useDirtyGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    // Admin navigation deliberately uses document links, so back, reload and links all use the browser's native guard.
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
}

export function useEditor<T extends Content>(resource: Resource, initialId: string | undefined, blank: T) {
  const navigate = useNavigate();
  const uid = useAdminUid();
  const storageKey = `${PENDING_PREFIX}${encodeURIComponent(uid)}:${resource}`;
  const pending = useRef<PendingCreate<T> | null>(null);
  const actionRequest = useRef<ActionRequest | null>(null);
  const appRequest = useRef<AppPublicationRequest | null>(null);
  const lock = useRef(false);
  const alive = useRef(true);
  const [ready, setReady] = useState(false);
  const [record, setRecord] = useState<(T & AdminRecordDto) | null>(null);
  const [content, setContent] = useState<T>(blank);
  const [baseline, setBaseline] = useState(JSON.stringify(blank));
  const [preparedId, setPreparedId] = useState<string>();
  const [removedPaths, setRemovedPaths] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState<"save" | PublicationAction | `app:${AppPublicationAction}` | null>(null);
  const [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState("");

  const load = useCallback(async (id: string, signal?: AbortSignal) => {
    const data = await adminFetch<{ look: T & AdminRecordDto } | { collection: T & AdminRecordDto }>(resourcePath(resource, id), { signal });
    return "look" in data ? data.look : data.collection;
  }, [resource]);

  useEffect(() => {
    const controller = new AbortController();
    alive.current = true;
    async function initialize() {
      try {
        if (initialId) {
          const value = await load(initialId, controller.signal);
          if (controller.signal.aborted) return;
          const draft = contentOf(value);
          setRecord(value); setContent(draft); setBaseline(JSON.stringify(draft));
        } else {
          const saved = sessionStorage.getItem(storageKey);
          const value: PendingCreate<T> = saved ? JSON.parse(saved) : { key: crypto.randomUUID(), content: blank, removedPaths: [] };
          if (!value || typeof value.key !== "string" || !value.content || !Array.isArray(value.removedPaths)) throw new Error("Bu sekmedeki bekleyen taslak okunamadı. Sekmeyi kapatmadan önce gerekli bilgileri kopyalayın.");
          pending.current = value;
          sessionStorage.setItem(storageKey, JSON.stringify(value));
          setContent(value.content); setPreparedId(value.preparedId); setRemovedPaths(value.removedPaths);
          if (value.submittedContent || value.createdId) {
            setUncertain("save");
            setNotice("Önceki oluşturma isteği bekliyor. Aynı içerik ve anahtarla sonucu almak için Kaydet / Tekrar dene düğmesini kullanın.");
          } else if (saved) setNotice("Bu sekmedeki bekleyen taslak geri yüklendi.");
        }
        if (!controller.signal.aborted) setReady(true);
      } catch (caught) { if (!controller.signal.aborted) setError(caught); }
    }
    void initialize();
    return () => { alive.current = false; controller.abort(); };
  }, [blank, initialId, load, storageKey]);

  const dirty = ready && (JSON.stringify(content) !== baseline || removedPaths.length > 0);
  useDirtyGuard(dirty || Boolean(busy) || Boolean(uncertain));

  function persist(value: PendingCreate<T>) {
    // Store before sending create requests: retries must survive an ambiguous response/reload.
    sessionStorage.setItem(storageKey, JSON.stringify(value));
    pending.current = value;
  }

  function change(next: T) {
    if (lock.current || uncertain || appRequest.current) return;
    setContent(next);
    setNotice("");
    if (pending.current && !record) {
      try { persist({ ...pending.current, content: next }); }
      catch { setError(new Error("Sekme depolaması kullanılamıyor. Girdiler bu sayfada korunuyor; oluşturma anahtarı güvenle saklanmadan yeni kayıt gönderilmeyecek.")); }
    }
  }

  function queueRemoval(paths: string[]) {
    if (lock.current || uncertain || appRequest.current) return;
    const next = [...new Set([...removedPaths, ...paths])];
    setRemovedPaths(next);
    if (pending.current && !record) {
      try { persist({ ...pending.current, removedPaths: next }); } catch (caught) { setError(caught); }
    }
  }

  function accept(value: T & AdminRecordDto) {
    const draft = contentOf(value);
    setRecord(value); setContent(draft); setBaseline(JSON.stringify(draft));
    setPreparedId(value.id);
    setUncertain(null); actionRequest.current = null; appRequest.current = null;
    if (pending.current) {
      sessionStorage.removeItem(storageKey);
      pending.current = null;
    }
  }

  async function cleanupMedia(id: string, paths: string[]) {
    if (resource !== "looks" || paths.length === 0) return;
    const remaining = [...paths];
    let retained = 0;
    let deferred = 0;
    try {
      for (const path of paths) {
        const result = await adminFetch<DeleteMediaDto>(`${resourcePath("looks", id)}/media/${encodeURIComponent(assetIdFromPath(id, path))}`, { method: "DELETE" });
        if (result.status === "retained") retained++;
        if (result.status === "pending") deferred++;
        remaining.splice(remaining.indexOf(path), 1);
        setRemovedPaths([...remaining]);
      }
      setNotice(`Kaydedildi.${retained ? ` ${retained} görsel kayıt/yayın tarafından kullanıldığı için korundu.` : ""}${deferred ? ` ${deferred} görselin silinmesi sunucuda bekliyor.` : ""}`);
    } catch (caught) {
      setNotice("İçerik kaydedildi; bazı görsellerin temizliği tamamlanmadı. Kaydet / Tekrar dene ile kalanları yeniden deneyebilirsiniz. Yayındaki görseller zorla silinmez.");
      throw caught;
    }
  }

  async function save(validated: T) {
    if (lock.current || appRequest.current || (uncertain && uncertain !== "save") || isConcurrencyConflict(error)) return;
    lock.current = true; setBusy("Kaydediliyor…"); setError(undefined); setNotice("");
    let rootSaved = false;
    try {
      let value: T & AdminRecordDto;
      if (record) {
        if (JSON.stringify(content) === baseline && removedPaths.length) value = record;
        else {
          const result = await adminFetch<{ look: T & AdminRecordDto } | { collection: T & AdminRecordDto }>(resourcePath(resource, record.id), { method: "PATCH", body: { expectedRevision: record.revision, content: validated } });
          value = "look" in result ? result.look : result.collection;
        }
      } else {
        if (!pending.current) throw new Error("Bekleyen oluşturma anahtarı bulunamadı. Yeniden yükleyin.");
        const request = { ...pending.current, submittedContent: pending.current.submittedContent ?? validated };
        persist(request);
        if (!request.createdId) {
          const response = await adminFetch<{ lookId: string; code: string; revision: number } | { collection: CollectionDto }>(resourcePath(resource), { method: "POST", body: { idempotencyKey: request.key, content: request.submittedContent } });
          request.createdId = "lookId" in response ? response.lookId : response.collection.id;
          persist(request);
        }
        value = await load(request.createdId);
      }
      rootSaved = true;
      accept(value);
      setNotice("Kaydedildi. Yayındaki sürüm yalnızca Yayımla işlemiyle güncellenir.");
      await cleanupMedia(value.id, removedPaths);
      // A cleanup retry already has a record, but still needs to leave the original /new route.
      if (!initialId && alive.current) navigate(`/lookbook/${resource}/${encodeURIComponent(value.id)}`, { replace: true });
    } catch (caught) {
      // A recoverable create rejection has no receipt, even if a prior response was uncertain.
      const rejectedCreate = !record && !pending.current?.createdId && caught instanceof AdminClientError &&
        caught.status === 409 && !isConcurrencyConflict(caught);
      if (!rootSaved && (isUncertain(caught) || (uncertain === "save" && !rejectedCreate))) setUncertain("save");
      else if (!rootSaved && pending.current && !pending.current.createdId) {
        const request = { ...pending.current };
        delete request.submittedContent;
        try { persist(request); } catch { /* Keep the original retry request if storage is unavailable. */ }
        setUncertain(null);
      } else if (rootSaved) setUncertain(null);
      setError(caught);
    } finally { lock.current = false; if (alive.current) setBusy(null); }
  }

  async function act(action: PublicationAction) {
    if (lock.current || appRequest.current || !record || dirty || (uncertain && uncertain !== action) || isConcurrencyConflict(error)) return;
    if (action === "archive" && !actionRequest.current && !window.confirm("Bu kaydı arşivlemek istediğinize emin misiniz? Bu işlem kalıcı silme değildir; yayından kaldırır.")) return;
    lock.current = true; setBusy(action === "publish" ? "Yayımlanıyor…" : "Arşivleniyor…"); setError(undefined); setNotice("");
    const request = actionRequest.current ?? { action, key: crypto.randomUUID(), revision: record.revision };
    actionRequest.current = request;
    try {
      const response = await adminFetch<{ result: unknown; look: T & AdminRecordDto } | { collection: T & AdminRecordDto }>(`${resourcePath(resource, record.id)}/${action}`, { method: "POST", body: { expectedRevision: request.revision, idempotencyKey: request.key } });
      accept("look" in response ? response.look : response.collection);
      setNotice(action === "publish" ? "Kaydedilmiş sürüm yayımlandı." : "Kayıt arşivlendi.");
    } catch (caught) {
      if (isUncertain(caught) || uncertain === action) setUncertain(action);
      else { actionRequest.current = null; setUncertain(null); }
      setError(caught);
    } finally { lock.current = false; if (alive.current) setBusy(null); }
  }

  async function actOnApp(action: AppPublicationAction) {
    const operation = `app:${action}` as const;
    if (resource !== "looks" || !ready || lock.current || !record || dirty || actionRequest.current ||
      (uncertain && uncertain !== operation) || isConcurrencyConflict(error)) return;
    if (appRequest.current && appRequest.current.action !== action) return;
    if (action === "publish" && record.webPublication.status !== "published") return;
    if (action === "withdraw" && record.appPublication?.status !== "published") return;
    if (action === "withdraw" && !appRequest.current && !window.confirm("Bu kombinin Uygulama / Keşfet yayınını geri çekmek istediğinize emin misiniz? Web yayını etkilenmez; web sürümü ve taslak değiştirilmez.")) return;
    // Freeze the entire command: an uncertain retry must not pick up a new revision or key.
    const request = appRequest.current ?? { action, expectedRevision: record.revision, idempotencyKey: crypto.randomUUID() };
    appRequest.current = request;
    lock.current = true; setBusy(action === "publish" ? "Uygulama yayını işleniyor…" : "Uygulama yayını geri çekiliyor…"); setError(undefined); setNotice("");
    try {
      const response = await adminFetch<{ result: AppPublicationResult; look: T & AdminRecordDto }>(`${resourcePath("looks", record.id)}/app-publication`, { method: "POST", body: request });
      const outcome = response.result?.outcome;
      const validOutcome = action === "publish"
        ? outcome === "published" || outcome === "updated" || outcome === "already_published"
        : outcome === "withdrawn" || outcome === "already_withdrawn";
      if (!validOutcome || response.look?.id !== record.id) throw new AdminClientError(0, "Uygulama yayını yanıtı doğrulanamadı. İşlem tamamlanmış olabilir; aynı isteği tekrar deneyin.");
      if (!alive.current) return;
      accept(response.look);
      setNotice(`${appPublicationNotices[outcome]} Keşfet görünürlüğü için aşağıdaki gerçek gönderi durumunu kontrol edin.`);
    } catch (caught) {
      if (!alive.current) return;
      if (isUncertain(caught) || uncertain === operation) setUncertain(operation);
      else { appRequest.current = null; setUncertain(null); }
      setError(caught);
    } finally { lock.current = false; if (alive.current) setBusy(null); }
  }

  async function reload() {
    if (lock.current || !window.confirm("Sunucudan yeniden yüklensin mi? Kaydedilmemiş alan değişiklikleri bırakılacak. Gerekli metinleri önce kopyalayın.")) return;
    const id = record?.id ?? initialId ?? pending.current?.createdId ?? preparedId;
    if (!id) { setError(new Error("Henüz sunucu kaydı yok. Mevcut girdiler korunuyor. Oluşturma isteğini aynı anahtarla yeniden deneyin.")); return; }
    lock.current = true; setBusy("Yeniden yükleniyor…");
    try {
      const value = await load(id);
      accept(value); setRemovedPaths([]); setError(undefined); setReady(true); setNotice("Sunucudaki güncel sürüm yüklendi.");
    } catch (caught) { setError(caught); }
    finally { lock.current = false; setBusy(null); }
  }

  async function withUpload(work: (id: string, key: string | undefined) => Promise<EditorialLookContent["media"][number]>) {
    if (lock.current || uncertain || appRequest.current || resource !== "looks" || isConcurrencyConflict(error)) return;
    lock.current = true; setBusy("Görsel yükleniyor…"); setError(undefined); setNotice("");
    try {
      let id = record?.id ?? preparedId;
      if (!id) {
        if (!pending.current) throw new Error("Oluşturma anahtarı bulunamadı.");
        persist(pending.current);
        const response = await adminFetch<{ lookId: string }>(`${resourcePath("looks")}/prepare`, { method: "POST", body: { idempotencyKey: pending.current.key } });
        id = response.lookId;
        persist({ ...pending.current, preparedId: id }); setPreparedId(id);
      }
      const media = await work(id, record ? undefined : pending.current?.key);
      if (!alive.current) return;
      const draft = content as EditorialLookContent;
      const next = { ...content, media: [...draft.media, media] };
      setContent(next);
      if (pending.current && !record) persist({ ...pending.current, content: next });
      setNotice("Görsel yüklendi. Galeri değişikliğini kaydetmeyi unutmayın.");
    } catch (caught) { if (alive.current) setError(caught); }
    finally { lock.current = false; if (alive.current) setBusy(null); }
  }

  return { ready, record, content, change, preparedId, dirty, busy, uncertain, error, setError, notice, save, act, actOnApp, reload, withUpload, queueRemoval, conflict: isConcurrencyConflict(error) };
}

export type EditorState<T extends Content> = ReturnType<typeof useEditor<T>>;
export type { RecordDto };
