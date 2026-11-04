import type { ReactNode } from "react"

import { cn } from "../../../lib/utils"

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "ink"

interface BadgeProps {
  children: ReactNode
  className?: string
  tone?: BadgeTone
}

export function Badge({ children, className, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        tone === "neutral" && "bg-surface-2 text-ink-soft",
        tone === "accent" && "bg-accent-soft text-accent-ink",
        tone === "success" && "bg-success-soft text-success",
        tone === "warning" && "bg-warning-soft text-warning",
        tone === "danger" && "bg-danger-soft text-danger",
        tone === "ink" && "bg-ink text-canvas",
        className,
      )}
    >
      {children}
    </span>
  )
}
