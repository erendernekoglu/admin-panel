// Console roles and their permission bundles.
// This copy only shapes the interface; the same-origin API server is
// responsible for enforcing authorization on every operation.

export const CONSOLE_ROLES = ["viewer", "editor", "support", "admin"] as const
export type ConsoleRole = (typeof CONSOLE_ROLES)[number]

export const CONSOLE_ROLE_LABELS: Record<ConsoleRole, string> = {
  viewer: "Görüntüleyici",
  editor: "Editör",
  support: "Destek",
  admin: "Admin",
}

const EVERYONE = CONSOLE_ROLES

export const PERMISSIONS = {
  "reports.read": EVERYONE,
  "users.read": ["support", "admin"],
  "users.billing.read": ["support", "admin"],
  "users.billing.write": ["admin"],
  "users.delete": ["admin"],
  "content.write": ["editor", "admin"],
  "lookbook.publish": ["admin"],
  "events.pickWinner": ["admin"],
  "events.confirmPrize": ["admin"],
  "boutiques.review": ["editor", "admin"],
  "boutiques.contacts.read": ["editor", "admin"],
  "revenue.read": ["admin"],
  "system.manage": ["admin"],
  "audit.read": ["admin"],
  "team.manage": ["admin"],
} as const satisfies Record<string, readonly ConsoleRole[]>
export type Permission = keyof typeof PERMISSIONS

export function isConsoleRole(value: unknown): value is ConsoleRole {
  return typeof value === "string" && (CONSOLE_ROLES as readonly string[]).includes(value)
}

export function roleCan(role: ConsoleRole | null | undefined, permission: Permission) {
  return Boolean(role) && (PERMISSIONS[permission] as readonly ConsoleRole[]).includes(role as ConsoleRole)
}
