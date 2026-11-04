import { Badge, type BadgeTone } from "../../../components/atoms/Badge/Badge"
import { API_KEY_ENV_LABELS, API_KEY_STATUS_LABELS } from "../labels"
import type { ApiKeyEnv, ApiKeyStatus } from "../types"

const statusTones: Record<ApiKeyStatus, BadgeTone> = {
  active: "success",
  disabled: "warning",
  revoked: "danger",
}

export function ApiKeyStatusBadge({ status }: { status: ApiKeyStatus }) {
  return <Badge tone={statusTones[status]}>{API_KEY_STATUS_LABELS[status]}</Badge>
}

export function ApiKeyEnvBadge({ env }: { env: ApiKeyEnv }) {
  return <Badge tone={env === "live" ? "ink" : "neutral"}>{API_KEY_ENV_LABELS[env]}</Badge>
}
