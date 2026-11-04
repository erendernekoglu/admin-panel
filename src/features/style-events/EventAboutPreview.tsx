import type { EventAboutSection } from './eventAbout'
import type { StyleEvent } from './styleEventService'
import {
  CalendarDays,
  ChevronLeft,
  Flame,
  Footprints,
  Gift,
  Heart,
  Sun,
  Trophy,
  User,
} from 'lucide-react'
import './eventAboutPreview.css'

const asset = (name: string) => `${import.meta.env.BASE_URL}event-preview/${name}`
const icons = {
  trophy: Trophy,
  heart: Heart,
  runway: Footprints,
  gift: Gift,
  calendar: CalendarDays,
  person: User,
  sunny: Sun,
  flame: Flame,
  chevronBack: ChevronLeft,
} as const
type IconName = keyof typeof icons
function Icon({ name, size }: { name: IconName; size: number }) {
  const Component = icons[name]
  return <Component aria-hidden="true" className="event-phone-icon" size={size} strokeWidth={1.8} />
}
function Aura() {
  return <svg aria-label="Aura" className="event-phone-aura" width="64" height="64" viewBox="0 0 24 24" fill="none">
    <path fill="currentColor" d="M6.5 12C6.5 12.487 9.53056 13.2222 10.1367 13.8333C10.7428 14.4444 11.3489 17.5 11.955 17.5C12.5611 17.5 13.1672 14.4444 13.7734 13.8333C14.3795 13.2222 17.5 12.4918 17.5 12C17.5 11.5082 14.3795 10.7778 13.7734 10.1667C13.1672 9.55556 12.4766 6.5 11.955 6.5C11.4335 6.5 10.7428 9.55556 10.1367 10.1667C9.53056 10.7778 6.5 11.513 6.5 12Z" />
    {Array.from({ length: 10 }, (_, i) => { const angle = i * Math.PI / 5; return <path key={i} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" d={`M${12 + Math.sin(angle) * 7.5} ${12 - Math.cos(angle) * 7.5}L${12 + Math.sin(angle) * 9} ${12 - Math.cos(angle) * 9}`} /> })}
  </svg>
}
function Body({ text }: { text: string }) {
  return <p>{text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith('**') && part.endsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part)}</p>
}
function AutumnTheme() {
  return <div className="event-phone-theme" aria-label="Sonbahar profil teması önizlemesi">
    <img className="event-phone-theme-art" src={asset('profile-theme-background.svg')} alt="" />
    <div className="event-phone-avatar"><Icon name="person" size={32} /></div>
    <h3>Senin profilin</h3><p className="event-phone-handle">@kullaniciadi</p>
    <div className="event-phone-progress">{(['sunny', 'flame', 'trophy'] as const).map((name, index) => <div key={name}><Icon name={name} size={20} /><strong>{['120', '7', '14'][index]}</strong></div>)}</div>
    <div className="event-phone-stats">{['Kombin', 'Parça', 'Takipçi', 'Takip'].map((label, index) => <div key={label}><strong>{['12', '48', '256', '180'][index]}</strong><span>{label}</span></div>)}</div>
  </div>
}
// Mirrors EventAboutSections and StyleEventInfoScreen's light-theme layout.
export function EventAboutPreview({ sections, event }: { sections: EventAboutSection[]; event: StyleEvent }) {
  return <>
    <div className="event-phone-viewport"><div className="event-phone" style={{ width: 360 }}>
      <header><Icon name="chevronBack" size={24} /><h3>Etkinlik hakkında</h3></header>
      <div className="event-phone-scroll" tabIndex={0} role="region" aria-label="Etkinlik ekranı önizlemesi">
        {!!event.coverUrl && <img className="event-phone-cover" src={event.coverUrl} alt="Etkinlik kapağı" />}
        <div className="event-phone-content">
          <h2>{event.title}</h2><p className="event-phone-secondary">{event.description}</p>
          <div className="event-phone-sections">{sections.map(section => <section key={section.id}>
            <h3>{section.title}</h3>
            {section.type === 'reward' && <div className="event-phone-reward">{section.icon === 'aura' ? <Aura /> : <Icon name={section.icon ?? 'gift'} size={48} />}{!!section.value && <h2>{section.value}</h2>}</div>}
            {!!section.body && <Body text={section.body} />}
            {!!section.imageUrl && <img className="event-phone-image" src={section.imageUrl} alt={section.imageAlt || section.title} style={{ aspectRatio: section.imageAspectRatio ?? 1.5 }} />}
            {section.type === 'badge-gallery' && <div className="event-phone-badges">{section.designId === 'autumn-2026-tr' ? [1, 2, 3].map(rank => <div key={rank}><div className="event-phone-badge"><img src={asset('badge-winners.svg')} alt={`${rank}.lik rozeti`} style={{ left: -(rank - 1) * 80 }} /></div><strong>{rank}.lik</strong></div>) : section.images?.map((badge, index) => <div key={index}><img className="event-phone-custom-badge" src={badge.url} alt={badge.label} /><strong>{badge.label}</strong></div>)}</div>}
            {section.type === 'profile-theme' && section.designId === 'autumn-2026-tr' && <AutumnTheme />}
          </section>)}</div>
          {!sections.length && <><strong>{event.prize.kind === 'aura' ? `${event.prize.aura} Aura` : event.prize.title}</strong>{!!event.prize.imageUrl && <img className="event-phone-image" src={event.prize.imageUrl} alt={event.prize.title} style={{ aspectRatio: 2 }} />}<p>{event.prize.description}</p></>}
          <h3 className="event-phone-subheading">Yarışma takvimi</h3>
          <p className="event-phone-secondary">{new Date(event.startsAt).toLocaleString('tr-TR')} — {new Date(event.endsAt).toLocaleString('tr-TR')}</p>
          <h3 className="event-phone-subheading">Katılım ve sıralama</h3>
          {event.rules.split(/\n\s*\n/).filter(Boolean).map((text, index) => <p key={index} className="event-phone-secondary">{text}</p>)}
        </div>
      </div>
    </div></div>
  </>
}
