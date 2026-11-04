import type { AdminRole } from "../../types/admin"
import type { UserSubscription } from "./types"

export const subscriptionLabels: Record<UserSubscription, string> = {
  free: "Ücretsiz",
  pro: "Pro",
  premium: "Premium",
}

const roleLabels: Record<AdminRole, string> = {
  user: "Kullanıcı",
  author: "Yazar",
  trusted_author: "Güvenilir yazar",
  editor: "Editör",
  admin: "Yönetici",
}

export function getRoleLabel(role: AdminRole | undefined) {
  return roleLabels[role ?? "user"] ?? String(role).replace("_", " ")
}

export function formatPlatform(value: string | undefined) {
  if (!value) return "—"
  const lower = value.toLowerCase()
  if (lower === "ios") return "iOS"
  if (lower === "android") return "Android"
  return value
}
