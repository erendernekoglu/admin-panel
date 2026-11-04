import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { boutiqueRequest } from '../../lib/api/boutique';
import { Badge } from '../../components/atoms/Badge/Badge';
import { Button } from '../../components/atoms/Button';
const serviceNames = {virtualTryOn:'Sanal deneme', garmentAutofill:'Otomatik kıyafet doldurma',lookEngine:'Look Engine ile kombin oluşturma',backgroundRemoval:'Arka plan kaldırma'} as const;
type Service = keyof typeof serviceNames;
const tryOnDefaults = {model:'demo-tryon/standard',loraScale:1,seed:-1,additionalPrompt:''};
const demoProviders:Record<Service,string> = {virtualTryOn:'demo-tryon',garmentAutofill:'demo-taxonomy',lookEngine:'demo-look',backgroundRemoval:'demo-cutout'};
type Settings = {revision:number; services:Record<Service,{enabled:boolean;provider:string;hasApiKey:boolean;endpoint?:string;model?:string;loraScale?:number;seed?:number;additionalPrompt?:string}>};
export function AISettings({id}:{id:string}) {
  const queryClient=useQueryClient();
  const queryKey=['boutique-ai-settings',id];
  const query=useQuery({queryKey,queryFn:()=>boutiqueRequest<Settings>(`/boutiques/${encodeURIComponent(id)}/ai-settings`)});
  const [saved,setSaved]=useState(false);
  if(query.isPending) return <p role="status" className="text-sm text-muted">Ayarlar yükleniyor…</p>;
  if(query.error) return <div role="alert" className="flex animate-pop-in flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger"><p className="font-semibold">{query.error.message}</p><Button size="sm" variant="secondary" onClick={()=>void query.refetch()}>Yeniden dene</Button></div>;
  return <><AISettingsForm key={`${id}-${query.data.revision}`} data={query.data} id={id} onSaved={data=>{queryClient.setQueryData(queryKey,data);setSaved(true);}} onEdit={()=>setSaved(false)}/>{saved&&<p role="status" className="mt-3 animate-pop-in rounded-xl bg-success-soft p-3 text-sm font-semibold text-success">Ayarlar kaydedildi.</p>}</>;
}
function AISettingsForm({id,data,onSaved,onEdit}:{id:string;data:Settings;onSaved:(data:Settings)=>void;onEdit:()=>void}) {
  const [services,setServices]=useState(()=>Object.fromEntries((Object.keys(serviceNames) as Service[]).map(name=>[name,{...(name==='virtualTryOn'?tryOnDefaults:{}),...(data.services[name]||{enabled:false,hasApiKey:false,provider:''}),provider:demoProviders[name],endpoint:'',apiKey:'',clearApiKey:false}])) as Record<Service,Settings['services'][Service]&{apiKey:string;clearApiKey:boolean}>);
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const [editingKeys,setEditingKeys]=useState<Partial<Record<Service,boolean>>>({});
  const changed=(name:Service)=>services[name].enabled!==(data.services[name]?.enabled||false)||!!services[name].apiKey.trim()||services[name].clearApiKey||(name==='virtualTryOn'&&(Object.keys(tryOnDefaults) as (keyof typeof tryOnDefaults)[]).some(key=>services[name][key] !== (data.services[name]?.[key] ?? tryOnDefaults[key])));
  const dirty=(Object.keys(serviceNames) as Service[]).some(changed);
  const update=(name:Service,value:Partial<typeof services[Service]>)=>{setServices(current=>({...current,[name]:{...current[name],...value}}));onEdit();};
  const input='mt-1.5 block w-full min-h-10 rounded-xl border border-line-input bg-surface px-3.5 py-2 text-sm font-normal text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted hover:border-ink/30 focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60';
  return <form className="space-y-5" onSubmit={async event=>{
    event.preventDefault();setBusy(true);setError('');
    try {onSaved(await boutiqueRequest<Settings>(`/boutiques/${encodeURIComponent(id)}/ai-settings`,{revision:data.revision,services:Object.fromEntries((Object.keys(serviceNames) as Service[]).map(name=>{const {enabled,provider,apiKey,clearApiKey,endpoint,model,loraScale,seed,additionalPrompt}=services[name];return [name,{enabled,provider,apiKey,clearApiKey,...(name!=='virtualTryOn'?{endpoint}:{model,loraScale,seed,additionalPrompt})}];}))}));}
    catch(cause){setError(cause instanceof Error?cause.message:'Ayarlar kaydedilemedi.');}finally{setBusy(false);}
  }}>
    <div><h2 className="text-lg font-bold text-ink">Butik yapay zekâ özellikleri</h2><p className="mt-1 text-sm text-muted">Bu butiğe özel özellikleri ve API anahtarlarını yönetir. Kayıtlı anahtarlar tekrar gösterilmez ve ekran cihazlarına gönderilmez.</p></div>
    {(Object.keys(serviceNames) as Service[]).map(name=>{const value=services[name];const needsNewKey=value.hasApiKey&&(value.provider!==data.services[name]?.provider||(name!=='virtualTryOn'&&!!data.services[name]?.endpoint&&value.endpoint!==data.services[name]?.endpoint));const showKey=!value.clearApiKey&&(editingKeys[name]||value.enabled&&(!value.hasApiKey||needsNewKey));return <fieldset key={name} disabled={busy} className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
      <legend className="px-2 font-bold text-ink">{serviceNames[name]}</legend>
      <div className="flex items-center gap-2" role="status">
        <Badge tone={changed(name)?'warning':value.enabled&&value.hasApiKey?'success':value.enabled?'danger':'neutral'}>{changed(name)?'Kaydedilmedi':value.enabled&&value.hasApiKey?'Etkin':value.enabled?'API anahtarı gerekli':'Kapalı'}</Badge>
        {changed(name)&&<span className="text-sm text-muted">Değişikliği uygulamak için ayarları kaydedin.</span>}
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" checked={value.enabled} onChange={e=>update(name,{enabled:e.target.checked})}/>{serviceNames[name]} özelliğini aç</label>
      {name==='virtualTryOn' ? <div className="space-y-2 rounded-xl bg-surface-2 p-4 text-sm text-ink-soft"><p className="font-bold text-ink">Demo deneme servisi</p><label className="block font-semibold text-ink">Sanal deneme modeli<select className={input} value={value.model} onChange={e=>update(name,{model:e.target.value})}>
        <option value="demo-tryon/standard">Demo Standart</option>
        <option value="demo-tryon/quality">Demo Kalite</option>
        <option value="demo-tryon/fast">Demo Hızlı (LoRA olmadan)</option>
      </select></label>
      <p>Demo modunda model seçimi yalnızca formu dener; hiçbir üretim isteği gönderilmez.</p>
      {value.model==='demo-tryon/fast'?<p>Hızlı model, sanal denemeyi görseller ve talimatla oluşturur; LoRA ağırlığı bu modelde kullanılmaz.</p>:<><label className="block font-semibold text-ink">Kıyafet uyarlama ağırlığı (LoRA)<input className={input} type="number" min={0} max={2} step={0.1} required value={value.loraScale} onChange={e=>update(name,{loraScale:e.target.valueAsNumber})}/></label>
      <p>Önerilen değer: 1. Değer 0 olduğunda sanal deneme LoRA etkisi kapatılır.</p></>}
      <label className="block font-semibold text-ink">Rastgelelik değeri (seed)<input className={input} type="number" min={-1} max={2147483647} step={1} required value={value.seed} onChange={e=>update(name,{seed:e.target.valueAsNumber})}/></label>
      <p>Her denemede farklı sonuç için -1 kullanın. Aynı girdileri karşılaştırmak için sabit bir sayı seçin.</p>
      <label className="block font-semibold text-ink">Ek deneme talimatı<textarea className={input} rows={3} maxLength={1000} value={value.additionalPrompt} onChange={e=>update(name,{additionalPrompt:e.target.value})} placeholder="Örnek: Kıyafetin baskı ve kumaş detaylarını koru."/></label>
      <p>Ek talimat standart sanal deneme talimatının sonuna eklenir. Boş bırakabilirsiniz.</p><p>En fazla bir üst ve bir alt kıyafet denenir; ayakkabı ve aksesuar desteklenmez. Kaydettiğiniz ayarlar bağlı ekranlarda bir sonraki denemede uygulanır. Model değiştirirken API anahtarını tekrar girmeniz gerekmez.</p></div> : <p className="text-sm text-muted">Demo servis kataloğu üzerinden yönetilir. Kayıtlı anahtar, özelliği açıp kapatırken korunur.</p>}
      <p className="text-sm text-muted">{value.clearApiKey?'API anahtarı kaydettiğinizde silinecek.':value.hasApiKey?'API anahtarı kayıtlı. Tekrar girmeniz gerekmez.':'Henüz API anahtarı girilmedi.'}</p>
      {needsNewKey&&value.enabled&&<p className="text-sm text-warning">Servis bağlantısı değiştiği için API anahtarını bir kez yeniden girin.</p>}
      {value.hasApiKey&&!showKey&&!value.clearApiKey&&<button type="button" className="text-sm font-semibold text-accent underline-offset-4 hover:underline" onClick={()=>setEditingKeys(current=>({...current,[name]:true}))}>Anahtarı değiştir</button>}
      {showKey&&<label className="block font-semibold text-ink">{name==='virtualTryOn'?'Sanal deneme API anahtarı':value.hasApiKey?'Yeni API anahtarı':'API anahtarı'}<input className={input} type="password" autoComplete="new-password" spellCheck={false} value={value.apiKey} maxLength={4096} required={value.enabled&&(!value.hasApiKey||needsNewKey)} onChange={e=>update(name,{apiKey:e.target.value})}/></label>}
      {editingKeys[name]&&!(needsNewKey&&value.enabled)&&<button type="button" className="text-sm font-semibold text-ink-soft underline-offset-4 hover:underline" onClick={()=>{setEditingKeys(current=>({...current,[name]:false}));update(name,{apiKey:''});}}>Anahtar değişikliğinden vazgeç</button>}
      {value.hasApiKey&&<label className="flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" checked={value.clearApiKey} onChange={e=>update(name,{clearApiKey:e.target.checked,...(e.target.checked?{enabled:false,apiKey:''}:{})})}/>Kayıtlı API anahtarını sil</label>}
    </fieldset>;})}
    {error&&<p role="alert" className="animate-pop-in rounded-xl bg-danger-soft p-3 text-sm font-semibold text-danger">{error}</p>}
    <Button type="submit" disabled={busy||!dirty}>{busy?'Kaydediliyor…':dirty?'Değişiklikleri kaydet':'Ayarlar güncel'}</Button>
  </form>;
}
