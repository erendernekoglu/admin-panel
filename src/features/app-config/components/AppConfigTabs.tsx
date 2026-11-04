import { cn } from "../../../lib/utils"
import type { AppConfigDefinition } from "./configHelpers"

interface AppConfigTabsProps {
  activeKey: AppConfigDefinition["key"]
  definitions: AppConfigDefinition[]
  missingKeys: Set<AppConfigDefinition["key"]>
  onChange: (key: AppConfigDefinition["key"]) => void
}

/**
 * Config group picker: a horizontal strip on small screens, a vertical list
 * beside the editor from `lg` up.
 */
export function AppConfigTabs({
  activeKey,
  definitions,
  missingKeys,
  onChange,
}: AppConfigTabsProps) {
  return (
    <nav aria-label="Ayar grupları" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-1.5 lg:flex-col">
        {definitions.map((definition) => {
          const isActive = definition.key === activeKey
          const isMissing = missingKeys.has(definition.key)

          return (
            <li className="shrink-0" key={definition.key}>
              <button
                aria-pressed={isActive}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left text-sm whitespace-nowrap transition-colors duration-150",
                  isActive
                    ? "bg-surface-3 font-semibold text-ink"
                    : "font-medium text-ink-soft hover:bg-surface-2 hover:text-ink",
                )}
                onClick={() => onChange(definition.key)}
                type="button"
              >
                <span>{definition.label}</span>
                {isMissing ? (
                  <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-semibold text-danger">
                    Eksik
                  </span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
