import { useEffect, useState, type ChangeEvent } from "react"

import { cn } from "../../../lib/utils"
import type { ConfigJsonValue } from "./configHelpers"
import { parseConfigJson, stringifyConfig } from "./configHelpers"

interface ConfigValueFieldProps {
  id?: string
  jsonError?: string
  label: string
  onChange: (value: ConfigJsonValue) => void
  onJsonError: (message?: string) => void
  value: ConfigJsonValue
}

// Copies the Input atom so selects and textareas match it (DESIGN.md).
const baseFieldClass =
  "w-full rounded-xl border border-line-input bg-surface px-3.5 text-sm text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted hover:border-ink/30 focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-60"
const singleLineClass = cn(baseFieldClass, "h-10")
const multiLineClass = cn(baseFieldClass, "py-3 font-mono text-xs leading-relaxed")

export function ConfigValueField({
  id,
  jsonError,
  label,
  onChange,
  onJsonError,
  value,
}: ConfigValueFieldProps) {
  const [jsonDraft, setJsonDraft] = useState("")

  useEffect(() => {
    if (typeof value === "object") {
      setJsonDraft(stringifyConfig(value))
    }
  }, [value])

  if (typeof value === "boolean") {
    return (
      <select
        className={cn(singleLineClass, "sm:max-w-xs")}
        id={id}
        onChange={(event) => onChange(event.target.value === "true")}
        value={String(value)}
      >
        <option value="true">Açık</option>
        <option value="false">Kapalı</option>
      </select>
    )
  }

  if (typeof value === "number") {
    return (
      <input
        className={cn(singleLineClass, "tabular-nums sm:max-w-xs")}
        id={id}
        onChange={(event) => {
          const nextValue = event.target.value
          onChange(nextValue === "" ? 0 : Number(nextValue))
        }}
        type="number"
        value={Number.isFinite(value) ? value : 0}
      />
    )
  }

  if (typeof value === "string" || value === null) {
    const stringValue = value ?? ""
    const isLong = stringValue.length > 100 || stringValue.includes("\n")

    if (isLong) {
      return (
        <textarea
          className={cn(multiLineClass, "min-h-40 font-sans text-sm")}
          id={id}
          onChange={(event) => onChange(event.target.value)}
          value={stringValue}
        />
      )
    }

    return (
      <input
        className={singleLineClass}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        type="text"
        value={stringValue}
      />
    )
  }

  return (
    <div>
      <textarea
        aria-describedby={jsonError && id ? `${id}-error` : undefined}
        aria-invalid={jsonError ? true : undefined}
        aria-label={`${label} JSON değeri`}
        className={cn(
          multiLineClass,
          "min-h-52",
          jsonError && "border-danger focus:border-danger focus:ring-danger/15",
        )}
        id={id}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
          setJsonDraft(event.target.value)

          try {
            const parsed = parseConfigJson(event.target.value)
            onJsonError(undefined)
            onChange(parsed)
          } catch {
            onJsonError("Bu alan geçerli bir JSON değil. Kaydetmeden önce düzeltin.")
          }
        }}
        spellCheck={false}
        value={jsonDraft}
      />
      {jsonError ? (
        <p
          className="mt-2 animate-pop-in text-xs font-medium text-danger"
          id={id ? `${id}-error` : undefined}
        >
          {jsonError}
        </p>
      ) : null}
    </div>
  )
}
