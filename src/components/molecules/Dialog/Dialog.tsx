import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

import { cn } from "../../../lib/utils"

interface DialogProps {
  children: ReactNode
  className?: string
  /** id of the visible title; use `label` instead when there is none. */
  labelledBy?: string
  label?: string
  /**
   * Escape closes the dialog when provided. Omit it for dialogs that must be
   * acknowledged (e.g. a secret shown once).
   */
  onClose?: () => void
  /** A click on the backdrop also closes. Off by default so forms are not lost. */
  closeOnBackdrop?: boolean
  /** "center" for forms and confirmations, "side" for a drawer opened from a row. */
  placement?: "center" | "side"
  size?: "sm" | "md" | "lg"
}

/**
 * The one dialog frame of the panel: backdrop, panel that pops in once, Escape
 * to close, focus moved into the panel and handed back on close.
 *
 * Centred panels sit in a scrollable backdrop with auto margins, so short
 * dialogs are centred and long forms scroll as a whole on small screens.
 * Rendered into <body> so a transformed or blurred ancestor (the top bar,
 * the page's rise-in animation) cannot trap the fixed backdrop.
 */
export function Dialog({
  children,
  className,
  closeOnBackdrop = false,
  label,
  labelledBy,
  onClose,
  placement = "center",
  size = "md",
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const canClose = Boolean(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // The opener is read during the first render, before an autoFocus field
  // inside the dialog takes focus, so closing can hand focus back to it.
  const [opener] = useState(() => document.activeElement as HTMLElement | null)

  const restoreTimer = useRef<number | undefined>(undefined)

  // Runs once per opening. An autoFocus field inside keeps its focus. Handing
  // focus back waits a tick and is cancelled if the effect runs again, so a
  // development double-run does not pull focus out of the dialog.
  useEffect(() => {
    window.clearTimeout(restoreTimer.current)
    const panel = panelRef.current
    if (panel && !panel.contains(document.activeElement)) panel.focus()
    return () => {
      restoreTimer.current = window.setTimeout(() => {
        if (opener?.isConnected) opener.focus()
      })
    }
  }, [opener])

  useEffect(() => {
    if (!canClose) return
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current?.()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [canClose])

  const isSide = placement === "side"

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[90] m-0 flex animate-fade-in bg-ink/40 backdrop-blur-sm",
        isSide ? "justify-end" : "items-start justify-center overflow-y-auto p-4 sm:p-8",
      )}
      onClick={closeOnBackdrop ? () => onCloseRef.current?.() : undefined}
    >
      <div
        aria-label={label}
        aria-labelledby={labelledBy}
        aria-modal="true"
        className={cn(
          "animate-pop-in border-line bg-surface shadow-card outline-none",
          isSide
            ? "h-full w-full max-w-xl origin-right overflow-y-auto border-l"
            : "my-auto w-full rounded-2xl border",
          size === "sm" && "max-w-md",
          size === "md" && (isSide ? "max-w-xl" : "max-w-2xl"),
          size === "lg" && "max-w-3xl",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function DialogHeader({
  children,
  description,
  icon,
  id,
  onClose,
}: {
  children: ReactNode
  description?: ReactNode
  /** Optional badge before the title, e.g. a warning sign. */
  icon?: ReactNode
  id: string
  onClose?: () => void
}) {
  return (
    <div className="flex items-start gap-3 border-b border-line px-5 py-4 sm:px-6">
      {icon}
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-bold text-ink" id={id}>
          {children}
        </h2>
        {description && <div className="mt-1 text-sm leading-6 text-ink-soft">{description}</div>}
      </div>
      {onClose && (
        <button
          aria-label="Kapat"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  )
}

export function DialogBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-4 px-5 py-5 sm:px-6", className)}>{children}</div>
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
      {children}
    </div>
  )
}

/** Inline error inside a dialog; pops in when an action fails. */
export function DialogError({ children }: { children: ReactNode }) {
  return (
    <p
      className="animate-pop-in rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger"
      role="alert"
    >
      {children}
    </p>
  )
}

/** Calm notice for prerequisites shown inside a dialog. */
export function DialogNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-xl bg-warning-soft px-3.5 py-3 text-sm text-warning">
      {children}
    </div>
  )
}
