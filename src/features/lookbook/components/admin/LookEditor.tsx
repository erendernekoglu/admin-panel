import { reorder } from "../../reorder";


import { useEffect, useRef, useState } from "react";
import { LOOK_MAX_MEDIA } from "../../lib/looks/feed";
import { OCCASIONS } from "../../lib/looks/occasions";
import { AdminClientError, uploadMedia, type EditorialLookContent } from "../../lib/admin/client";
import { validateLookContent } from "../../lib/looks/validation";
import { validateMediaOwnership } from "../../lib/looks/media";
import { EditorialError } from "../../lib/looks/errors";
import { ShoppingLinks } from "../looks/ShoppingLinks";
import { useAuth } from "../../../auth/useAuth";
import { EditorFrame } from "./EditorFrame";
import { LookFields } from "./LookFields";
import { useEditor, type EditorState } from "./useEditor";
import { Button, Field, inputClass, OrderButtons, panelClass, PrivateImage } from "./ui";

const EMPTY_LOOK: EditorialLookContent = { title: "", kind: "photo", caption: "", media: [], tags: [], parts: [], occasionIds: [], styleNote: "", relatedLooks: [] };

function referencedPaths(content: EditorialLookContent) {
  return new Set([...content.media.map((media) => media.storagePath), ...(content.parts ?? []).flatMap((part) => !part.hidden && part.storagePath ? [part.storagePath] : [])]);
}

export function LookEditor({ lookId, appChannelEnabled = false }: { lookId?: string; appChannelEnabled?: boolean }) {
  const editor = useEditor("looks", lookId, EMPTY_LOOK);
  const [preview, setPreview] = useState(false);
  const [role, setRole] = useState<"normal" | "try_on">("normal");
  const [progress, setProgress] = useState<number | null>(null);
  const upload = useRef<AbortController | null>(null);
  const id = editor.record?.id ?? editor.preparedId;
  const content = editor.content;
  useEffect(() => () => upload.current?.abort(), []);

  function change(next: EditorialLookContent) {
    const references = referencedPaths(next);
    const removed = [...referencedPaths(content)].filter((path) => !references.has(path));
    editor.change(next);
    if (removed.length) editor.queueRemoval(removed);
  }

  function save() {
    try {
      if (!content.title.trim()) throw new Error("Başlık boş bırakılamaz.");
      if (!content.media.length) throw new Error("Kaydetmeden önce en az bir normal kombin görseli yükleyin.");
      if (!content.media.some((media) => media.role !== "try_on")) throw new Error("Galeride en az bir normal kombin görseli olmalı; yalnızca deneme görselleriyle kaydedilemez.");
      if (content.tags.some((tag) => !tag.trim())) throw new Error("Boş etiketleri doldurun veya kaldırın.");
      if (content.parts?.some((part) => !part.hidden && (!part.name.trim() || !part.storagePath))) throw new Error("Görünür her parça için ad yazın ve galeri görseli seçin; kullanılmayan satırları kaldırın.");
      const validated = validateLookContent({ ...content, relatedLooks: content.relatedLooks?.map((item) => ({ lookId: item.lookId.trim(), ...(item.label?.trim() ? { label: item.label.trim() } : {}) })) });
      if (!id) throw new Error("Görsel yüklemesi tamamlanmadan kayıt oluşturulamaz.");
      validateMediaOwnership(validated, id);
      void editor.save(validated);
    } catch (caught) {
      editor.setError(caught instanceof EditorialError ? new AdminClientError(400, `İçerik doğrulanamadı${caught.field ? ` (${caught.field})` : ""}. Alanın uzunluğunu, kayıt ID’sini ve bu kombine ait görsel seçimini kontrol edin.`, caught.field) : caught);
      setPreview(false);
    }
  }

  async function chooseFile(file: File) {
    if (content.media.length >= LOOK_MAX_MEDIA) return;
    if (!file.size || file.size > 4 * 1024 * 1024) { editor.setError(new Error("Boş olmayan, en fazla 4 MiB büyüklüğünde bir dosya seçin.")); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { editor.setError(new Error("Yalnızca JPEG, PNG ve WebP görseller yüklenebilir.")); return; }
    await editor.withUpload(async (targetId, key) => {
      const controller = new AbortController();
      upload.current = controller;
      setProgress(0);
      try {
        const result = await uploadMedia(targetId, file, role, key, setProgress, controller.signal);
        return result.media;
      } finally { setProgress(null); upload.current = null; }
    });
  }

  return <EditorFrame editor={editor} resource="looks" title={lookId || editor.record ? "Kombini düzenle" : "Yeni kombin"} onSave={save} preview={preview} onPreview={() => setPreview((value) => !value)} publicationPanel={appChannelEnabled ? <AppPublicationPanel editor={editor} /> : <section className={panelClass} aria-labelledby="look-app-publication"><h2 id="look-app-publication" className="text-lg font-bold text-ink">Uygulama / Keşfet</h2><p className="mt-3 text-sm text-muted">Bu sürüm yalnızca web yayını içindir. Uygulama / Keşfet işlemleri kapalıdır; web yayınını aşağıdaki kontrollerden yönetebilirsiniz.</p></section>}>
    {preview ? <LookPreview content={content} lookId={id} /> : <>
      <section className={`${panelClass} space-y-5`} aria-labelledby="look-gallery">
        <div className="space-y-2"><h2 id="look-gallery" className="text-lg font-bold text-ink">Galeri ({content.media.length}/{LOOK_MAX_MEDIA})</h2><p className="text-sm text-muted">JPEG, PNG veya WebP · en fazla 4 MiB/dosya · toplam {LOOK_MAX_MEDIA} görsel. En az bir normal görsel gerekir. İlk görsel liste kapağıdır. Görseller yalnızca yetkili admin oturumuyla gösterilir.</p></div>
        <div className="grid items-end gap-4 sm:grid-cols-2"><Field label="Yeni görselin rolü">{(fieldId) => <select id={fieldId} className={inputClass} value={role} onChange={(event) => setRole(event.target.value === "try_on" ? "try_on" : "normal")}><option value="normal">Normal kombin görseli</option><option value="try_on">Deneme görseli</option></select>}</Field><Field label="Görsel yükle" hint="Dosya seçildiğinde yükleme başlar. Sunucu dosya türünü ve boyutlarını ayrıca doğrular.">{(fieldId, hint) => <input id={fieldId} aria-describedby={hint} className={`${inputClass} file:mr-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-ink`} type="file" accept="image/jpeg,image/png,image/webp" disabled={content.media.length >= LOOK_MAX_MEDIA} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void chooseFile(file); }} />}</Field></div>
        {progress !== null && <div className="space-y-2" role="status"><label htmlFor="upload-progress" className="text-sm">{progress < 100 ? `Yükleniyor: %${progress}` : "Dosya gönderildi (%100). Sunucu görseli işliyor…"}</label><progress id="upload-progress" max={100} value={progress} className="block h-2 w-full accent-accent" /></div>}
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{content.media.map((media, index) => <li key={media.storagePath} className="min-w-0 space-y-3 rounded-2xl border border-line bg-surface-2/40 p-3">{id && <PrivateImage lookId={id} storagePath={media.storagePath} alt={`${content.title || "Kombin"} · Görsel ${index + 1}`} className="aspect-[3/4] w-full" />}<p className="text-sm font-semibold text-ink">{index + 1}. görsel · {media.width} × {media.height}</p><Field label={`Görsel ${index + 1} rolü`}>{(fieldId) => <select id={fieldId} className={inputClass} value={media.role ?? "look"} onChange={(event) => change({ ...content, media: content.media.map((value, position) => position === index ? { ...media, role: event.target.value === "try_on" ? "try_on" : "look" } : value) })}><option value="look">Normal</option><option value="try_on">Deneme</option></select>}</Field><OrderButtons index={index} length={content.media.length} label={`Görsel ${index + 1}`} onMove={(to) => change({ ...content, media: reorder(content.media, index, to) })} onRemove={() => change({ ...content, media: content.media.filter((_, position) => position !== index) })} /></li>)}</ol>
        <p className="text-sm text-muted">Kaldırma ve sıralama önce yalnızca taslağı değiştirir. Kaydetme başarılı olunca kullanılmayan görseller için silme istenir; yayında veya parçalarda kullanılan görseller sunucu tarafından korunur.</p>
      </section>
      <LookFields content={content} onChange={change} />
    </>}
  </EditorFrame>;
}

function AppPublicationPanel({ editor }: { editor: EditorState<EditorialLookContent> }) {
  const { record, busy, dirty, uncertain, conflict } = editor;
  const canPublish = useAuth().can("lookbook.publish");
  const publication = record?.appPublication;
  const webPublished = record?.webPublication.status === "published";
  const appPublished = publication?.status === "published";
  const disabled = !editor.ready || !record || dirty || Boolean(busy) || conflict;
  const feedStatus = record?.appFeedStatus;

  return <section className={`${panelClass} space-y-4`} aria-labelledby="look-app-publication">
    <h2 id="look-app-publication" className="text-lg font-bold text-ink">Uygulama / Keşfet</h2>
    <p className="text-sm text-muted">Web yayınından ayrı yönetilir. Yayımlama ve güncelleme yalnızca aktif web sürümünü kullanır; kaydedilmiş veya kaydedilmemiş taslak otomatik aktarılmaz. Web sürümünü yeniden yayımlamak da uygulama yayınını otomatik güncellemez.</p>
    <dl className="space-y-3 text-sm">
      <div><dt className="font-semibold text-ink">Yayın kaydı (niyet)</dt><dd className="mt-0.5 text-ink-soft">{publication ? ({ not_published: "Yayınlanmadı", published: "Keşfet yayını kayıtlı", withdrawn: "Kaldırıldı" })[publication.status] : record ? "Uygulama yayın bilgisi bu yanıtta yok; sunucudan yeniden yükleyin." : "Önce kombini kaydedin."}</dd></div>
      <div><dt className="font-semibold text-ink">Gerçek Keşfet gönderi durumu</dt><dd className="mt-0.5 text-ink-soft">{publication?.status === "not_published" ? "Henüz Keşfet gönderisi oluşturulmadı." : feedStatus ? ({ published: "Keşfet’te yayında", hidden: "Gizli; Keşfet’te görünmüyor", removed: "Kaldırılmış; Keşfet’te görünmüyor", missing: "Gönderi bulunamadı; Keşfet’te görünmüyor" })[feedStatus] : "Bilinmiyor. Yayın kaydı tek başına Keşfet’te görünür olduğu anlamına gelmez; güncel gönderi durumu için sunucudan yeniden yükleyin."}</dd></div>
    </dl>
    {feedStatus && <p className="text-sm text-muted">Gönderi durumu sunucudan son alınan bilgidir. Moderasyon, yayın kaydından bağımsız olarak görünürlüğü kısıtlayabilir; yeniden yayımlamak moderasyon kararını aşmaz.</p>}
    {appPublished && webPublished && <p className="text-sm text-muted">{publication.revisionId && record?.webPublication.revisionId
      ? publication.revisionId === record.webPublication.revisionId
        ? "Uygulama yayın kaydı aktif web sürümüyle eşleşiyor. Bu, Keşfet görünürlüğünü garanti etmez."
        : "Uygulama yayın kaydı farklı bir web sürümünü kullanıyor. Aktif web sürümünü aktarmak için güncelleyin."
      : "Yayın sürümleri bu yanıttaki bilgilerle karşılaştırılamıyor."}</p>}
    {!webPublished && <p className="text-sm text-muted">Uygulamada yayımlamak veya güncellemek için önce web sürümünü yayımlayın. Mevcut uygulama yayını, web sürümü arşivde olsa da geri çekilebilir.</p>}
    {dirty && <p className="text-sm text-muted">Kaydedilmemiş değişiklikler veya bekleyen görsel temizliği var. Uygulama işlemlerinden önce taslağı kaydedin; kaydetmek aktif web sürümünü değiştirmez.</p>}
    {!canPublish && <p className="text-sm text-muted">Keşfet yayını admin'e açıktır.</p>}
    {canPublish && <div className="flex flex-wrap gap-3">
      <Button secondary disabled={disabled || !webPublished || (Boolean(uncertain) && uncertain !== "app:publish")} onClick={() => void editor.actOnApp("publish")}>
        {uncertain === "app:publish" ? "Uygulama yayınını tekrar dene" : appPublished ? "Keşfet gönderisini güncelle" : "Keşfet’te yayınla"}
      </Button>
      <Button secondary disabled={disabled || !appPublished || (Boolean(uncertain) && uncertain !== "app:withdraw")} onClick={() => void editor.actOnApp("withdraw")}>
        {uncertain === "app:withdraw" ? "Geri çekmeyi tekrar dene" : "Keşfet’ten kaldır"}
      </Button>
    </div>}
    <p className="text-sm text-muted">Geri çekme yalnızca Uygulama / Keşfet yayınını etkiler; web yayını ve taslak değişmez.</p>
  </section>;
}

function LookPreview({ content, lookId }: { content: EditorialLookContent; lookId?: string }) {
  return <section className={`${panelClass} space-y-6`} aria-label="Taslak önizlemesi"><p className="rounded-xl bg-accent-soft p-3 text-sm font-semibold text-accent-ink">Yalnızca editöre açık taslak önizlemesi. Kaydedilmemiş değişiklikleri de gösterir; canlı yayın değildir.</p><h2 className="break-words text-3xl font-bold text-ink">{content.title || "Başlıksız kombin"}</h2><p className="whitespace-pre-wrap break-words">{content.caption}</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{lookId && content.media.map((media, index) => <figure key={media.storagePath}><PrivateImage lookId={lookId} storagePath={media.storagePath} alt={`${content.title} · ${index + 1}`} className="aspect-[3/4] w-full" /><figcaption className="mt-2 text-sm text-muted">{media.role === "try_on" ? "Deneme görseli" : "Kombin görseli"}</figcaption></figure>)}</div><p className="break-words text-sm">{content.tags.map((tag) => `#${tag}`).join(" ")}</p><p className="text-sm">{OCCASIONS.filter((occasion) => content.occasionIds?.includes(occasion.id)).map((occasion) => occasion.tr).join(" · ")}</p>{content.styleNote && <div><h3 className="font-bold text-ink">Stil notu</h3><p className="mt-2 whitespace-pre-wrap break-words">{content.styleNote}</p></div>}{Boolean(content.parts?.length) && <div className="space-y-3"><h3 className="font-bold text-ink">Parçalar</h3><ul className="grid gap-4 sm:grid-cols-3">{content.parts?.map((part, index) => <li key={index} className="min-w-0 space-y-2">{part.hidden ? <p className="text-sm text-muted">Gizli parça</p> : <>{lookId && <PrivateImage lookId={lookId} storagePath={part.storagePath} alt={part.name} className="aspect-square w-full" />}<p className="break-words text-sm">{part.name}</p><ShoppingLinks links={part.shoppingLinks} partName={part.name} /></>}</li>)}</ul></div>}{Boolean(content.relatedLooks?.length) && <div className="space-y-2"><h3 className="font-bold text-ink">İlgili kombinler</h3><ul className="space-y-2">{content.relatedLooks?.map((item, index) => <li key={index} className="break-all text-sm">{item.label ? `${item.label} · ` : ""}{item.lookId}</li>)}</ul></div>}</section>;
}
