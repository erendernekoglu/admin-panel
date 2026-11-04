import { useQueryClient } from "@tanstack/react-query"
import { LogOut, X } from "lucide-react"

import { useLayoutEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router"

import { Avatar } from "../../atoms/Avatar"
import { BrandMark } from "../../atoms/BrandMark"
import { IconButton } from "../../atoms/IconButton"
import { prefetchRoute } from "../../../app/prefetch"
import { useAuth } from "../../../features/auth/useAuth"
import { CONSOLE_ROLE_LABELS } from "../../../lib/auth/permissions"
import { isDemoMode } from "../../../lib/config"
import { cn } from "../../../lib/utils"
import { navGroupsFor } from "./navigation"

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { adminProfile, consoleRole, user, logout } = useAuth()
  const groups = navGroupsFor(consoleRole)
  const displayName = adminProfile?.displayName || user?.displayName || "Yönetici"
  const { pathname } = useLocation()
  const queryClient = useQueryClient()

  // One marker glides to the active item — the panel's only ambient motion,
  // carrying the active-item dot.
  const navRef = useRef<HTMLElement>(null)
  const [marker, setMarker] = useState<{ top: number; height: number } | null>(null)
  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return
    // Measure against the nav itself, and again whenever its layout settles:
    // the web font arriving after first paint changes every row height.
    const measure = () => {
      const active = nav.querySelector<HTMLElement>('[aria-current="page"]')
      if (!active) return setMarker(null)
      const top = active.getBoundingClientRect().top - nav.getBoundingClientRect().top + nav.scrollTop
      setMarker({ top, height: active.offsetHeight })
    }
    measure()
    let cancelled = false
    document.fonts?.ready.then(() => !cancelled && measure())
    const observer = new ResizeObserver(measure)
    observer.observe(nav)
    for (const group of nav.querySelectorAll(":scope > div")) observer.observe(group)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [pathname])

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[264px] flex-col border-r border-line bg-canvas transition-transform duration-300 ease-[var(--ease-panel)] md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 pb-4 pt-6">
          <Link aria-label="Genel bakışa git" onClick={onClose} to="/dashboard">
            <BrandMark subtitle="Yönetim paneli" />
          </Link>
          <IconButton className="md:hidden" label="Menüyü kapat" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>

        <nav aria-label="Ana menü" className="relative flex-1 overflow-y-auto px-3 pb-4" ref={navRef}>
          {marker && (
            <span
              aria-hidden
              className="pointer-events-none absolute left-3 right-3 top-0 rounded-xl bg-surface shadow-card transition-[transform,height] duration-500 ease-[var(--ease-panel)]"
              style={{ height: marker.height, transform: `translateY(${marker.top}px)` }}
            >
              <span className="absolute -left-[5px] top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-signal ring-4 ring-canvas" />
            </span>
          )}
          {groups.map((group) => (
            <div className="mt-5 first:mt-1" key={group.label}>
              <p className="px-3 pb-1.5 text-xs font-semibold text-muted">{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = item.match(pathname)
                return (
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150",
                      isActive ? "text-ink" : "text-ink-soft hover:bg-surface-2/70 hover:text-ink",
                    )}
                    key={item.href}
                    onClick={onClose}
                    onFocus={() => prefetchRoute(item.href, queryClient, consoleRole)}
                    onMouseEnter={() => prefetchRoute(item.href, queryClient, consoleRole)}
                    to={item.href}
                  >
                    <Icon className={cn("shrink-0 transition-colors", isActive ? "text-accent" : "text-muted")} size={18} strokeWidth={1.9} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar name={displayName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
              <p className="truncate text-xs text-muted">
                {consoleRole && (
                  <span className="font-semibold text-ink-soft">
                    {isDemoMode ? "Örnek yönetici" : CONSOLE_ROLE_LABELS[consoleRole]} ·{" "}
                  </span>
                )}
                {adminProfile?.email ?? user?.email ?? ""}
              </p>
            </div>
            <IconButton label="Çıkış yap" onClick={() => void logout()}>
              <LogOut size={17} />
            </IconButton>
          </div>
        </div>
      </aside>
    </>
  )
}
