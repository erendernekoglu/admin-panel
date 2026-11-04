import { useState } from "react"
import { Ban, Check, Copy, SearchX } from "lucide-react"

import { IconButton } from "../../../components/atoms/IconButton"
import { Card } from "../../../components/molecules/Card"
import { toDateString, toDateTimeString } from "../../shared/format"
import { cn } from "../../../lib/utils"
import type { RedeemCode } from "../types"
import { redeemCodeTypeLabels } from "../labels"
import { RedeemCodeStatusBadge } from "./RedeemCodeStatusBadge"

interface RedeemCodesTableProps {
  codes: RedeemCode[]
  onAssign: (code: RedeemCode) => void
  onDisable: (code: RedeemCode) => void
}

function formatType(type: string) {
  const known = redeemCodeTypeLabels[type as keyof typeof redeemCodeTypeLabels]
  if (known) return known
  return type
    .split("_")
    .map((part, index) =>
      index === 0 ? part.charAt(0).toLocaleUpperCase("tr") + part.slice(1) : part,
    )
    .join(" ")
}

function assignedUser(code: RedeemCode) {
  return code.assignedUserEmail || code.assignedUserId || "—"
}

const columns: Array<{ label: string; numeric?: boolean }> = [
  { label: "Kod" },
  { label: "Tür" },
  { label: "Değer", numeric: true },
  { label: "Atanan kullanıcı" },
  { label: "Durum" },
  { label: "Kullanım", numeric: true },
  { label: "Son geçerlilik" },
  { label: "Oluşturulma" },
  { label: "İşlemler", numeric: true },
]

export function RedeemCodesTable({
  codes,
  onAssign,
  onDisable,
}: RedeemCodesTableProps) {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)

  async function handleCopy(code: RedeemCode) {
    await navigator.clipboard.writeText(code.code)
    setCopiedCodeId(code.id)
    window.setTimeout(() => setCopiedCodeId(null), 1800)
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse text-left">
          <thead className="bg-surface-2">
            <tr>
              {columns.map((column) => (
                <th
                  className={cn(
                    "px-4 py-3 text-xs font-semibold whitespace-nowrap text-muted",
                    column.numeric && "text-right",
                  )}
                  key={column.label}
                  scope="col"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {codes.map((code) => {
              const isCopied = copiedCodeId === code.id
              return (
                <tr
                  className="border-t border-line transition-colors hover:bg-surface-2/60"
                  key={code.id}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-sm font-semibold text-ink">
                        {code.code}
                      </span>
                      <IconButton
                        className={cn("size-7", isCopied && "text-success hover:text-success")}
                        label={isCopied ? "Kopyalandı" : `Kodu kopyala: ${code.code}`}
                        onClick={() => void handleCopy(code)}
                      >
                        {isCopied ? (
                          <Check aria-hidden="true" className="size-3.5 animate-pop-in" />
                        ) : (
                          <Copy aria-hidden="true" className="size-3.5" />
                        )}
                      </IconButton>
                    </div>
                    <div className="mt-0.5 max-w-[180px] truncate font-mono text-xs text-muted">
                      {code.id}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm font-medium text-ink">
                    {formatType(code.type)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm tabular-nums text-ink">
                    {code.value}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="max-w-[240px] truncate text-sm text-ink-soft">
                      {assignedUser(code)}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <RedeemCodeStatusBadge status={code.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm tabular-nums text-ink-soft">
                    {code.usageLabel}
                  </td>
                  <td className="px-4 py-3.5 text-sm whitespace-nowrap tabular-nums text-ink-soft">
                    {toDateString(code.expiresAt)}
                  </td>
                  <td className="px-4 py-3.5 text-sm whitespace-nowrap tabular-nums text-ink-soft">
                    {toDateTimeString(code.createdAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="mr-1 inline-flex h-8 items-center rounded-full border border-line-input bg-surface px-3.5 text-xs font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-surface-2"
                        onClick={() => onAssign(code)}
                        type="button"
                      >
                        Ata
                      </button>
                      <IconButton
                        className="hover:bg-danger-soft hover:text-danger"
                        label={`Devre dışı bırak: ${code.code}`}
                        onClick={() => onDisable(code)}
                      >
                        <Ban aria-hidden="true" size={16} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {codes.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 border-t border-line px-6 py-14 text-center">
          <SearchX aria-hidden="true" className="size-7 text-muted" />
          <p className="text-sm font-semibold text-ink">
            Bu filtrelere uyan hediye kodu yok.
          </p>
          <p className="max-w-sm text-sm text-muted">
            Aramayı temizleyin ya da durum ve tür filtrelerini “Tüm durumlar” ve
            “Tüm türler” olarak değiştirin.
          </p>
        </div>
      )}
    </Card>
  )
}
