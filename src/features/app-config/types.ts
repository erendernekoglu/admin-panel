export interface CreditCostsConfig {
  ANALYZE_CLOTHING: number
  ANALYZE_OUTFIT: number
  CREATE_COMBINATION: number
  WEATHER_OUTFIT_SUGGESTION: number
  REMOVE_BACKGROUND: number
  VIRTUAL_TRY_ON: number
  CREATE_AVATAR: number
  CABIN_AI_ADVICE?: number
  CABIN_BULK_REVIEW?: number
}

export interface PlanCreditEntry {
  name: string
  initialCredits: number
  monthlyCredits: number
}

export interface PlanCreditsConfig {
  free: PlanCreditEntry
  pro: PlanCreditEntry
  premium: PlanCreditEntry
}

export interface PlanLimitEntry {
  maxWardrobeItems: number
  maxSavedCombinations: number
}

export interface PlanLimitsConfig {
  free: PlanLimitEntry
  pro: PlanLimitEntry
  premium: PlanLimitEntry
}

export interface ApiServiceStatus {
  enabled: boolean
  disabledAt: string | null
  disabledReason: "manual" | "quota_exceeded" | "billing" | null
  message: string | null
}

export interface ApiLimitsConfig {
  gemini: ApiServiceStatus
  openai: ApiServiceStatus
  weather: ApiServiceStatus
  payment: ApiServiceStatus
}

export interface PromptsConfig {
  analyzeClothing?: string
  analyzeOutfitStyle?: string
  virtualTryOn?: string
  removeBackground?: string
  createAvatar?: string
  [key: string]: string | undefined
}

export interface WeatherTimeSlot {
  start: number
  end: number
}

export interface WeatherTimeSlotsConfig {
  morning: WeatherTimeSlot
  noon: WeatherTimeSlot
  evening: WeatherTimeSlot
  night: WeatherTimeSlot
}

export interface DwKvkkVersionConfig {
  currentVersion: string
}

export interface AppVersionConfig {
  latestVersion: string
}

export interface AppConfigMap {
  creditCosts: CreditCostsConfig
  planCredits: PlanCreditsConfig
  planLimits: PlanLimitsConfig
  apiLimits: ApiLimitsConfig
  prompts: PromptsConfig
  weatherTimeSlots: WeatherTimeSlotsConfig
  dwKvkkVersion: DwKvkkVersionConfig
  appVersion: AppVersionConfig
}

export type AppConfigKey = keyof AppConfigMap
