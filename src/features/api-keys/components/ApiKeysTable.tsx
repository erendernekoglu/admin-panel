import { Link } from "react-router"
import { Ban, KeyRound, RefreshCw } from "lucide-react"

import { IconButton } from "../../../components/atoms/IconButton"
import { toDateTimeString } from "../../shared/format"
import { SERVICE_LABELS, type ApiKey, type ServiceId } from "../types"
import { ApiKeyEnvBadge, ApiKeyStatusBadge } from "./ApiKeyStatusBadge"

interface ApiKeysTableProps {
  keys: ApiKey[]
  onRevoke: (key: ApiKey) => void
  onRotate: (key: ApiKey) => void
}

const headers = [
  "Anahtar",
  "Sahip",
  "Ortam",
  "Servisler",
  "Durum",
  "Son kullanım",
]

const SERVICE_IDS: ServiceId[] = ["outfitEngine", "imageProcessing", "taxonomy"]

/** Which services this key may actually reach: scope granted AND not switched off. */
function enabledServices(key: ApiKey) {
  return SERVICE_IDS.filter((id) => key.services?.[id]?.enabled)
}

const iconActionClass =
  "inline-flex size-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"

export function ApiKeysTable({ keys, onRevoke, onRotate }: ApiKeysTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-surface-2">
              {headers.map((header) => (
                <th className="px-4 py-3 text-xs font-semibold text-muted" key={header} scope="col">
                  {header}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted" scope="col">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => {
              const services = enabledServices(key)
              const terminal = key.status === "revoked"

              return (
                <tr
                  className="border-b border-line transition-colors last:border-b-0 hover:bg-surface-2/60"
                  key={key.keyId}
                >
                  <td className="px-4 py-3">
                    <Link
                      className="font-semibold text-ink underline-offset-2 hover:text-accent hover:underline"
                      to={`/api-keys/${key.keyId}`}
                    >
                      {key.name}
                    </Link>
                    <p className="mt-0.5 font-mono text-xs text-muted">
                      {key.displayPrefix}_…{key.lastFour}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-soft">
                    {key.ownerEmail}
                  </td>
                  <td className="px-4 py-3">
                    <ApiKeyEnvBadge env={key.env} />
                  </td>
                  <td className="px-4 py-3">
                    {services.length === 0 ? (
                      <span className="text-sm text-muted">Yok</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {services.map((id) => (
                          <span
                            className="rounded-full border border-line bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-soft"
                            key={id}
                          >
                            {SERVICE_LABELS[id]}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ApiKeyStatusBadge status={key.status} />
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-ink-soft">
                    {toDateTimeString(key.lastUsedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <Link
                        aria-label={`${key.name} anahtarını aç`}
                        className={iconActionClass}
                        title="Aç"
                        to={`/api-keys/${key.keyId}`}
                      >
                        <KeyRound aria-hidden className="size-4" />
                      </Link>
                      <IconButton
                        className="disabled:pointer-events-none disabled:opacity-40"
                        disabled={terminal}
                        label="Anahtarı yenile"
                        onClick={() => onRotate(key)}
                      >
                        <RefreshCw aria-hidden className="size-4" />
                      </IconButton>
                      <IconButton
                        className="text-danger hover:bg-danger-soft hover:text-danger disabled:pointer-events-none disabled:opacity-40"
                        disabled={terminal}
                        label="Anahtarı iptal et"
                        onClick={() => onRevoke(key)}
                      >
                        <Ban aria-hidden className="size-4" />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              )
            })}

            {keys.length === 0 && (
              <tr>
                <td
                  className="px-4 py-12 text-center text-sm text-muted"
                  colSpan={headers.length + 1}
                >
                  Filtrelere uyan anahtar yok. Aramayı temizleyin ya da filtreleri genişletin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
