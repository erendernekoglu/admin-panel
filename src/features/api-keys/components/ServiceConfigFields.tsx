/**
 * Field primitives for the per-service configuration editor.
 *
 * Numeric fields carry their ceiling in the UI and clamp on blur. The backend
 * clamps again on write, and each service clamps once more on read — this copy
 * is here so a typo is visible where it is made, not three hops later.
 */
import { cn } from "../../../lib/utils"
import { fieldClass, hintClass, labelClass } from "./fieldClasses"

interface NumberFieldProps {
  cap?: number
  hint?: string
  label: string
  min?: number
  onChange: (value: number) => void
  value: number
}

const inputClass = cn(fieldClass, "mt-2 w-full")

export function NumberField({
  cap,
  hint,
  label,
  min = 1,
  onChange,
  value,
}: NumberFieldProps) {
  const overCap = cap !== undefined && value > cap

  return (
    <label className={labelClass}>
      <span className="flex items-baseline justify-between gap-2">
        {label}
        {cap !== undefined && (
          <span className="text-xs font-normal tabular-nums text-muted">
            en fazla {cap.toLocaleString("tr-TR")}
          </span>
        )}
      </span>
      <input
        aria-invalid={overCap || undefined}
        className={cn(
          inputClass,
          "tabular-nums",
          overCap && "border-danger focus:border-danger focus:ring-danger/15",
        )}
        max={cap}
        min={min}
        onBlur={() => {
          if (cap !== undefined && value > cap) onChange(cap)
          if (value < min) onChange(min)
        }}
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        value={value}
      />
      {overCap ? (
        <span className={cn(hintClass, "animate-pop-in text-danger")}>
          Tavanın üstünde; {cap?.toLocaleString("tr-TR")} değerine indirilecek.
        </span>
      ) : hint ? (
        <span className={hintClass}>{hint}</span>
      ) : null}
    </label>
  )
}

export function SelectField<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: T) => void
  options: Array<{ label: string; value: T }>
  value: T
}) {
  return (
    <label className={labelClass}>
      {label}
      <select
        className={inputClass}
        onChange={(event) => onChange(event.target.value as T)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function TextField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string
  onChange: (value: string) => void
  placeholder?: string
  value: string
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        className={inputClass}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </label>
  )
}

/**
 * A switch drawn over a native checkbox, so keyboard, form and screen-reader
 * behaviour stay those of the checkbox.
 */
export function ToggleField({
  hint,
  label,
  onChange,
  value,
}: {
  hint?: string
  label: string
  onChange: (value: boolean) => void
  value: boolean
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm font-semibold text-ink">
      <span className="relative mt-0.5 inline-flex h-6 w-10 shrink-0">
        <input
          checked={value}
          className="peer absolute inset-0 m-0 size-full cursor-pointer appearance-none rounded-full border border-line-strong bg-surface-3 transition-colors duration-200 ease-[var(--ease-panel)] checked:border-accent checked:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          onChange={(event) => onChange(event.target.checked)}
          role="switch"
          type="checkbox"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-1 left-1 size-4 rounded-full bg-surface shadow-card transition-transform duration-200 ease-[var(--ease-panel)] peer-checked:translate-x-4"
        />
      </span>
      <span className="min-w-0">
        {label}
        {hint && <span className="mt-0.5 block text-xs font-normal text-muted">{hint}</span>}
      </span>
    </label>
  )
}

export function CheckboxGroup<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: T[]) => void
  options: Array<{ label: string; value: T }>
  value: T[]
}) {
  function toggle(option: T, checked: boolean) {
    onChange(
      checked ? [...value, option] : value.filter((item) => item !== option),
    )
  }

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-ink">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value.includes(option.value)

          return (
            <label
              className={cn(
                "inline-flex min-h-8 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm transition-colors duration-150",
                checked
                  ? "border-accent/40 bg-accent-soft text-accent-ink"
                  : "border-line-strong bg-surface text-ink-soft hover:bg-surface-2",
              )}
              key={option.value}
            >
              <input
                checked={checked}
                className="size-3.5"
                onChange={(event) => toggle(option.value, event.target.checked)}
                type="checkbox"
              />
              {option.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
