import { useEffect, useId, useMemo, useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { KeyRound, Loader2, Search, Store, User } from "lucide-react"
import { useNavigate } from "react-router"

import { Dialog } from "../../molecules/Dialog"
import { apiKeysQueryOptions } from "../../../features/api-keys/hooks/useApiKeys"
import { useAuth } from "../../../features/auth/useAuth"
import { useUserSearch } from "../../../features/users/hooks/useUsers"
import { boutiquesQueryOptions } from "../../../lib/api/boutique"
import { cn } from "../../../lib/utils"
import { navGroupsFor } from "../Sidebar/navigation"

const SEARCH_DEBOUNCE_MS = 250
const MAX_PER_GROUP = 6

interface PaletteItem {
  id: string
  group: string
  label: string
  detail?: string
  icon: ReactNode
  href: string
}

function normalize(value: string) {
  return value.toLocaleLowerCase("tr-TR")
}

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [delay, value])
  return debounced
}

/**
 * Ctrl/Cmd+K palette: screens by name, users by e-mail prefix or exact UID,
 * boutiques by name or e-mail and API keys by name, owner or key id. Choosing
 * a result opens its detail page.
 */
export default function CommandPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const listId = useId()
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const term = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS)
  const needle = normalize(term)
  const hasTerm = needle.length > 0

  const { can, consoleRole } = useAuth()
  const screensForRole = useMemo(() => navGroupsFor(consoleRole).flatMap((g) => g.items), [consoleRole])
  const canUsers = can("users.read")
  const canBoutiques = can("boutiques.review")
  const canApiKeys = can("system.manage")

  // Each group is searched only when the role may open what it finds.
  const users = useUserSearch(canUsers ? term : "")
  const boutiques = useQuery({ ...boutiquesQueryOptions, enabled: hasTerm && canBoutiques })
  const apiKeys = useQuery({ ...apiKeysQueryOptions, enabled: hasTerm && canApiKeys })

  const items = useMemo<PaletteItem[]>(() => {
    const screenNeedle = normalize(query.trim())
    const screens = screensForRole
      .filter((item) => !screenNeedle || normalize(item.label).includes(screenNeedle))
      .slice(0, screenNeedle ? MAX_PER_GROUP : screensForRole.length)
      .map<PaletteItem>((item) => {
        const Icon = item.icon
        return {
          id: `screen:${item.href}`,
          group: "Ekranlar",
          label: item.label,
          icon: <Icon size={16} />,
          href: item.href,
        }
      })
    if (!hasTerm) return screens

    const userItems = (canUsers ? users.data ?? [] : []).slice(0, MAX_PER_GROUP).map<PaletteItem>((user) => ({
      id: `user:${user.uid}`,
      group: "Kullanıcılar",
      label: user.displayName || user.email || user.uid,
      detail: user.displayName ? user.email : user.uid,
      icon: <User size={16} />,
      href: `/users/${encodeURIComponent(user.uid)}`,
    }))

    const boutiqueItems = (canBoutiques ? boutiques.data ?? [] : [])
      .filter((shop) => normalize(`${shop.name} ${shop.email}`).includes(needle))
      .slice(0, MAX_PER_GROUP)
      .map<PaletteItem>((shop) => ({
        id: `boutique:${shop.id}`,
        group: "Butikler",
        label: shop.name,
        detail: shop.email,
        icon: <Store size={16} />,
        href: `/boutique?shop=${encodeURIComponent(shop.id)}`,
      }))

    const apiKeyItems = (canApiKeys ? apiKeys.data ?? [] : [])
      .filter((key) =>
        normalize(`${key.name} ${key.ownerEmail} ${key.keyId} ${key.displayPrefix}`).includes(needle),
      )
      .slice(0, MAX_PER_GROUP)
      .map<PaletteItem>((key) => ({
        id: `api-key:${key.keyId}`,
        group: "API anahtarları",
        label: key.name,
        detail: `${key.displayPrefix}…${key.lastFour} · ${key.ownerEmail}`,
        icon: <KeyRound size={16} />,
        href: `/api-keys/${encodeURIComponent(key.keyId)}`,
      }))

    return [...screens, ...userItems, ...boutiqueItems, ...apiKeyItems]
  }, [apiKeys.data, boutiques.data, canApiKeys, canBoutiques, canUsers, hasTerm, needle, query, screensForRole, users.data])

  const isSearching =
    hasTerm &&
    ((canUsers && users.isFetching) || (canBoutiques && boutiques.isFetching) || (canApiKeys && apiKeys.isFetching))
  const failedGroups = hasTerm
    ? [
        canUsers && users.isError && "kullanıcılar",
        canBoutiques && boutiques.isError && "butikler",
        canApiKeys && apiKeys.isError && "API anahtarları",
      ].filter(Boolean)
    : []
  const active = Math.min(activeIndex, Math.max(0, items.length - 1))
  const activeItem = items[active]

  function choose(item: PaletteItem | undefined) {
    if (!item) return
    onClose()
    navigate(item.href)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((active + 1) % Math.max(1, items.length))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((active - 1 + items.length) % Math.max(1, items.length))
    } else if (event.key === "Enter") {
      event.preventDefault()
      choose(activeItem)
    }
  }

  return (
    <Dialog className="max-w-xl overflow-hidden" closeOnBackdrop label="Komut paleti" onClose={onClose}>
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search aria-hidden className="size-4 shrink-0 text-muted" />
        <input
          aria-activedescendant={activeItem ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded="true"
          aria-label="Ekran, kullanıcı, butik veya API anahtarı ara"
          autoFocus
          className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none! placeholder:text-muted"
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ekran, e-posta, UID, butik veya API anahtarı…"
          role="combobox"
          type="text"
          value={query}
        />
        {isSearching && <Loader2 aria-hidden className="size-4 shrink-0 animate-spin text-muted" />}
      </div>

      <ul className="max-h-[min(60vh,420px)] overflow-y-auto p-1.5" id={listId} role="listbox">
        {items.map((item, index) => {
          const header = items[index - 1]?.group !== item.group ? item.group : null
          return (
            <li key={item.id} role="presentation">
              {header && (
                <p className="px-3 pt-2.5 pb-1 text-xs font-semibold text-muted" role="presentation">
                  {header}
                </p>
              )}
              <div
                aria-selected={index === active}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm",
                  index === active ? "bg-surface-2 text-ink" : "text-ink-soft",
                )}
                id={`${listId}-${index}`}
                onClick={() => choose(item)}
                onMouseMove={() => index !== active && setActiveIndex(index)}
                role="option"
              >
                <span className="shrink-0 text-muted">{item.icon}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                {item.detail && (
                  <span className="max-w-[45%] truncate font-mono text-xs text-muted">{item.detail}</span>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {(items.length === 0 || failedGroups.length > 0) && (
        <div className="border-t border-line px-4 py-3 text-sm text-muted" role="status">
          {items.length === 0 && !isSearching && <p>Sonuç yok. E-postanın başını ya da tam UID'yi deneyin.</p>}
          {failedGroups.length > 0 && <p>Şunlar aranamadı: {failedGroups.join(", ")}.</p>}
        </div>
      )}

      <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-xs text-muted">
        <span>
          <kbd className="font-sans font-semibold">↑↓</kbd> gez
        </span>
        <span>
          <kbd className="font-sans font-semibold">Enter</kbd> aç
        </span>
        <span>
          <kbd className="font-sans font-semibold">Esc</kbd> kapat
        </span>
      </div>
    </Dialog>
  )
}
