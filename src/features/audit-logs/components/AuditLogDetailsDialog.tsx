import {
  Dialog,
  DialogBody,
  DialogHeader,
} from "../../../components/molecules/Dialog"
import { toDateTimeString } from "../../shared/format"
import type { AuditLog } from "../types"
import { AuditLogActionBadge } from "./AuditLogActionBadge"
import { AuditLogStatusBadge } from "./AuditLogStatusBadge"

interface AuditLogDetailsDialogProps {
  log: AuditLog | null
  onClose: () => void
}

function Field({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm text-ink">{value}</dd>
    </div>
  )
}

export function AuditLogDetailsDialog({
  log,
  onClose,
}: AuditLogDetailsDialogProps) {
  if (!log) return null

  return (
    <Dialog labelledBy="audit-log-details-title" onClose={onClose}>
      <DialogHeader
        description={<span className="break-all text-xs text-muted">Kayıt kimliği: {log.id}</span>}
        id="audit-log-details-title"
        onClose={onClose}
      >
        Denetim kaydı ayrıntıları
      </DialogHeader>

      <DialogBody>
        <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field
            label="Yönetici"
            value={
              <span>
                {log.adminName ?? log.adminId}
                {log.adminName && (
                  <span className="mt-0.5 block break-all font-mono text-xs text-muted">
                    {log.adminId}
                  </span>
                )}
              </span>
            }
          />
          <Field label="İşlem" value={log.action} />
          <Field
            label="İşlem türü"
            value={<AuditLogActionBadge actionType={log.actionType} />}
          />
          <Field
            label="Durum"
            value={<AuditLogStatusBadge status={log.status} />}
          />
          <Field
            label="Hedef"
            value={
              <span>
                {log.targetType}
                <span className="mt-0.5 block break-all text-xs text-muted">
                  {log.targetId}
                </span>
              </span>
            }
          />
          <Field
            label="Tarih"
            value={<span className="tabular-nums">{toDateTimeString(log.createdAt)}</span>}
          />
        </dl>

        <p className="rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm text-ink-soft">
          Bu kayıt salt okunurdur. Denetim kayıtları yalnızca güvenilir sunucu
          fonksiyonları tarafından yazılır ve korunur.
        </p>
      </DialogBody>
    </Dialog>
  )
}
