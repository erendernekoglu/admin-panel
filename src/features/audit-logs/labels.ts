import type { AuditActionType, AuditLogStatus } from "./types"

export const AUDIT_ACTION_LABELS: Record<AuditActionType, string> = {
  create: "Oluşturma",
  update: "Güncelleme",
  delete: "Silme",
  assign: "Atama",
  login: "Giriş",
  config_change: "Ayar değişikliği",
  weather_operation: "Hava durumu işlemi",
  redeem_operation: "Kod kullanımı",
  credit_operation: "Kredi işlemi",
  api_key_operation: "API anahtarı işlemi",
  role_change: "Rol değişikliği",
  other: "Diğer",
}

export const AUDIT_STATUS_LABELS: Record<AuditLogStatus, string> = {
  success: "Başarılı",
  failed: "Başarısız",
  pending: "Bekliyor",
}
