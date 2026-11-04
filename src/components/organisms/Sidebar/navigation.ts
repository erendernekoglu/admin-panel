import {
  BarChart3,
  CloudSun,
  Coins,
  Crown,
  Gauge,
  History,
  KeyRound,
  Newspaper,
  Settings,
  Settings2,
  Shirt,
  Sparkles,
  Store,
  ShieldCheck,
  Ticket,
  Trophy,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { roleCan, type ConsoleRole, type Permission } from "../../../lib/auth/permissions"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  match: (pathname: string) => boolean
  /** What the screen needs; screens without one are open to every role. */
  permission?: Permission
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

const exact = (path: string) => (p: string) => p === path
const nested = (path: string) => (p: string) => p === path || p.startsWith(`${path}/`)

// Grouped by what each screen manages, so the menu reads as a map of the business.
export const navGroups: NavGroup[] = [
  {
    label: "Genel",
    items: [
      { href: "/dashboard", label: "Genel bakış", icon: Gauge, match: (p) => p === "/" || p === "/dashboard", permission: "reports.read" },
      { href: "/analytics", label: "Analitik", icon: BarChart3, match: nested("/analytics"), permission: "reports.read" },
    ],
  },
  {
    label: "İçerik",
    items: [
      { href: "/lookbook", label: "Lookbook", icon: Sparkles, match: nested("/lookbook"), permission: "content.write" },
      { href: "/style-events", label: "Etkinlikler", icon: Trophy, match: exact("/style-events"), permission: "content.write" },
      { href: "/boutique", label: "Butikler", icon: Store, match: exact("/boutique"), permission: "boutiques.review" },
    ],
  },
  {
    label: "Uygulama",
    items: [
      { href: "/users", label: "Kullanıcılar", icon: Users, match: nested("/users"), permission: "users.read" },
      { href: "/wardrobe", label: "Dijital gardırop", icon: Shirt, match: exact("/wardrobe"), permission: "reports.read" },
      { href: "/media", label: "Medya ve blog", icon: Newspaper, match: exact("/media"), permission: "reports.read" },
      { href: "/weather", label: "Hava durumu", icon: CloudSun, match: exact("/weather"), permission: "system.manage" },
    ],
  },
  {
    label: "Gelir",
    items: [
      { href: "/subscriptions", label: "Abonelikler", icon: Crown, match: exact("/subscriptions"), permission: "revenue.read" },
      { href: "/credits", label: "Krediler", icon: Coins, match: exact("/credits"), permission: "revenue.read" },
      { href: "/redeem-codes", label: "Hediye kodları", icon: Ticket, match: exact("/redeem-codes"), permission: "users.billing.write" },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/api-keys", label: "API anahtarları", icon: KeyRound, match: nested("/api-keys"), permission: "system.manage" },
      { href: "/app-config", label: "Uygulama ayarları", icon: Settings2, match: exact("/app-config"), permission: "system.manage" },
      { href: "/team", label: "Ekip ve roller", icon: ShieldCheck, match: exact("/team"), permission: "team.manage" },
      { href: "/audit-logs", label: "İşlem kayıtları", icon: History, match: exact("/audit-logs"), permission: "audit.read" },
      { href: "/settings", label: "Ayarlar", icon: Settings, match: exact("/settings") },
    ],
  },
]

export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items)

/** The menu as the given role sees it: screens it cannot open are left out. */
export function navGroupsFor(role: ConsoleRole | null): NavGroup[] {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || roleCan(role, item.permission)),
    }))
    .filter((group) => group.items.length > 0)
}
