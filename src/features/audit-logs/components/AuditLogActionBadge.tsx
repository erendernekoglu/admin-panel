import { Badge, type BadgeTone } from "../../../components/atoms/Badge/Badge"
import { AUDIT_ACTION_LABELS } from "../labels"
import type { AuditActionType } from "../types"

const actionTones: Record<AuditActionType, BadgeTone> = {
  create: "success",
  update: "accent",
  delete: "danger",
  assign: "accent",
  login: "neutral",
  config_change: "warning",
  weather_operation: "neutral",
  redeem_operation: "accent",
  credit_operation: "warning",
  api_key_operation: "ink",
  role_change: "warning",
  other: "neutral",
}

export function AuditLogActionBadge({
  actionType,
}: {
  actionType: AuditActionType
}) {
  return <Badge tone={actionTones[actionType]}>{AUDIT_ACTION_LABELS[actionType]}</Badge>
}
