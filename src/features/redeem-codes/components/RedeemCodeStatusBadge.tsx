import { Badge, type BadgeTone } from "../../../components/atoms/Badge/Badge"
import { redeemCodeStatusLabels } from "../labels"
import type { RedeemCodeStatus } from "../types"

const statusTones: Record<RedeemCodeStatus, BadgeTone> = {
  active: "success",
  used: "neutral",
  expired: "warning",
  disabled: "danger",
}

export function RedeemCodeStatusBadge({
  status,
}: {
  status: RedeemCodeStatus
}) {
  return (
    <Badge tone={statusTones[status] ?? "neutral"}>
      {redeemCodeStatusLabels[status] ?? status}
    </Badge>
  )
}
