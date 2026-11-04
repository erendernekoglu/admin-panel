import { detailedEventTemplate } from "./detailedEventTemplate";
import { useState } from 'react'
import { EventAboutPreview } from './EventAboutPreview'
import type { StyleEvent } from './styleEventService'
import type { EventAboutSection } from './eventAbout'
import { uploadEventImage } from './styleEventService'

const types: Record<EventAboutSection['type'], string> = { text: 'Metin', image: 'Görsel', reward: 'Ödül kartı', 'badge-gallery': 'Rozet vitrini', 'profile-theme': 'Profil teması önizlemesi' }
const icons = { aura: 'Aura', trophy: 'Kupa', heart: 'Beğeni', runway: 'Podyum', gift: 'Hediye', calendar: 'Takvim' }
const input = 'mt-1.5 block w-full min-h-10 rounded-xl border border-line-input bg-surface px-3.5 py-2 text-sm font-normal text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted hover:border-ink/30 focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60'
const fileInput = 'block w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink'
const label = 'block text-sm font-semibold text-ink'
const button = 'inline-flex h-8 items-center justify-center rounded-full border border-line-input bg-surface px-3.5 text-xs font-semibold text-ink transition-colors duration-150 hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40'
const newId = () => crypto.randomUUID()
interface Props { event: StyleEvent; sections: EventAboutSection[]; disabled: boolean; onChange: (sections: EventAboutSection[]) => void; onBusyChange: (busy: boolean) => void }
export function EventAboutEditor({ event, sections, disabled, onChange, onBusyChange }: Props) {
  const [addType, setAddType] = useState<EventAboutSection['type']>('text')
  const [error, setError] = useState('')
  const replace = (id: string, patch: Partial<EventAboutSection>) => onChange(sections.map(section => section.id === id ? { ...section, ...patch } : section))
  const move = (index: number, delta: number) => { const next = [...sections]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; onChange(next) }
  const upload = async (file: File | undefined, section: EventAboutSection, badgeIndex?: number) => {
    if (!file) return
    setError(''); onBusyChange(true)
    try {
      const url = await uploadEventImage(file)
      if (badgeIndex === undefined) replace(section.id, { imageUrl: url })
      else replace(section.id, { images: section.images?.map((image, index) => index === badgeIndex ? { ...image, url } : image) })
    } catch (error) { setError(error instanceof Error ? error.message : 'Görsel yüklenemedi.') }
    finally { onBusyChange(false) }
  }
  return <section className="space-y-4 border-t border-line pt-5">
    <h3 className="text-base font-bold text-ink">Hakkında bölümleri</h3>
    <p className="text-sm text-ink-soft">Bölümleri ekle, sırala ve telefon önizlemesinden kontrol et. Metinde **kalın yazı** kullanabilirsin. En fazla 20 bölüm.</p>
    <p className="rounded-xl bg-warning-soft p-3 text-sm leading-relaxed text-warning">Bu alan tanıtım sayfasını düzenler. Aura kartı, özel rozet veya tema görseli eklemek otomatik dağıtım başlatmaz. Otomatik ödül akışı yukarıdaki ödül türüyle belirlenir; özel ödüller ayrıca teslim edilir.</p>
    {error && <p role="alert" className="animate-pop-in rounded-xl bg-danger-soft p-3 text-sm font-semibold text-danger">{error}</p>}
    <fieldset disabled={disabled} className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select aria-label="Eklenecek bölüm türü" className={input + ' mt-0 max-w-xs'} value={addType} onChange={event => setAddType(event.target.value as EventAboutSection['type'])}>{Object.entries(types).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <button type="button" className={button} disabled={sections.length >= 20} onClick={() => onChange([...sections, { id: newId(), type: addType, title: types[addType], body: '', ...(addType === 'reward' ? { icon: 'gift' as const, value: '' } : {}), ...(addType === 'badge-gallery' ? { images: [{ url: '', label: '1.lik rozeti' }] } : {}) }])}>Bölüm ekle</button>
        <button type="button" className={button} disabled={sections.length > 17} onClick={() => onChange([...sections, ...detailedEventTemplate()])}>Detaylı yarışma şablonu ekle</button>
      </div>
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">{sections.map((section, index) => <article key={section.id} className="space-y-3 rounded-2xl border border-line bg-surface-2/40 p-4">
          <div className="flex flex-wrap items-center gap-2"><strong className="mr-auto text-sm text-ink">{index + 1}. {types[section.type]}</strong>
            <button type="button" className={button} disabled={index === 0} aria-label={`${section.title} yukarı taşı`} onClick={() => move(index, -1)}>↑</button>
            <button type="button" className={button} disabled={index === sections.length - 1} aria-label={`${section.title} aşağı taşı`} onClick={() => move(index, 1)}>↓</button>
            <button type="button" className={button} disabled={sections.length >= 20} onClick={() => onChange([...sections.slice(0, index + 1), { ...section, id: newId() }, ...sections.slice(index + 1)])}>Kopyala</button>
            <button type="button" className={button} onClick={() => onChange(sections.filter(item => item.id !== section.id))}>Kaldır</button>
          </div>
          <label className={label}>Bölüm başlığı<input required maxLength={160} className={input} value={section.title} onChange={event => replace(section.id, { title: event.target.value })} /></label>
          <label className={label}>Açıklama<textarea rows={4} maxLength={3000} className={input} value={section.body} onChange={event => replace(section.id, { body: event.target.value })} /></label>
          {section.type === 'reward' && <div className="grid gap-3 sm:grid-cols-2"><label className={label}>Simge<select className={input} value={section.icon ?? 'gift'} onChange={event => replace(section.id, { icon: event.target.value as EventAboutSection['icon'] })}>{Object.entries(icons).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className={label}>Öne çıkan değer<input className={input} maxLength={60} placeholder="+100 Aura / İlk 5" value={section.value ?? ''} onChange={event => replace(section.id, { value: event.target.value })} /></label></div>}
          {['badge-gallery', 'profile-theme'].includes(section.type) && <label className={label}>Tasarım<select className={input} value={section.designId ?? 'custom'} onChange={event => { const next = { ...section }; if (event.target.value === 'custom') delete next.designId; else next.designId = 'autumn-2026-tr'; onChange(sections.map(item => item.id === section.id ? next : item)) }}><option value="custom">Kendi görsellerim</option><option value="autumn-2026-tr">Mevcut Sonbahar 2026 tasarımı</option></select></label>}
          {!section.designId && section.type === 'badge-gallery' ? <div className="space-y-3">{(section.images ?? []).map((image, badgeIndex) => <div key={badgeIndex} className="space-y-2 border-l-2 border-line-strong pl-3"><label className={label}>Rozet etiketi<input required maxLength={80} className={input} value={image.label} onChange={event => replace(section.id, { images: section.images?.map((item, i) => i === badgeIndex ? { ...item, label: event.target.value } : item) })} /></label><label className={label}>Rozet görseli adresi<input required type="url" className={input} value={image.url} onChange={event => replace(section.id, { images: section.images?.map((item, i) => i === badgeIndex ? { ...item, url: event.target.value } : item) })} /></label><input aria-label="Rozet görseli yükle" className={fileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => void upload(event.target.files?.[0], section, badgeIndex)} /><button type="button" className={button} onClick={() => replace(section.id, { images: section.images?.filter((_, i) => i !== badgeIndex) })}>Rozeti kaldır</button></div>)}<button type="button" className={button} disabled={(section.images?.length ?? 0) >= 3} onClick={() => replace(section.id, { images: [...section.images ?? [], { url: '', label: 'Rozet' }] })}>Rozet ekle</button></div> : !section.designId && <>
            <label className={label}>{section.type === 'profile-theme' ? 'Profil kartı önizleme görseli adresi' : 'Görsel adresi (isteğe bağlı)'}<input type="url" required={section.type === 'image' || section.type === 'profile-theme'} maxLength={2048} className={input} value={section.imageUrl ?? ''} onChange={event => replace(section.id, { imageUrl: event.target.value })} /></label>
            <input aria-label={`${section.title} görsel yükle`} className={fileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => void upload(event.target.files?.[0], section)} />
            {!!section.imageUrl && <><label className={label}>Görsel açıklaması<input maxLength={200} className={input} value={section.imageAlt ?? ''} onChange={event => replace(section.id, { imageAlt: event.target.value })} /></label><label className={label}>Görsel oranı<select className={input} value={section.imageAspectRatio ?? 1.5} onChange={event => replace(section.id, { imageAspectRatio: Number(event.target.value) })}><option value={1.5}>Yatay 3:2</option><option value={1}>Kare</option><option value={0.75}>Dikey 3:4</option><option value={2}>Geniş 2:1</option></select></label></>}
          </>}
        </article>)}</div>
        <aside className="space-y-3 2xl:sticky 2xl:top-6 2xl:self-start"><h4 className="text-sm font-bold text-ink">Telefon önizlemesi</h4><p className="text-xs text-muted">Uygulamanın açık temasındaki görseller ve ölçüler kullanılır. Cihaz genişliği ve telefonun yazı boyutu ayarı satır kırılımlarını değiştirebilir.</p><EventAboutPreview event={event} sections={sections} /></aside>
      </div>
    </fieldset>
  </section>
}
