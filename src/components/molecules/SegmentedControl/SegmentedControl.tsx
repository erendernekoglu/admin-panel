import { cn } from "../../../lib/utils"

export interface SegmentedOption<T extends string | number> {
  label: string
  value: T
}

interface SegmentedControlProps<T extends string | number> {
  /** Accessible name of the group, e.g. "Tarih aralığı". */
  label: string
  options: ReadonlyArray<SegmentedOption<T>>
  value: T
  onChange: (value: T) => void
  className?: string
}

/** A row of mutually exclusive pill buttons for switching a filter or range. */
export function SegmentedControl<T extends string | number>({
  className,
  label,
  onChange,
  options,
  value,
}: SegmentedControlProps<T>) {
  return (
    <div
      aria-label={label}
      className={cn(
        "inline-flex max-w-full overflow-x-auto rounded-full border border-line-strong bg-surface p-1",
        className,
      )}
      role="group"
    >
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            aria-pressed={active}
            className={cn(
              "h-8 shrink-0 rounded-full px-3.5 text-sm font-semibold whitespace-nowrap transition-[background-color,color] duration-150 ease-[var(--ease-panel)]",
              active ? "bg-ink text-canvas" : "text-ink-soft hover:bg-surface-2 hover:text-ink",
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
