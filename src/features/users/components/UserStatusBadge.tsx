import { Badge, type BadgeTone } from "../../../components/atoms/Badge/Badge"
import type { AdminRole } from "../../../types/admin"
import { getRoleLabel } from "../labels"

type UserStatusTone = "neutral" | "success" | "warning" | "danger" | "admin"

const toneMap: Record<UserStatusTone, BadgeTone> = {
  neutral: "neutral",
  success: "success",
  warning: "warning",
  danger: "danger",
  admin: "accent",
}

export function UserStatusBadge({
  children,
  tone = "neutral",
}: {
  children: string
  tone?: UserStatusTone
}) {
  return <Badge tone={toneMap[tone]}>{children}</Badge>
}

export function RoleBadge({ role }: { role?: AdminRole }) {
  if (!role || role === "user") return null

  return (
    <UserStatusBadge tone={role === "admin" ? "admin" : "neutral"}>
      {getRoleLabel(role)}
    </UserStatusBadge>
  )
}
