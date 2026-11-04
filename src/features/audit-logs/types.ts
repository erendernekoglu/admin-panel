export type AuditActionType =
  | "create"
  | "update"
  | "delete"
  | "assign"
  | "login"
  | "config_change"
  | "weather_operation"
  | "redeem_operation"
  | "credit_operation"
  | "api_key_operation"
  | "role_change"
  | "other"

export type AuditLogStatus = "success" | "failed" | "pending"

export interface AuditLog {
  id: string
  adminId: string
  /** Display name or e-mail of the admin, resolved by the console. */
  adminName?: string

  action: string
  actionType: AuditActionType
  targetType: string
  targetId: string
  status: AuditLogStatus

  createdAt: string | null
}

export interface AuditLogsResponse {
  logs: AuditLog[]
  sample: {
    limit: number
    truncated: boolean
  }
  note: string
}

export interface AuditLogFilters {
  search: string
  actionType: AuditActionType | "all"
  status: AuditLogStatus | "all"
  targetType: string
}
