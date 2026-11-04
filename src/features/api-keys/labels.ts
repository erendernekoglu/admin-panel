import type { ApiKeyEnv, ApiKeyStatus } from "./types"

export const API_KEY_STATUS_LABELS: Record<ApiKeyStatus, string> = {
  active: "Etkin",
  disabled: "Devre dışı",
  revoked: "İptal edildi",
}

export const API_KEY_ENV_LABELS: Record<ApiKeyEnv, string> = {
  live: "Canlı",
  test: "Test",
}
