import type { ReactNode } from "react"

import { cn } from "../../../lib/utils"

interface PageHeaderProps {
  title: string
  description?: ReactNode
  /** Optional icon shown before the title. */
  icon?: ReactNode
  /** Small context line above the title, e.g. the parent section. Use sparingly. */
  context?: ReactNode
  actions?: ReactNode
  className?: string
}

/**
 * The one typographic signature of the admin: page titles set in Anton.
 * The title reveals once on navigation (title-in); everything else stays still.
 */
export function PageHeader({ title, description, icon, context, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {context && <div className="mb-2 text-sm font-medium text-muted">{context}</div>}
        <h1 className="flex items-center gap-3 font-display text-[clamp(2rem,3.4vw,2.85rem)] leading-[1.02] font-normal tracking-[0.01em] text-ink">
          {icon && <span className="text-accent [&_svg]:size-[0.72em]">{icon}</span>}
          <span className="inline-block animate-title-in">{title}</span>
        </h1>
        {description && <p className="mt-2 max-w-[68ch] text-[15px] leading-relaxed text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
