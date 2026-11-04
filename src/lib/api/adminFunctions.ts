import { adminRequest } from "./client"
import type { AdminFunctionResult } from "../../types/admin"

export interface AdminDeleteUserParams {
  uid: string
  consolePassword?: string
}

export interface AdminUpdateConfigParams {
  configId: string
  data: Record<string, unknown>
  consolePassword: string
}

export interface AdminTriggerWeatherUpdateParams {
  consolePassword: string
}

export interface AdminTriggerWeatherUpdateResult {
  success: number
  total: number
  failed: number
  totalDaysProcessed: number
  deletedOldForecasts: number
  results: Array<{
    locationId: string
    success: boolean
    daysProcessed: number
    error?: string
  }>
}

export interface AdminSyncLocationsParams {
  consolePassword: string
}

export interface AdminSyncLocationsResult extends AdminFunctionResult {
  synced: number
}

/**
 * Named operations routed through the shared admin adapter.
 * All of them use POST /api/admin/operations/<operation>.
 */
export const ADMIN_FUNCTION_OPERATIONS = {
  deleteUser: "users.delete",
  updateConfig: "config.update",
  triggerWeatherUpdate: "weather.triggerUpdate",
  syncLocations: "weather.syncLocations",
} as const

// Messages the admin API sends on purpose; shown instead of the generic text.
const SERVER_MESSAGES: Record<string, string> = {
  "Console password is incorrect.": "Konsol şifresi yanlış.",
  "Console password is not configured.":
    "Konsol şifresi sunucuda tanımlı değil. Bir yöneticiye haber verin.",
  "Your role does not allow this operation.": "Rolünüz bu işleme izin vermiyor.",
  "Admin sign-in is required.": "Yönetici girişi gerekli.",
  "The last admin cannot be demoted or removed.":
    "Son admin'in yetkisi düşürülemez veya kaldırılamaz.",
  "You cannot delete your own account from the console.":
    "Kendi hesabınızı panelden silemezsiniz.",
  "Remove this person's console role first.":
    "Önce bu kişinin panel rolünü kaldırın.",
  "No account exists with this id.": "Bu kimlikle bir hesap yok.",
  "Config is too large.": "Ayar çok büyük.",
  "Role change is invalid.": "Rol değişikliği geçersiz.",
}

function serverMessage(message: string): string | undefined {
  const text = message.replace(/^[a-z-]+\/[a-z-]+:\s*/i, "").trim()
  const invalidField = /^Invalid value for (.+)\.$/.exec(text)
  if (invalidField) return `Geçersiz değer: ${invalidField[1]}.`
  return SERVER_MESSAGES[text]
}

/** Normalize any adapter failure into an Error without provider dependencies. */
export function normalizeFunctionError(err: unknown): Error {
  if (err instanceof Error) {
    const known = serverMessage(err.message)
    return known ? new Error(known) : err
  }

  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
    const known = serverMessage(err.message)
    return new Error(known ?? err.message)
  }

  return new Error("An unexpected admin operation error occurred.")
}

export async function adminDeleteUser(
  input: string | AdminDeleteUserParams,
): Promise<void> {
  const params = typeof input === "string" ? { uid: input } : input

  try {
    await adminRequest<void>(
      ADMIN_FUNCTION_OPERATIONS.deleteUser,
      params,
      () => {
        throw new Error(
          "User deletion is unavailable in demo mode because there is no shared demo store; no change was made.",
        )
      },
    )
  } catch (err) {
    throw normalizeFunctionError(err)
  }
}

export async function adminUpdateConfig(
  params: AdminUpdateConfigParams,
): Promise<void> {
  try {
    await adminRequest<void>(
      ADMIN_FUNCTION_OPERATIONS.updateConfig,
      params,
      () => {
        throw new Error(
          "Config updates are unavailable in demo mode because there is no shared demo store; no change was made.",
        )
      },
    )
  } catch (err) {
    throw normalizeFunctionError(err)
  }
}

export async function adminTriggerWeatherUpdate(
  params: AdminTriggerWeatherUpdateParams,
): Promise<AdminTriggerWeatherUpdateResult> {
  try {
    return await adminRequest<AdminTriggerWeatherUpdateResult>(
      ADMIN_FUNCTION_OPERATIONS.triggerWeatherUpdate,
      params,
      () => {
        throw new Error(
          "Weather integration is unavailable in this independent demo panel.",
        )
      },
      { timeoutMs: 30 * 60_000 },
    )
  } catch (err) {
    throw normalizeFunctionError(err)
  }
}

export async function adminSyncLocations(
  params: AdminSyncLocationsParams,
): Promise<AdminSyncLocationsResult> {
  try {
    return await adminRequest<AdminSyncLocationsResult>(
      ADMIN_FUNCTION_OPERATIONS.syncLocations,
      params,
      () => {
        throw new Error(
          "Weather location sync is unavailable in this independent demo panel.",
        )
      },
    )
  } catch (err) {
    throw normalizeFunctionError(err)
  }
}
