import { reorder } from "../../reorder";


import { LOOK_MAX_CAPTION_LENGTH, LOOK_MAX_PARTS, LOOK_MAX_TAGS } from "../../lib/looks/feed";
import { OCCASIONS } from "../../lib/looks/occasions";
import { EDITORIAL_LIMITS, safeShoppingUrl } from "../../lib/looks/validation";
import type { EditorialPart, ShoppingLink } from "../../lib/looks/model";
import type { EditorialLookContent } from "../../lib/admin/client";
import { Button, Field, inputClass, OrderButtons, panelClass } from "./ui";

export function LookFields({ content, onChange }: { content: EditorialLookContent; onChange: (content: EditorialLookContent) => void }) {
  const parts = content.parts ?? [];
  const related = content.relatedLooks ?? [];
  return <>
    <section className={`${panelClass} space-y-5`} aria-label="Kombin bilgileri">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Başlık" hint={`En fazla ${EDITORIAL_LIMITS.title} karakter.`}>{(id, hint) => <input id={id} aria-describedby={hint} className={inputClass} required maxLength={EDITORIAL_LIMITS.title} value={content.title} onChange={(event) => onChange({ ...content, title: event.target.value })} />}</Field>
        <Field label="Tür">{(id) => <select id={id} className={inputClass} value={content.kind} onChange={(event) => onChange({ ...content, kind: event.target.value === "photo" ? "photo" : "lookbook" })}><option value="photo">Fotoğraf</option><option value="lookbook">Lookbook</option></select>}</Field>
      </div>
      <Field label="Açıklama" hint={`${content.caption.length}/${LOOK_MAX_CAPTION_LENGTH} karakter.`}>{(id, hint) => <textarea id={id} aria-describedby={hint} className={inputClass} rows={3} maxLength={LOOK_MAX_CAPTION_LENGTH} value={content.caption} onChange={(event) => onChange({ ...content, caption: event.target.value })} />}</Field>
      <div className="space-y-3"><h2 className="text-lg font-bold text-ink">Etiketler ({content.tags.length}/{LOOK_MAX_TAGS})</h2><p className="text-sm text-muted">Her etiket en fazla {EDITORIAL_LIMITS.tag} karakter. Kaydederken küçük harfe çevrilir ve tekrarlar birleştirilir.</p>{content.tags.map((tag, index) => <div key={index} className="flex items-end gap-3"><div className="min-w-0 flex-1"><Field label={`Etiket ${index + 1}`}>{(id) => <input id={id} className={inputClass} required maxLength={EDITORIAL_LIMITS.tag} value={tag} onChange={(event) => onChange({ ...content, tags: content.tags.map((value, position) => position === index ? event.target.value : value) })} />}</Field></div><Button secondary onClick={() => onChange({ ...content, tags: content.tags.filter((_, position) => position !== index) })} aria-label={`Etiket ${index + 1}: kaldır`}>Kaldır</Button></div>)}<Button secondary disabled={content.tags.length >= LOOK_MAX_TAGS} onClick={() => onChange({ ...content, tags: [...content.tags, ""] })}>Etiket ekle</Button></div>
      <Field label="Stil notu" hint={`${(content.styleNote ?? "").length}/${EDITORIAL_LIMITS.styleNote} karakter. Yayın içeriğinin parçasıdır; özel not değildir.`}>{(id, hint) => <textarea id={id} aria-describedby={hint} className={inputClass} rows={4} maxLength={EDITORIAL_LIMITS.styleNote} value={content.styleNote ?? ""} onChange={(event) => onChange({ ...content, styleNote: event.target.value })} />}</Field>
      <fieldset className="space-y-3"><legend className="mb-3 font-bold text-ink">Kullanım alanları</legend><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{OCCASIONS.map((occasion) => <label key={occasion.id} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="size-5 accent-accent" checked={content.occasionIds?.includes(occasion.id) ?? false} onChange={(event) => onChange({ ...content, occasionIds: event.target.checked ? [...(content.occasionIds ?? []), occasion.id] : (content.occasionIds ?? []).filter((id) => id !== occasion.id) })} />{occasion.tr}</label>)}</div></fieldset>
    </section>
    <section className={`${panelClass} space-y-4`} aria-labelledby="look-parts"><h2 id="look-parts" className="text-lg font-bold text-ink">Parçalar ({parts.length}/{LOOK_MAX_PARTS})</h2><p className="text-sm text-muted">Görünür parçalarda ad ve bu kombine yüklenen bir görsel gerekir. Gizli parça yalnızca gizlilik işaretiyle kaydedilir. Ad en fazla {EDITORIAL_LIMITS.partName} karakter. Kıyafet ID’si ve alışveriş bağlantıları isteğe bağlıdır; bağlantı eklemek için kıyafet kaydı gerekmez.</p>
      <p className="text-sm text-muted">Bu alanları değiştirmek ve taslağı kaydetmek canlı web yayınını değiştirmez. Ziyaretçilerin değişiklikleri görmesi için kaydettikten sonra web sürümünü yeniden yayımlayın.</p>
      {parts.map((part, index) => <fieldset key={index} className="space-y-4 rounded-2xl border border-line bg-surface-2/40 p-4"><legend className="px-2 text-sm font-bold text-ink">Parça {index + 1}</legend>
        <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="size-5 accent-accent" checked={part.hidden} onChange={(event) => onChange({ ...content, parts: parts.map((value, position) => position !== index ? value : event.target.checked ? { hidden: true } : { hidden: false, name: "", imageUrl: "" }) })} />Gizli parça (ad, görsel, kıyafet ID’si ve alışveriş bağlantıları kaldırılır)</label>
        {!part.hidden && <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Parça adı">{(id) => <input id={id} className={inputClass} required maxLength={EDITORIAL_LIMITS.partName} value={part.name} onChange={(event) => onChange({ ...content, parts: parts.map((value, position) => position === index ? { ...part, name: event.target.value } : value) })} />}</Field>
          <Field label="Parça görseli" hint="Önce galeriye görsel yükleyin. Galeriden kaldırılmış mevcut parça görseli korunur.">{(id, hint) => <select id={id} aria-describedby={hint} className={inputClass} required value={part.storagePath ?? ""} onChange={(event) => { const media = content.media.find((image) => image.storagePath === event.target.value); onChange({ ...content, parts: parts.map((value, position) => position === index ? { ...part, imageUrl: media?.url ?? "", storagePath: media?.storagePath ?? "" } : value) }); }}><option value="">Görsel seçin</option>{part.storagePath && !content.media.some((media) => media.storagePath === part.storagePath) && <option value={part.storagePath}>Mevcut parça görseli</option>}{content.media.map((media, position) => <option key={media.storagePath} value={media.storagePath}>Galeri görseli {position + 1}{media.role === "try_on" ? " · Deneme" : ""}</option>)}</select>}</Field>
        </div>}
        {!part.hidden && <PartShoppingFields part={part} partNumber={index + 1} onChange={(next) => onChange({ ...content, parts: parts.map((value, position) => position === index ? next : value) })} />}
        <OrderButtons index={index} length={parts.length} label={`Parça ${index + 1}`} onMove={(to) => onChange({ ...content, parts: reorder(parts, index, to) })} onRemove={() => onChange({ ...content, parts: parts.filter((_, position) => position !== index) })} />
      </fieldset>)}
      <Button secondary disabled={parts.length >= LOOK_MAX_PARTS} onClick={() => onChange({ ...content, parts: [...parts, { hidden: false, name: "", imageUrl: "" }] })}>Parça ekle</Button>
    </section>
    <section className={`${panelClass} space-y-4`} aria-labelledby="related-looks"><h2 id="related-looks" className="text-lg font-bold text-ink">İlgili kombinler ({related.length}/{EDITORIAL_LIMITS.relatedLooks})</h2><p className="text-sm text-muted">Kombin kodu değil, kayıt ID’si kullanın. ID: 1–128 harf, rakam, alt çizgi veya tire. İsteğe bağlı etiket en fazla {EDITORIAL_LIMITS.relatedLookLabel} karakter.</p>{related.map((item, index) => <fieldset key={index} className="space-y-3 rounded-2xl border border-line bg-surface-2/40 p-4"><legend className="px-2 text-sm font-bold text-ink">İlgili kombin {index + 1}</legend><div className="grid gap-4 sm:grid-cols-2"><Field label="Kombin ID">{(id) => <input id={id} className={inputClass} required maxLength={128} pattern="[A-Za-z0-9_\-]{1,128}" value={item.lookId} onChange={(event) => onChange({ ...content, relatedLooks: related.map((value, position) => position === index ? { ...item, lookId: event.target.value } : value) })} />}</Field><Field label="Etiket (isteğe bağlı)">{(id) => <input id={id} className={inputClass} maxLength={EDITORIAL_LIMITS.relatedLookLabel} value={item.label ?? ""} onChange={(event) => onChange({ ...content, relatedLooks: related.map((value, position) => position === index ? { ...item, label: event.target.value } : value) })} />}</Field></div><OrderButtons index={index} length={related.length} label={`İlgili kombin ${index + 1}`} onMove={(to) => onChange({ ...content, relatedLooks: reorder(related, index, to) })} onRemove={() => onChange({ ...content, relatedLooks: related.filter((_, position) => position !== index) })} /></fieldset>)}<Button secondary disabled={related.length >= EDITORIAL_LIMITS.relatedLooks} onClick={() => onChange({ ...content, relatedLooks: [...related, { lookId: "" }] })}>İlgili kombin ekle</Button></section>
  </>;
}

type VisiblePart = Extract<EditorialPart, { hidden: false }>;

function PartShoppingFields({ part, partNumber, onChange }: { part: VisiblePart; partNumber: number; onChange: (part: VisiblePart) => void }) {
  const links = part.shoppingLinks ?? [];
  const invalidGarmentId = Boolean(part.garmentId && !/^[A-Za-z0-9_-]{1,128}$/.test(part.garmentId));

  function changeLinks(next: ShoppingLink[]) {
    const updated = { ...part };
    if (next.length) updated.shoppingLinks = next;
    else delete updated.shoppingLinks;
    onChange(updated);
  }

  function changeLink(id: string, next: ShoppingLink) {
    changeLinks(links.map((link) => link.id === id ? next : link));
  }

  function changeOptionalText(link: ShoppingLink, field: "retailer" | "label", value: string) {
    const updated = { ...link };
    if (value.trim()) updated[field] = value;
    else delete updated[field];
    changeLink(link.id, updated);
  }

  return <div className="min-w-0 space-y-4">
    <Field label="Kıyafet ID’si (isteğe bağlı)" hint={`${invalidGarmentId ? "Geçersiz ID. " : ""}1–128 ASCII harf, rakam, alt çizgi veya tire. Boş bırakılırsa alan kaldırılır; alışveriş bağlantıları için gerekli değildir.`}>{(id, hint) => <input id={id} aria-describedby={hint} aria-invalid={invalidGarmentId} className={inputClass} pattern="[A-Za-z0-9_\-]{1,128}" value={part.garmentId ?? ""} onChange={(event) => {
      const updated = { ...part };
      if (event.target.value.trim()) updated.garmentId = event.target.value;
      else delete updated.garmentId;
      onChange(updated);
    }} />}</Field>
    <fieldset className="min-w-0 space-y-4">
      <legend className="mb-2 font-bold text-ink">Alışveriş bağlantıları ({links.length}/{EDITORIAL_LIMITS.shoppingLinks})</legend>
      <p className="text-sm text-muted">Bağlantılar isteğe bağlıdır. Her bağlantının aynı ürün mü yoksa benzer bir ürün mü olduğunu seçin. Geçersiz değerler kısaltılmaz; düzeltin veya satırı kaldırın. Güvenli olmayan URL’ler önizlemede bağlantı olarak gösterilmez.</p>
      {links.map((link, index) => {
        const invalidUrl = !safeShoppingUrl(link.url) || link.url.trim().length > EDITORIAL_LIMITS.url;
        const invalidRetailer = (link.retailer?.trim().length ?? 0) > EDITORIAL_LIMITS.shoppingRetailer;
        const invalidLabel = (link.label?.trim().length ?? 0) > EDITORIAL_LIMITS.shoppingLabel;
        return <fieldset key={link.id} className="min-w-0 space-y-4 rounded-xl border border-line bg-surface p-3 sm:p-4">
          <legend className="px-2 text-sm font-bold text-ink">Bağlantı {index + 1}</legend>
          <Field label="Mağaza URL’si" hint={`${invalidUrl ? "Geçerli bir HTTPS URL’si girin. " : ""}En fazla ${EDITORIAL_LIMITS.url} karakter; kullanıcı bilgisi, boşluk, ters eğik çizgi veya kontrol karakteri içeremez.`}>{(id, hint) => <input id={id} aria-describedby={hint} aria-invalid={invalidUrl} className={inputClass} type="text" inputMode="url" autoCapitalize="none" spellCheck={false} required value={link.url} onChange={(event) => changeLink(link.id, { ...link, url: event.target.value })} />}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mağaza adı (isteğe bağlı)" hint={`${invalidRetailer ? "Çok uzun. " : ""}En fazla ${EDITORIAL_LIMITS.shoppingRetailer} karakter; boş bırakılırsa kaldırılır.`}>{(id, hint) => <input id={id} aria-describedby={hint} aria-invalid={invalidRetailer} className={inputClass} value={link.retailer ?? ""} onChange={(event) => changeOptionalText(link, "retailer", event.target.value)} />}</Field>
            <Field label="Bağlantı etiketi (isteğe bağlı)" hint={`${invalidLabel ? "Çok uzun. " : ""}En fazla ${EDITORIAL_LIMITS.shoppingLabel} karakter; boş bırakılırsa kaldırılır.`}>{(id, hint) => <input id={id} aria-describedby={hint} aria-invalid={invalidLabel} className={inputClass} value={link.label ?? ""} onChange={(event) => changeOptionalText(link, "label", event.target.value)} />}</Field>
          </div>
          <Field label="Ürün ilişkisi">{(id) => <select id={id} className={inputClass} value={link.relation} onChange={(event) => changeLink(link.id, { ...link, relation: event.target.value === "exact" ? "exact" : "similar" })}><option value="exact">Birebir ürün</option><option value="similar">Benzer alternatif</option></select>}</Field>
          <OrderButtons index={index} length={links.length} label={`Parça ${partNumber}, bağlantı ${index + 1}`} onMove={(to) => changeLinks(reorder(links, index, to))} onRemove={() => changeLinks(links.filter((value) => value.id !== link.id))} />
        </fieldset>;
      })}
      <Button secondary disabled={links.length >= EDITORIAL_LIMITS.shoppingLinks} onClick={() => {
        if (links.length >= EDITORIAL_LIMITS.shoppingLinks) return;
        changeLinks([...links, { id: crypto.randomUUID(), url: "", relation: "exact" }]);
      }}>Alışveriş bağlantısı ekle</Button>
    </fieldset>
  </div>;
}
