import { adminRequest } from "../../../lib/api/client"
import { demoAuditLogs } from "../../demo/store"
import { toIsoString } from "../../shared/format"
import type { AuditLog, AuditLogsResponse } from "../types"

export async function fetchAuditLogs(): Promise<AuditLogsResponse> {
  const response = await adminRequest<AuditLogsResponse>(
    "auditLogs.list",
    { limit: 200 },
    () => demoAuditLogs(),
  )
  if (
    !response ||
    !Array.isArray(response.logs) ||
    typeof response.sample !== "object" ||
    response.sample === null
  ) {
    throw new Error("Audit logs returned a malformed response.")
  }
  return {
    ...response,
    logs: response.logs.map(normalizeAuditLog),
  }
}

function normalizeAuditLog(log: AuditLog): AuditLog {
  const actionTypes = new Set([
    "create",
    "update",
    "delete",
    "assign",
    "login",
    "config_change",
    "weather_operation",
    "redeem_operation",
    "credit_operation",
    "api_key_operation",
    "role_change",
    "other",
  ])
  const statuses = new Set(["success", "failed", "pending"])
  return {
    id: typeof log.id === "string" ? log.id : "",
    adminId: typeof log.adminId === "string" ? log.adminId : "",
    action: typeof log.action === "string" ? log.action : "",
    actionType: actionTypes.has(log.actionType) ? log.actionType : "other",
    targetType: typeof log.targetType === "string" ? log.targetType : "",
    targetId: typeof log.targetId === "string" ? log.targetId : "",
    status: statuses.has(log.status) ? log.status : "success",
    createdAt: toIsoString(log.createdAt),
  }
}
