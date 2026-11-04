import { reorder } from "../../reorder";


import type { LookCollectionContent } from "../../lib/admin/client";
import { EditorFrame } from "./EditorFrame";
import { useEditor } from "./useEditor";
import { Button, Field, inputClass, OrderButtons, panelClass } from "./ui";

const EMPTY_COLLECTION: LookCollectionContent = { title: "", slug: "", description: "", lookIds: [] };

export function CollectionEditor({ collectionId }: { collectionId?: string }) {
  const editor = useEditor("collections", collectionId, EMPTY_COLLECTION);
  const content = editor.content;
  function save() {
    const value = { ...content, title: content.title.trim(), description: content.description?.trim(), lookIds: content.lookIds.map((id) => id.trim()) };
    if (!value.title || value.title.length > 160) { editor.setError(new Error("Başlık 1–160 karakter olmalı.")); return; }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug) || value.slug.length > 128) { editor.setError(new Error("Adres kısaltması (slug) 1–128 karakter olmalı: küçük İngilizce harfler, rakamlar ve kelimeler arasında tek tire kullanın.")); return; }
    if ((value.description?.length ?? 0) > 1000) { editor.setError(new Error("Açıklama en fazla 1000 karakter olabilir.")); return; }
    if (value.lookIds.length > 100 || value.lookIds.some((id) => !/^[A-Za-z0-9_-]{1,128}$/.test(id))) { editor.setError(new Error("En fazla 100 kombin eklenebilir. Her satırda 1–128 harf, rakam, alt çizgi veya tire içeren bir kayıt ID’si olmalı. Boş satırları doldurun veya kaldırın.")); return; }
    if (new Set(value.lookIds).size !== value.lookIds.length) { editor.setError(new Error("Aynı kombin ID’si birden fazla kez eklenemez.")); return; }
    void editor.save(value);
  }
  return <EditorFrame editor={editor} resource="collections" title={collectionId || editor.record ? "Koleksiyonu düzenle" : "Yeni koleksiyon"} onSave={save}>
    <section className={`${panelClass} space-y-5`} aria-label="Koleksiyon bilgileri">
      <Field label="Başlık" hint="En fazla 160 karakter.">{(id, hint) => <input id={id} aria-describedby={hint} className={inputClass} required maxLength={160} value={content.title} onChange={(event) => editor.change({ ...content, title: event.target.value })} />}</Field>
      <Field label="Adres kısaltması (slug)" hint="1–128 küçük İngilizce harf/rakam; kelimeler arasında tek tire (ör. hafta-sonu). Oluşturulduktan sonra değiştirilemez.">{(id, hint) => <input id={id} aria-describedby={hint} className={inputClass} required readOnly={Boolean(editor.record) || Boolean(collectionId)} maxLength={128} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={content.slug} onChange={(event) => editor.change({ ...content, slug: event.target.value })} />}</Field>
      <Field label="Açıklama" hint={`${(content.description ?? "").length}/1000 karakter.`}>{(id, hint) => <textarea id={id} aria-describedby={hint} className={inputClass} rows={5} maxLength={1000} value={content.description ?? ""} onChange={(event) => editor.change({ ...content, description: event.target.value })} />}</Field>
    </section>
    <section className={`${panelClass} space-y-4`} aria-labelledby="collection-looks"><h2 id="collection-looks" className="text-lg font-bold text-ink">Kombin sırası ({content.lookIds.length}/100)</h2><p className="text-sm text-muted">Kombin listesindeki kayıt ID’sini kullanın; kombin kodu veya bağlantısı değil. Sıra yukarıdan aşağıya kaydedilir. Taslak ve arşivlenmiş kombinler de eklenebilir; sunucu kayıtların varlığını doğrular.</p>
      <ol className="space-y-4">{content.lookIds.map((lookId, index) => <li key={index} className="space-y-3 rounded-2xl border border-line bg-surface-2/40 p-4"><Field label={`${index + 1}. kombin ID`}>{(id) => <input id={id} className={inputClass} required maxLength={128} pattern="[A-Za-z0-9_\-]{1,128}" value={lookId} onChange={(event) => editor.change({ ...content, lookIds: content.lookIds.map((value, position) => position === index ? event.target.value : value) })} />}</Field><OrderButtons index={index} length={content.lookIds.length} label={`Kombin ${index + 1}`} onMove={(to) => editor.change({ ...content, lookIds: reorder(content.lookIds, index, to) })} onRemove={() => editor.change({ ...content, lookIds: content.lookIds.filter((_, position) => position !== index) })} /></li>)}</ol>
      <Button secondary disabled={content.lookIds.length >= 100} onClick={() => editor.change({ ...content, lookIds: [...content.lookIds, ""] })}>Kombin ekle</Button>
    </section>
  </EditorFrame>;
}
