import type { ReactNode } from "react"
import { X } from "lucide-react"

import { IconButton } from "../../../components/atoms/IconButton"
import { Dialog } from "../../../components/molecules/Dialog"
import { cn } from "../../../lib/utils"

interface AnalyticsDrawerProps {
  children: ReactNode
  /** Small line above the title, e.g. what kind of record this is. */
  context: string
  title: ReactNode
  meta?: ReactNode
  closeLabel: string
  onClose: () => void
  className?: string
}

/**
 * Side panel opened from a table row, on the shared Dialog: closes on Escape
 * or a click on the backdrop, and takes focus while open.
 */
export function AnalyticsDrawer({
  children,
  className,
  closeLabel,
  context,
  meta,
  onClose,
  title,
}: AnalyticsDrawerProps) {
  return (
    <Dialog
      className={cn("bg-canvas", className)}
      closeOnBackdrop
      label={typeof title === "string" ? title : context}
      onClose={onClose}
      placement="side"
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-surface px-6 py-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted">{context}</p>
          <h2 className="mt-1 truncate text-xl font-bold text-ink">{title}</h2>
          {meta ? <div className="mt-2">{meta}</div> : null}
        </div>
        <IconButton label={closeLabel} onClick={onClose}>
          <X aria-hidden size={20} />
        </IconButton>
      </div>
      {children}
    </Dialog>
  )
}
