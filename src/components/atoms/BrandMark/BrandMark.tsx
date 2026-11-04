import { cn } from "../../../lib/utils"

interface BrandMarkProps {
  className?: string
  /** Show the ADMIN PANEL wordmark next to the symbol. */
  withWordmark?: boolean
  subtitle?: string
}

/** Neutral, self-authored mark. No third-party imagery is used. */
export function BrandMark({ className, withWordmark = true, subtitle }: BrandMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent font-display text-[15px] leading-none text-accent-ink"
      >
        AP
      </span>
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className="text-[13px] font-extrabold tracking-[0.22em] text-ink">ADMIN PANEL</span>
          {subtitle && <span className="mt-1 text-xs font-medium text-muted">{subtitle}</span>}
        </span>
      )}
      <span className="sr-only">Admin Panel</span>
    </span>
  )
}
