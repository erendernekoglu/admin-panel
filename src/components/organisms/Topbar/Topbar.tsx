import { Menu, Search } from "lucide-react"
import { lazy, Suspense, useEffect, useState } from "react"
import { useLocation } from "react-router"

import { Badge } from "../../atoms/Badge"
import { IconButton } from "../../atoms/IconButton"
import { ThemeToggle } from "../../molecules/ThemeToggle"
import { allNavItems } from "../Sidebar/navigation"
import { appEnv } from "../../../lib/data/env"
import { isDemoMode } from "../../../lib/config"

// Loaded on first open so the entry chunk stays small.
const CommandPalette = lazy(() => import("../CommandPalette/CommandPalette"))

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)

const DEMO_NOTICE =
  "Yerel önizleme • Sunucuya bağlı değil • Panel boş başlar • Yenilemede girilen kayıtlar silinir"

interface TopbarProps {
  onMenuClick?: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { pathname } = useLocation()
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const current = allNavItems.find((item) => item.match(pathname))

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setIsPaletteOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <IconButton className="shrink-0 md:hidden" label="Menüyü aç" onClick={onMenuClick}>
            <Menu size={19} />
          </IconButton>
          <p className="truncate text-sm font-semibold text-ink-soft">{current?.label ?? "Yönetim paneli"}</p>
        </div>

        <button
          aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
          className="hidden h-10 w-full max-w-sm items-center gap-2.5 rounded-full border border-line bg-surface pr-2 pl-3.5 text-left text-sm text-muted transition-[border-color,box-shadow] hover:border-ink/30 focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/15 focus-visible:outline-none lg:flex"
          onClick={() => setIsPaletteOpen(true)}
          type="button"
        >
          <Search aria-hidden size={16} />
          <span className="flex-1 truncate">Ara: ekran, kullanıcı, butik, API anahtarı…</span>
          <kbd className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-sans text-xs font-semibold text-ink-soft">
            {isMac ? "⌘K" : "Ctrl K"}
          </kbd>
        </button>

        <div className="flex shrink-0 items-center gap-3">
          <Badge
            className="hidden sm:inline-flex"
            tone={isDemoMode ? "warning" : appEnv === "production" ? "success" : "warning"}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {isDemoMode ? "Yerel önizleme" : appEnv === "production" ? "Canlı" : "Test ortamı"}
          </Badge>
          <IconButton className="lg:hidden" label="Ara" onClick={() => setIsPaletteOpen(true)}>
            <Search size={18} />
          </IconButton>
          <ThemeToggle />
        </div>
      </div>

      {isDemoMode && (
        <div
          className="border-t border-warning/25 bg-warning-soft px-4 py-2 text-center text-xs font-semibold text-warning md:px-8"
          role="status"
        >
          {DEMO_NOTICE}
        </div>
      )}

      {isPaletteOpen && (
        <Suspense fallback={null}>
          <CommandPalette onClose={() => setIsPaletteOpen(false)} />
        </Suspense>
      )}
    </header>
  )
}
