import type { HTMLAttributes, ReactNode } from "react"

import { cn } from "../../../lib/utils"

type CardTone = "default" | "quiet" | "accent"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone
}

/**
 * Surface for grouped content. "quiet" sits flush on the canvas (no shadow) for
 * secondary groups; "accent" marks the single thing a page wants attention on.
 */
export function Card({ className, tone = "default", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border",
        tone === "default" && "border-line bg-surface shadow-card",
        tone === "quiet" && "border-line bg-surface-2/60",
        tone === "accent" && "border-accent/30 bg-accent-soft text-accent-ink",
        className,
      )}
      {...props}
    />
  )
}

interface CardHeaderProps {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

export function CardHeader({ title, description, actions, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-base font-bold text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  )
}
