import { Badge, type BadgeTone } from "../../../components/atoms/Badge/Badge"
import { AUDIT_STATUS_LABELS } from "../labels"
import type { AuditLogStatus } from "../types"

const statusTones: Record<AuditLogStatus, BadgeTone> = {
  success: "success",
  failed: "danger",
  pending: "warning",
}

export function AuditLogStatusBadge({ status }: { status: AuditLogStatus }) {
  return <Badge tone={statusTones[status]}>{AUDIT_STATUS_LABELS[status]}</Badge>
}
