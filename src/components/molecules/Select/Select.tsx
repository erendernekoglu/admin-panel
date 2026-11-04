import type { SelectHTMLAttributes } from "react"

import { cn } from "../../../lib/utils"
import { fieldClassName } from "./fieldStyles"

/** Native select styled like the Input atom; pass width and spacing via className. */
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClassName, className)} {...props} />
}
