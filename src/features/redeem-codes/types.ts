export type RedeemCodeStatus = "active" | "used" | "expired" | "disabled"

export type RedeemCodeType =
  | "credit"
  | "subscription"
  | "discount"
  | "wardrobe"
  | "custom"

export interface RedeemCode {
  id: string
  code: string
  type: RedeemCodeType
  value: string
  assignedUserId?: string
  assignedUserEmail?: string
  maxUsage: number
  usedCount: number
  usageLabel: string
  status: RedeemCodeStatus
  rawStatus?: string
  expiresAt: unknown
  createdByAdminId: string
  createdAt: unknown
  updatedAt: unknown
  usedAt?: unknown
  redemptionCount?: number
  sourceCollection?: "promoCodes"
}

export interface RedeemCodeFilters {
  search: string
  status: RedeemCodeStatus | "all"
  type: RedeemCodeType | "all"
}

export interface CreateRedeemCodeInput {
  code: string
  type: RedeemCodeType
  value: number
  maxUsage: number
  expiresAt: Date | string
}

export interface AssignRedeemCodeInput {
  codeId: string
  code: string
  userId?: string
  userEmail?: string
}
