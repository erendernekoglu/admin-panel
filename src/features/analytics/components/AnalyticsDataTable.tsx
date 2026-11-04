import type { ReactNode } from "react"

import { cn } from "../../../lib/utils"

export interface AnalyticsColumn<T> {
  key: string
  label: string
  render: (row: T) => ReactNode
  align?: "left" | "right"
}

export function AnalyticsDataTable<T>({
  columns,
  emptyText = "Bu aralıkta veri yok. Tarih aralığını genişletmeyi ya da filtreleri kaldırmayı deneyin.",
  rows,
}: {
  columns: Array<AnalyticsColumn<T>>
  emptyText?: string
  rows: T[]
}) {
  if (rows.length === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-line-strong px-6 text-center text-sm text-muted">
        {emptyText}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead className="bg-surface-2 text-xs font-semibold text-muted">
          <tr>
            {columns.map((column) => (
              <th
                className={cn(
                  "px-4 py-2.5 font-semibold whitespace-nowrap",
                  column.align === "right" ? "text-right" : "text-left",
                )}
                key={column.key}
                scope="col"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              className="border-t border-line transition-colors hover:bg-surface-2/60"
              key={index}
            >
              {columns.map((column, columnIndex) => (
                <td
                  className={cn(
                    "px-4 py-3",
                    column.align === "right"
                      ? "text-right tabular-nums text-ink"
                      : "text-left text-ink-soft",
                    columnIndex === 0 && column.align !== "right" && "font-semibold text-ink",
                  )}
                  key={column.key}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
