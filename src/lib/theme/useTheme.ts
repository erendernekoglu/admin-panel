import { useCallback, useSyncExternalStore } from "react"

export type Theme = "light" | "dark"
const STORAGE_KEY = "admin-panel-theme"
const listeners = new Set<() => void>()

function read(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light"
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setTheme(theme: Theme) {
  const root = document.documentElement
  // Cross-fade the whole page instead of snapping colors where supported.
  const apply = () => {
    root.dataset.theme = theme
    listeners.forEach((l) => l())
  }
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
  if (doc.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) doc.startViewTransition(apply)
  else apply()
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* storage unavailable: the choice lasts for this tab only */
  }
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, read, () => "light" as Theme)
  const toggle = useCallback(() => setTheme(read() === "dark" ? "light" : "dark"), [])
  return { theme, setTheme, toggle }
}
