import type { ButtonHTMLAttributes, ReactNode } from "react"

import { cn } from "../../../lib/utils"

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  label: string
}

export function IconButton({ children, className, label, type = "button", ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full text-ink-soft transition-[background-color,color,transform] duration-150 hover:bg-surface-2 hover:text-ink active:scale-95 disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
