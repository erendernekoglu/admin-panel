import type { AppConfigKey } from "../types"

export type ConfigPrimitive = string | number | boolean | null
export type ConfigJsonValue =
  | ConfigPrimitive
  | ConfigJsonValue[]
  | { [key: string]: ConfigJsonValue }

export type ConfigRecord = Record<string, ConfigJsonValue>

export interface AppConfigDefinition {
  key: AppConfigKey
  label: string
  description: string
}

export const APP_CONFIG_DEFINITIONS: AppConfigDefinition[] = [
  {
    key: "creditCosts",
    label: "Kredi maliyetleri",
    description: "Her yapay zekâ işleminin kaç kredi tuttuğu.",
  },
  {
    key: "planCredits",
    label: "Plan kredileri",
    description: "Abonelik planına göre başlangıç ve yenilenen krediler.",
  },
  {
    key: "planLimits",
    label: "Plan limitleri",
    description: "Plana göre gardırop ve kayıtlı kombin limitleri.",
  },
  {
    key: "apiLimits",
    label: "API servisleri",
    description: "Dış servislerin açık olup olmadığı ve kapalıyken gösterilen mesajlar.",
  },
  {
    key: "prompts",
    label: "İstemler",
    description: "Yönetim servisinin kullandığı, uzaktan değiştirilebilen yapay zekâ istemleri.",
  },
  {
    key: "weatherTimeSlots",
    label: "Hava durumu saatleri",
    description: "Hava durumuna göre kombin önerilerinde kullanılan zaman aralıkları.",
  },
  {
    key: "dwKvkkVersion",
    label: "KVKK sürümü",
    description: "Dijital gardırop gizlilik onayının sürümü.",
  },
  {
    key: "appVersion",
    label: "Uygulama sürümü",
    description: "Mobil kullanıcılara gösterilen en güncel uygulama sürümü.",
  },
]

const METADATA_KEYS = new Set(["updatedAt", "updatedBy", "lastUpdated", "lastUpdatedBy"])

export function isConfigRecord(value: unknown): value is ConfigRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function toConfigRecord(value: unknown): ConfigRecord {
  if (!isConfigRecord(value)) return {}

  return Object.entries(value).reduce<ConfigRecord>((result, [key, entry]) => {
    if (!METADATA_KEYS.has(key)) {
      result[key] = toJsonValue(entry)
    }

    return result
  }, {})
}

export function toJsonValue(value: unknown): ConfigJsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value
  }

  if (Array.isArray(value)) return value.map((entry) => toJsonValue(entry))

  if (value && typeof value === "object") {
    return Object.entries(value).reduce<Record<string, ConfigJsonValue>>(
      (result, [key, entry]) => {
        result[key] = toJsonValue(entry)
        return result
      },
      {},
    )
  }

  return String(value)
}

export function stringifyConfig(value: ConfigJsonValue | ConfigRecord): string {
  return JSON.stringify(sortJsonValue(value), null, 2)
}

export function stableConfigString(value: ConfigJsonValue | ConfigRecord): string {
  return JSON.stringify(sortJsonValue(value))
}

export function parseConfigJson(value: string): ConfigJsonValue | null {
  return JSON.parse(value) as ConfigJsonValue
}

export function getConfigValueType(value: ConfigJsonValue): string {
  if (value === null) return "null"
  if (Array.isArray(value)) return "array"
  return typeof value
}

/** Plain-language names for the value types returned by getConfigValueType. */
const CONFIG_VALUE_TYPE_LABELS: Record<string, string> = {
  string: "Metin",
  number: "Sayı",
  boolean: "Açık / kapalı",
  array: "Liste (JSON)",
  object: "Nesne (JSON)",
  null: "Boş",
}

export function getConfigValueTypeLabel(value: ConfigJsonValue): string {
  const type = getConfigValueType(value)
  return CONFIG_VALUE_TYPE_LABELS[type] ?? type
}

export function formatMetadataValue(value: unknown): string {
  if (!value) return "Bilinmiyor"

  if (typeof value === "string") return value

  if (value instanceof Date) return value.toLocaleString("tr-TR")

  if (typeof value === "object") {
    const timestamp = value as { seconds?: number; toDate?: () => Date }

    if (typeof timestamp.toDate === "function") {
      return timestamp.toDate().toLocaleString("tr-TR")
    }

    if (typeof timestamp.seconds === "number") {
      return new Date(timestamp.seconds * 1000).toLocaleString("tr-TR")
    }
  }

  return String(value)
}

export function getMetadata(data: unknown) {
  if (!data || typeof data !== "object") {
    return {
      updatedAt: "Bilinmiyor",
      updatedBy: "Bilinmiyor",
    }
  }

  const record = data as Record<string, unknown>

  return {
    updatedAt: formatMetadataValue(record.updatedAt ?? record.lastUpdated),
    updatedBy: formatMetadataValue(record.updatedBy ?? record.lastUpdatedBy),
  }
}

function sortJsonValue(value: ConfigJsonValue | ConfigRecord): ConfigJsonValue {
  if (Array.isArray(value)) return value.map((entry) => sortJsonValue(entry))

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, ConfigJsonValue>>((result, key) => {
        result[key] = sortJsonValue(value[key])
        return result
      }, {})
  }

  return value
}
