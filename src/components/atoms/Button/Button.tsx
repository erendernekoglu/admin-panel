import type { ButtonHTMLAttributes } from "react"

import { cn } from "../../../lib/utils"

type ButtonVariant = "primary" | "accent" | "secondary" | "ghost" | "danger"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ className, type = "button", variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[background-color,color,border-color,transform] duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-8 px-3.5 text-xs",
        size === "md" && "h-10 px-5 text-sm",
        size === "lg" && "h-12 px-6 text-[15px]",
        variant === "primary" && "bg-ink text-canvas hover:bg-ink/85",
        variant === "accent" && "bg-accent text-on-accent hover:bg-accent-strong",
        variant === "secondary" && "border border-line-strong bg-surface text-ink hover:border-ink/40 hover:bg-surface-2",
        variant === "ghost" && "text-ink-soft hover:bg-surface-2 hover:text-ink",
        variant === "danger" && "bg-danger text-canvas hover:bg-danger/85",
        className,
      )}
      type={type}
      {...props}
    />
  )
}
