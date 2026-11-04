
import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {boutiqueRequest} from '../../lib/api/boutique';
import {Button} from '../../components/atoms/Button';
type Promotion={mobileUrl:string;qrEnabled:boolean;qrTitle:string;ctaMessages:string;ctaAutoplay:boolean;ctaHoldSeconds:number;ctaTransitionMs:number;qrTimeoutSeconds:number};
type Data={promotion:Promotion;revision:number};
export function PromotionSettings({id,onSaved}:{id:string;onSaved:()=>void}) {
  const query=useQuery({queryKey:['boutique-promotion',id],queryFn:()=>boutiqueRequest<Data>('/boutiques/'+encodeURIComponent(id)+'/promotion')});
  if(query.isPending)return <p role="status" className="text-sm text-muted">QR ayarları yükleniyor…</p>;
  if(query.error)return <div role="alert" className="flex animate-pop-in flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger"><p className="font-semibold">{query.error.message}</p><Button size="sm" variant="secondary" onClick={()=>void query.refetch()}>Yeniden dene</Button></div>;
  return <PromotionForm key={query.data.revision} id={id} data={query.data} onSaved={()=>{void query.refetch();onSaved();}}/>;
}
function PromotionForm({id,data,onSaved}:{id:string;data:Data;onSaved:()=>void}) {
  const [value,setValue]=useState(data.promotion),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const input='mt-1.5 block w-full min-h-10 rounded-xl border border-line-input bg-surface px-3.5 py-2 text-sm font-normal text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted hover:border-ink/30 focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60';
  const isError=!!message&&message!=='Ayarlar kaydedildi ve ekran yayınları güncellendi.';
  return <form className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-card" onSubmit={async e=>{
    e.preventDefault();setBusy(true);setMessage('');
    try{await boutiqueRequest('/boutiques/'+encodeURIComponent(id)+'/promotion',{promotion:value,revision:data.revision});setMessage('Ayarlar kaydedildi ve ekran yayınları güncellendi.');onSaved();}
    catch(error){setMessage(error instanceof Error?error.message:'Ayarlar kaydedilemedi.');}finally{setBusy(false);}
  }}>
    <h2 className="text-lg font-bold text-ink">QR ve mobil uygulama alanı</h2>
    <p className="text-sm text-muted">QR bağlantısı otomatik oluşturulur. Müşteri koleksiyonu açabilir veya mobil uygulamayı indirebilir; bağlantı girmeniz gerekmez. Bu ayarlar butiğin tüm ekranlarına uygulanır.</p>
    <label className="flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" checked={value.qrEnabled} onChange={e=>setValue({...value,qrEnabled:e.target.checked})}/>QR ve mobil uygulama alanını göster</label>
    <label className="block text-sm font-semibold text-ink">Başlık<input className={input} required maxLength={80} value={value.qrTitle} onChange={e=>setValue({...value,qrTitle:e.target.value})}/></label>
    <label className="block text-sm font-semibold text-ink">Mesajlar (her satır ayrı mesaj)<textarea className={input} required rows={6} maxLength={2000} value={value.ctaMessages} onChange={e=>setValue({...value,ctaMessages:e.target.value})}/></label>
    <label className="flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" checked={value.ctaAutoplay} onChange={e=>setValue({...value,ctaAutoplay:e.target.checked})}/>Mesajları otomatik döndür</label>
    <div className="grid gap-4 sm:grid-cols-3">
    {([['ctaHoldSeconds','Mesaj bekleme süresi (sn)',1,120],['ctaTransitionMs','Mesaj geçişi (ms)',0,3000],['qrTimeoutSeconds','QR ekranı zaman aşımı (sn, 0: genel süre; en az 10)',0,1800]] as const).map(([key,label,min,max])=>
      <label key={key} className="block text-sm font-semibold text-ink">{label}<input className={input} required type="number" step={1} min={min} max={max} value={value[key]} onChange={e=>setValue({...value,[key]:Number(e.target.value)})}/></label>)}
    </div>
    <Button type="submit" disabled={busy}>{busy?'Kaydediliyor…':'Kaydet ve ekranlara uygula'}</Button>
    {message&&<p role={isError?'alert':'status'} className={`animate-pop-in rounded-xl p-3 text-sm font-semibold ${isError?'bg-danger-soft text-danger':'bg-success-soft text-success'}`}>{message}</p>}
  </form>;
}
