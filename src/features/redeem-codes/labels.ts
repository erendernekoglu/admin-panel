import type { RedeemCodeStatus, RedeemCodeType } from "./types"

export const redeemCodeStatusLabels: Record<RedeemCodeStatus, string> = {
  active: "Aktif",
  used: "Kullanıldı",
  expired: "Süresi doldu",
  disabled: "Devre dışı",
}

export const redeemCodeTypeLabels: Record<RedeemCodeType, string> = {
  credit: "Kredi",
  subscription: "Abonelik",
  discount: "İndirim",
  wardrobe: "Gardırop",
  custom: "Özel",
}
