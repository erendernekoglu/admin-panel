export interface SubscriptionRecord {
  purchaseToken: string
  userId: string
  displayName?: string
  email?: string
  productId: string
  basePlanId: string
  status: string
  isActive: boolean
  autoRenewing: boolean
  platform?: string
  provider?: string
  price?: number
  currency?: string
  startedAt?: string
  expiryTime: string | null
  lastNotificationType: number | null
  wasRevoked: boolean
  createdAt: string
  updatedAt?: string
}
