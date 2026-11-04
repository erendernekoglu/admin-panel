import type { InputHTMLAttributes } from "react"

import { cn } from "../../../lib/utils"

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 rounded-xl border border-line-input bg-surface px-3.5 text-sm text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted hover:border-ink/30 focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  )
}
