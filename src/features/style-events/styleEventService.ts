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
/* Local preview store. Starts empty: no events, entries or winners are      */
/* seeded; records exist only after the user creates them in this session.   */
/* ------------------------------------------------------------------------- */

const store: {
  events: StyleEvent[]
  entries: Record<string, Entry[]>
  winners: Record<string, string | null>
} = {
  events: [],
  entries: {},
  winners: {},
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
