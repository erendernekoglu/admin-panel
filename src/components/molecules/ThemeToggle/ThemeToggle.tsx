import { Moon, Sun } from "lucide-react"

import { useTheme } from "../../../lib/theme"
import { cn } from "../../../lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const dark = theme === "dark"
  return (
    <button
      aria-label={dark ? "Açık temaya geç" : "Koyu temaya geç"}
      aria-pressed={dark}
      className={cn(
        "relative inline-flex h-9 w-16 items-center rounded-full border border-line-strong bg-surface-2 p-1 transition-colors hover:border-accent/50",
        className,
      )}
      onClick={toggle}
      type="button"
    >
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full bg-surface text-accent shadow-card transition-transform duration-300 ease-[var(--ease-panel)]",
          dark && "translate-x-7",
        )}
      >
        {dark ? <Moon size={15} /> : <Sun size={15} />}
      </span>
    </button>
  )
}
