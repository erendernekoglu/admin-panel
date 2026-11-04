import type { EventAboutSection } from "./eventAbout"
import { adminRequest } from "../../lib/api/client"

export interface StyleEvent {
  id: string; title: string; description: string; rules: string; coverUrl: string;
  startsAt: number; endsAt: number; status: "draft" | "published" | "completed";
  prize: { kind: "aura" | "physical" | "digital"; title: string; description: string; imageUrl: string; aura: number };
  aboutSections?: EventAboutSection[];
  rewardDesignId?: "autumn-2026-tr"; countryCode?: string;
  runwayReward?: { finalistCount: 5; imageUrl: string };
  runwayFinalists?: { postId: string; rank: number }[];
  winners?: { postId: string; rank: 1 | 2 | 3 }[]; themeDelivery?: "pending" | "completed";
  winnerPostId?: string; deliveryStatus?: "pending" | "delivered";
}
export interface Entry { post: { id: string; caption: string; isAnonymous: boolean; author?: { displayName: string }; media: { url: string }[] }; likes: number; disqualified: boolean }

/* ------------------------------------------------------------------------- */
/* Local demo data. Every image is an inline SVG data URL; nothing is fetched */
/* from the network, and all mutations live in memory until the page reloads. */
/* ------------------------------------------------------------------------- */

const image = (label: string, from: string, to: string, width = 600, height = 800) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#g)"/><circle cx="${width * 0.8}" cy="${height * 0.18}" r="${width * 0.3}" fill="#ffffff" opacity=".14"/><text x="${width * 0.08}" y="${height * 0.52}" fill="#ffffff" font-family="Georgia, serif" font-size="${Math.round(width * 0.07)}" font-weight="700">${label}</text><text x="${width * 0.08}" y="${height * 0.58}" fill="#ffffff" opacity=".75" font-family="Helvetica, sans-serif" font-size="${Math.round(width * 0.032)}">demo görseli</text></svg>`,
  )}`

const day = 86400000
const now = Date.now()

const aboutFallback: EventAboutSection[] = [
  {
    id: "about-demo-1",
    type: "text",
    title: "Yarışmaya nasıl katılırsın?",
    body: "Kombinini etkinlikte paylaş. **En fazla 3 kombinle** katılabilirsin. Anonim paylaşım seçebilirsin.",
  },
  {
    id: "about-demo-2",
    type: "reward",
    icon: "trophy",
    title: "Kazananları bekleyen ödül",
    value: "İlk 3",
    body: "Dereceye giren hesaplara ödül otomatik olarak tanımlanır.",
  },
]

const initialEvents: StyleEvent[] = [
  {
    id: "evt-demo-01",
    title: "Sonbahar Kombin Yarışması",
    description:
      "Sonbahar renklerini taşıyan kombinini paylaş, topluluğun beğenisine sun. Katılım ücretsizdir.",
    rules:
      "Kombininde en az bir sezonluk parça kullan.\n\nFotoğrafın net ve tek kombine ait olmalı.\n\nTopluluk kurallarına uymayan paylaşımlar değerlendirme dışı bırakılır.",
    coverUrl: image("Sonbahar Kombin", "#b58148", "#5c3a20", 900, 450),
    startsAt: now - 3 * day,
    endsAt: now + 4 * day,
    status: "published",
    prize: {
      kind: "aura",
      title: "250 Aura",
      description: "Birinci olan uygun hesaba 250 Aura eklenir.",
      imageUrl: image("250 Aura", "#d8a02a", "#8b5d13", 600, 600),
      aura: 250,
    },
    aboutSections: [
      ...aboutFallback,
      {
        id: "about-demo-3",
        type: "badge-gallery",
        title: "Katılım rozetleri",
        body: "İlk üç kombin bu rozetleri profiline ekler.",
        designId: "autumn-2026-tr",
      },
      {
        id: "about-demo-4",
        type: "profile-theme",
        title: "Profil teması",
        body: "Geçerli katılımda tema geçici olarak açılır.",
        designId: "autumn-2026-tr",
      },
    ],
    countryCode: "TR",
  },
  {
    id: "evt-demo-02",
    title: "Kış Katmanları",
    description:
      "Katmanlı kış kombinlerini göster. Kalın kumaşlar, sıcak tonlar ve dengeli siluetler öne çıksın.",
    rules:
      "En az iki katman kullan.\n\nAksesuar opsiyoneldir.\n\nEtkinlik başlamadan önce taslak olarak kalır.",
    coverUrl: image("Kış Katmanları", "#6d7f8c", "#2c3841", 900, 450),
    startsAt: now + 10 * day,
    endsAt: now + 17 * day,
    status: "draft",
    prize: {
      kind: "physical",
      title: "Yün atkı seti",
      description: "Kazanan katılımcıya demo butiğinden yün atkı seti gönderilir. Teslimat panelden takip edilir.",
      imageUrl: image("Yün Atkı", "#8d9aa5", "#4b5963", 600, 600),
      aura: 0,
    },
    aboutSections: [
      {
        id: "about-winter-1",
        type: "image",
        title: "Sezon ilhamı",
        body: "Katmanlı kombinler için sade bir ilham panosu.",
        imageUrl: image("Sezon İlhamı", "#9aa8b3", "#55636d", 600, 400),
        imageAlt: "Kış sezonu ilham görseli",
        imageAspectRatio: 1.5,
      },
      {
        id: "about-winter-2",
        type: "text",
        title: "Değerlendirme",
        body: "Kombinler özgünlük, katman dengesi ve fotoğraf kalitesine göre değerlendirilir.",
      },
    ],
    countryCode: "TR",
  },
  {
    id: "evt-demo-03",
    title: "Bahar Renkleri",
    description: "Tamamlanmış demo etkinliği. Sonuçlar ve ödül teslimatı bu ekranda görülebilir.",
    rules: "Açık renkleri ve hafif kumaşları kullan.\n\nSonuçlar etkinlik bitiminde açıklanır.",
    coverUrl: image("Bahar Renkleri", "#c9a7a0", "#7d5a56", 900, 450),
    startsAt: now - 30 * day,
    endsAt: now - 23 * day,
    status: "completed",
    prize: {
      kind: "digital",
      title: "Bahar rozetleri",
      description: "İlk üç farklı hesaba mevcut dijital rozetler tanımlandı.",
      imageUrl: image("Bahar Rozetleri", "#d9b3a8", "#8f6a61", 600, 600),
      aura: 0,
    },
    aboutSections: aboutFallback,
    rewardDesignId: "autumn-2026-tr",
    countryCode: "TR",
    winners: [
      { postId: "post-spring-1", rank: 1 },
      { postId: "post-spring-2", rank: 2 },
      { postId: "post-spring-3", rank: 3 },
    ],
    themeDelivery: "completed",
    winnerPostId: "post-spring-1",
    deliveryStatus: "delivered",
  },
]

const initialEntries: Record<string, Entry[]> = {
  "evt-demo-01": [
    {
      post: {
        id: "post-autumn-1",
        caption: "Hardal ceket ve keten etek.",
        isAnonymous: false,
        author: { displayName: "Demo Kullanıcı Ada" },
        media: [{ url: image("Ada", "#b98a5b", "#6b4326") }],
      },
      likes: 142,
      disqualified: false,
    },
    {
      post: {
        id: "post-autumn-2",
        caption: "Katmanlı ofis kombini.",
        isAnonymous: true,
        media: [{ url: image("Anonim", "#8b8b8b", "#3d3d3d") }],
      },
      likes: 118,
      disqualified: false,
    },
    {
      post: {
        id: "post-autumn-3",
        caption: "Zeytin tonlarında günlük kombin.",
        isAnonymous: false,
        author: { displayName: "Demo Kullanıcı Deniz" },
        media: [{ url: image("Deniz", "#7d8a62", "#414a31") }],
      },
      likes: 97,
      disqualified: false,
    },
    {
      post: {
        id: "post-autumn-4",
        caption: "Keten gömlek ve midi etek.",
        isAnonymous: false,
        author: { displayName: "Demo Kullanıcı Ece" },
        media: [{ url: image("Ece", "#c3b49f", "#7d6c58") }],
      },
      likes: 73,
      disqualified: false,
    },
    {
      post: {
        id: "post-autumn-5",
        caption: "Sade ama dengeli.",
        isAnonymous: true,
        media: [{ url: image("Anonim 2", "#a6a6a6", "#555555") }],
      },
      likes: 51,
      disqualified: false,
    },
  ],
  "evt-demo-03": [
    {
      post: {
        id: "post-spring-1",
        caption: "Açık pembe gömlek ve krem pantolon.",
        isAnonymous: false,
        author: { displayName: "Demo Kullanıcı Lale" },
        media: [{ url: image("Lale", "#d7b0a6", "#8c6259") }],
      },
      likes: 204,
      disqualified: false,
    },
    {
      post: {
        id: "post-spring-2",
        caption: "Bahar yeşili etek.",
        isAnonymous: false,
        author: { displayName: "Demo Kullanıcı Mert" },
        media: [{ url: image("Mert", "#9fb98b", "#5b744a") }],
      },
      likes: 181,
      disqualified: false,
    },
    {
      post: {
        id: "post-spring-3",
        caption: "Pastel tonlarda katman.",
        isAnonymous: true,
        media: [{ url: image("Anonim 3", "#b8c3cf", "#6f7c88") }],
      },
      likes: 160,
      disqualified: false,
    },
    {
      post: {
        id: "post-spring-4",
        caption: "Kurallara uymayan demo paylaşım.",
        isAnonymous: true,
        media: [{ url: image("Demo 4", "#c9b3b3", "#7a5f5f") }],
      },
      likes: 22,
      disqualified: true,
    },
  ],
}

const store: {
  events: StyleEvent[]
  entries: Record<string, Entry[]>
  winners: Record<string, string | null>
} = {
  events: initialEvents.map((event) => structuredClone(event)),
  entries: structuredClone(initialEntries),
  winners: {
    "evt-demo-03": "demo-user-01",
  },
}

const PAGE_SIZE = 20
const ENTRY_PAGE_SIZE = 6

function eventOrThrow(eventId: string): StyleEvent {
  const event = store.events.find((item) => item.id === eventId)
  if (!event) throw new Error(`Style event ${eventId} was not found.`)
  return event
}

function localImage(value: string, field: string): string {
  if (!value) return ""
  if (/^data:image\//i.test(value) || /^blob:/i.test(value)) return value
  throw new Error(`${field} must be a local data or blob URL in demo mode; remote URLs are not allowed.`)
}

function validateEvent(event: StyleEvent): void {
  if (!event.title.trim() || event.title.length > 120) {
    throw new Error("Event title must be between 1 and 120 characters.")
  }
  if (!event.description.trim() || event.description.length > 3000) {
    throw new Error("Event description must be between 1 and 3000 characters.")
  }
  if (!Number.isFinite(event.startsAt) || !Number.isFinite(event.endsAt)) {
    throw new Error("Event dates are invalid.")
  }
  if (event.endsAt <= event.startsAt) {
    throw new Error("Event end date must be after the start date.")
  }
  if ((event.aboutSections?.length ?? 0) > 20) {
    throw new Error("An event can have at most 20 about sections.")
  }
  if (event.prize.kind === "aura" && (!Number.isInteger(event.prize.aura) || event.prize.aura < 1)) {
    throw new Error("Aura prize must be a positive integer.")
  }
  localImage(event.coverUrl, "Cover image")
  localImage(event.prize.imageUrl, "Prize image")
  for (const section of event.aboutSections ?? []) {
    if (section.imageUrl) localImage(section.imageUrl, `Section "${section.title}" image`)
    for (const badge of section.images ?? []) {
      localImage(badge.url, `Badge "${badge.label}" image`)
    }
  }
}

function page<T>(items: T[], cursor: string | undefined, size: number): { items: T[]; cursor: string | null } {
  const start = cursor ? Number(cursor) : 0
  if (!Number.isInteger(start) || start < 0) throw new Error("Invalid pagination cursor.")
  const slice = items.slice(start, start + size)
  const next = start + size < items.length ? String(start + size) : null
  return { items: slice, cursor: next }
}

function saveEventDemo(event: StyleEvent): StyleEvent {
  validateEvent(event)
  const existing = event.id ? store.events.find((item) => item.id === event.id) : undefined
  if (existing) {
    const locked = existing.status === "published" && existing.startsAt <= Date.now()
    if (locked) {
      throw new Error("This event has started; participation terms and about content are locked.")
    }
    const saved: StyleEvent = {
      ...event,
      id: existing.id,
      status: event.status === "completed" ? "completed" : event.status,
    }
    store.events = store.events.map((item) => (item.id === saved.id ? saved : item))
    return saved
  }
  const saved: StyleEvent = {
    ...event,
    id: `evt-demo-${String(store.events.length + 1).padStart(2, "0")}`,
    status: event.status === "completed" ? "published" : event.status,
  }
  store.events = [saved, ...store.events]
  store.entries[saved.id] = []
  return saved
}

function listEventsDemo(cursor?: string) {
  return page(store.events, cursor, PAGE_SIZE)
}

function listEntriesDemo(eventId: string, cursor?: string) {
  eventOrThrow(eventId)
  const entries = [...(store.entries[eventId] ?? [])].sort((a, b) => b.likes - a.likes)
  return page(entries, cursor, ENTRY_PAGE_SIZE)
}

function disqualifyDemo(eventId: string, postId: string, reason: string) {
  const event = eventOrThrow(eventId)
  if (!reason.trim()) throw new Error("A disqualification reason is required.")
  if (event.status === "completed") throw new Error("Completed events cannot be moderated.")
  const entry = (store.entries[eventId] ?? []).find((item) => item.post.id === postId)
  if (!entry) throw new Error(`Entry ${postId} was not found.`)
  entry.disqualified = true
  return { ok: true }
}

function completeDemo(eventId: string): StyleEvent {
  const event = eventOrThrow(eventId)
  if (event.status !== "published") throw new Error("Only published events can be completed.")
  if (event.endsAt > Date.now()) throw new Error("The event has not ended yet.")
  const ranked = [...(store.entries[eventId] ?? [])]
    .filter((entry) => !entry.disqualified)
    .sort((a, b) => b.likes - a.likes)
  if (!ranked.length) throw new Error("No eligible entries were found for this event.")
  if (event.prize.kind === "digital") {
    const winners = ranked.slice(0, 3).map((entry, index) => ({
      postId: entry.post.id,
      rank: (index + 1) as 1 | 2 | 3,
    }))
    event.winners = winners
    event.winnerPostId = winners[0]?.postId
    event.themeDelivery = "completed"
  } else {
    event.winnerPostId = ranked[0].post.id
    if (event.prize.kind === "physical") event.deliveryStatus = "pending"
  }
  event.status = "completed"
  store.winners[eventId] = null
  return event
}

function markDeliveredDemo(eventId: string): StyleEvent {
  const event = eventOrThrow(eventId)
  if (event.status !== "completed") throw new Error("Only completed events can be marked delivered.")
  if (event.deliveryStatus !== "pending") {
    throw new Error("This event has no pending prize delivery.")
  }
  event.deliveryStatus = "delivered"
  return event
}

function winnerDemo(eventId: string) {
  eventOrThrow(eventId)
  return { uid: store.winners[eventId] ?? null }
}

function base64FromDataUrl(dataUrl: string): string {
  const comma = dataUrl.indexOf(",")
  if (comma < 0) throw new Error("The image could not be read.")
  return dataUrl.slice(comma + 1)
}

export const listEvents = (cursor?: string) =>
  adminRequest<{ items: StyleEvent[]; cursor: string | null }>(
    "styleEvents.list",
    { admin: true, ...(cursor ? { cursor } : {}) },
    () => listEventsDemo(cursor),
  )

export const saveEvent = (event: StyleEvent) =>
  adminRequest<StyleEvent>("styleEvents.save", event, () => saveEventDemo(event))

export const listEntries = (eventId: string, cursor?: string) =>
  adminRequest<{ items: Entry[]; cursor: string | null }>(
    "styleEvents.listEntries",
    { eventId, admin: true, sort: "likes", ...(cursor ? { cursor } : {}) },
    () => listEntriesDemo(eventId, cursor),
  )

export const disqualifyEntry = (eventId: string, postId: string, reason: string) =>
  adminRequest<{ ok: boolean }>(
    "styleEvents.disqualifyEntry",
    { eventId, postId, reason },
    () => disqualifyDemo(eventId, postId, reason),
  )

export const completeEvent = (eventId: string) =>
  adminRequest<StyleEvent>("styleEvents.complete", { eventId }, () => completeDemo(eventId))

export const markDelivered = (eventId: string) =>
  adminRequest<StyleEvent>(
    "styleEvents.markDelivered",
    { eventId },
    () => markDeliveredDemo(eventId),
  )

export async function uploadEventImage(file: File): Promise<string> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    throw new Error("Image must be a PNG, JPEG or WebP file.")
  }
  if (file.size > 4 * 1024 * 1024) throw new Error("Görsel en fazla 4 MB olabilir.")
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Görsel okunamadı."))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(file)
  })
  const result = await adminRequest<{ url: string }>(
    "styleEvents.uploadImage",
    {
      fileName: file.name,
      mimeType: file.type,
      base64: base64FromDataUrl(dataUrl),
    },
    () => ({ url: dataUrl }),
  )
  if (!result || typeof result.url !== "string" || !result.url) {
    throw new Error("The image upload returned no local URL.")
  }
  return result.url
}

export const getWinner = (eventId: string) =>
  adminRequest<{ uid: string | null }>(
    "styleEvents.getWinner",
    { eventId },
    () => winnerDemo(eventId),
  )
