import type { FormEventHandler, ReactNode } from "react"

import {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
} from "../../../components/molecules/Dialog"
import { cn } from "../../../lib/utils"

interface DialogShellProps {
  /** id used for aria-labelledby on the dialog. */
  titleId: string
  title: ReactNode
  description?: ReactNode
  /** Optional icon badge shown before the title (e.g. a warning sign). */
  icon?: ReactNode
  children?: ReactNode
  footer: ReactNode
  onClose: () => void
  onSubmit?: FormEventHandler<HTMLFormElement>
  className?: string
}

/** Header, body and footer layout of the redeem-code dialogs on the shared Dialog. */
export function DialogShell({
  children,
  className,
  description,
  footer,
  icon,
  onClose,
  onSubmit,
  title,
  titleId,
}: DialogShellProps) {
  const content = (
    <>
      <DialogHeader description={description} icon={icon} id={titleId} onClose={onClose}>
        {title}
      </DialogHeader>
      {children ? <DialogBody>{children}</DialogBody> : null}
      <DialogFooter>{footer}</DialogFooter>
    </>
  )

  return (
    <Dialog className={cn("max-w-lg", className)} labelledBy={titleId} onClose={onClose} size="sm">
      {onSubmit ? <form onSubmit={onSubmit}>{content}</form> : content}
    </Dialog>
  )
}

export const fieldLabelClassName = "block text-sm font-medium text-ink"
