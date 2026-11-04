export type CreditTransactionType =
  | "spend"
  | "purchase"
  | "renewal"
  | "manual_add"
  | "manual_remove"
  | "signup_bonus"
  | "revoke"
  | (string & {})

export interface CreditTransaction {
  id: string
  userId: string
  displayName?: string
  type: CreditTransactionType
  operation?: string
  amount: number
  cost?: number
  balanceBefore?: number
  balanceAfter?: number
  reason?: string
  details?: Record<string, unknown>
  createdAt: string
}
