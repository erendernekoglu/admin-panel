import type { ReactNode } from "react"

import { BrandMark } from "../../components/atoms/BrandMark"

interface StatusScreenProps {
  actions?: ReactNode
  /** Small line above the headline, e.g. "404". */
  code?: string
  children?: ReactNode
  description: ReactNode
  title: string
}

/**
 * Full-screen, centred message for screens that live outside the admin shell:
 * not found, access denied and route errors.
 */
export function StatusScreen({ actions, code, children, description, title }: StatusScreenProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-5 py-12 text-center text-ink">
      <BrandMark subtitle="Yönetim paneli" />

      <div className="mt-12 w-full max-w-lg">
        {code && <p className="text-sm font-semibold text-muted">{code}</p>}
        <h1 className="mt-2 font-display text-[clamp(2.25rem,7vw,3.5rem)] leading-[1.02] font-normal tracking-[0.01em] text-ink">
          <span className="inline-block animate-title-in">{title}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">{description}</p>

        {children}

        {actions && <div className="mt-8 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
      </div>
    </main>
  )
}

/** Quiet full-screen wait state used while the session is being checked. */
export function SessionCheckScreen({ label }: { label: string }) {
  return (
    <main
      aria-live="polite"
      className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-canvas px-6 text-ink-soft"
      role="status"
    >
      <BrandMark withWordmark={false} />
      <p className="text-sm font-medium">{label}</p>
    </main>
  )
}
