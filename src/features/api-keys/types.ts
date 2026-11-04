export type ApiKeyStatus = "active" | "disabled" | "revoked"

export type ApiKeyEnv = "live" | "test"

export type ApiScope =
  | "outfit:read"
  | "outfit:compute"
  | "outfit:calibrate"
  | "image:process"
  | "taxonomy:classify"

export type ServiceId = "outfitEngine" | "imageProcessing" | "taxonomy"

export type OutfitEndpoint =
  | "targets"
  | "candidates"
  | "score"
  | "outfits"
  | "calibrate"

/** Limits every service config carries, whatever else it adds. */
export interface ServiceLimits {
  enabled: boolean
  rpm: number
  burst: number
  dailyQuota: number
}

export interface OutfitEngineConfig extends ServiceLimits {
  maxWardrobeItems: number
  maxCandidates: number
  maxResults: number
  maxAccessories: number
  allowedEndpoints: OutfitEndpoint[]
}

export interface ImageProcessingConfig extends ServiceLimits {
  model: "u2netp" | "u2net"
  maxImageBytes: number
  maxImageDimension: number
  allowBase64Response: boolean
}

export interface TaxonomyConfig extends ServiceLimits {
  visionModel: string
  reasoningEffort: "none" | "low" | "medium" | "high"
  modelImageMaxDim: number
  maxUploadMb: number
  allowDebug: boolean
  cacheEnabled: boolean
}

export interface ApiKeyServices {
  outfitEngine: OutfitEngineConfig
  imageProcessing: ImageProcessingConfig
  taxonomy: TaxonomyConfig
}

export interface ApiKey {
  keyId: string
  name: string
  ownerEmail: string
  env: ApiKeyEnv
  status: ApiKeyStatus
  /** `demo_live_<keyId>` — the readable half. The secret is never returned. */
  displayPrefix: string
  lastFour: string
  scopes: ApiScope[]
  services: ApiKeyServices | null
  allowedOrigins: string[]
  allowedIps: string[]
  notes: string
  createdAt: string | null
  createdBy: string
  expiresAt: string | null
  revokedAt: string | null
  rotatedFrom: string | null
  rotatedTo: string | null
  lastUsedAt: string | null
  lastUsedService: string
}

export interface ApiKeyFilters {
  search: string
  status: ApiKeyStatus | "all"
  env: ApiKeyEnv | "all"
  scope: ApiScope | "all"
}

export interface CreateApiKeyInput {
  name: string
  ownerEmail: string
  env: ApiKeyEnv
  scopes: ApiScope[]
  services?: Partial<ApiKeyServices>
  allowedOrigins?: string[]
  allowedIps?: string[]
  expiresAt?: string | null
  notes?: string
  consolePassword: string
}

export interface UpdateApiKeyInput {
  keyId: string
  name?: string
  ownerEmail?: string
  status?: Exclude<ApiKeyStatus, "revoked">
  scopes?: ApiScope[]
  services?: Partial<ApiKeyServices>
  allowedOrigins?: string[]
  allowedIps?: string[]
  expiresAt?: string | null
  notes?: string
}

/** The one and only time a secret is readable. */
export interface MintedApiKey {
  keyId: string
  plaintext: string
  previousKeyId?: string
  graceEndsAt?: string
  consolePasswordEnforced: boolean
}

export interface ApiKeyUsageDay {
  date: string
  total: number
  byService: Partial<Record<ServiceId, number>>
}

export const API_SCOPES: ApiScope[] = [
  "outfit:read",
  "outfit:compute",
  "outfit:calibrate",
  "image:process",
  "taxonomy:classify",
]

export const SCOPES_BY_SERVICE: Record<ServiceId, ApiScope[]> = {
  outfitEngine: ["outfit:read", "outfit:compute", "outfit:calibrate"],
  imageProcessing: ["image:process"],
  taxonomy: ["taxonomy:classify"],
}

export const SERVICE_LABELS: Record<ServiceId, string> = {
  outfitEngine: "Outfit Engine",
  imageProcessing: "Image Processing",
  taxonomy: "Garment Taxonomy",
}

/**
 * Mirrors backend caps so the form can stop a typo before it travels. The
 * server clamps again; this copy is a courtesy, not the control.
 */
export const HARD_CAPS = {
  rpm: 600,
  burst: 200,
  dailyQuota: 1_000_000,
  outfitEngine: {
    maxWardrobeItems: 300,
    maxCandidates: 2000,
    maxResults: 50,
    maxAccessories: 6,
  },
  imageProcessing: {
    maxImageBytes: 16 * 1024 * 1024,
    maxImageDimension: 2048,
  },
  taxonomy: {
    maxUploadMb: 15,
    modelImageMaxDim: 1024,
  },
} as const

export const DEFAULT_SERVICES: ApiKeyServices = {
  outfitEngine: {
    enabled: false,
    rpm: 60,
    burst: 20,
    dailyQuota: 10_000,
    maxWardrobeItems: 300,
    maxCandidates: 2000,
    maxResults: 5,
    maxAccessories: 6,
    allowedEndpoints: ["targets", "candidates", "score", "outfits", "calibrate"],
  },
  imageProcessing: {
    enabled: false,
    rpm: 30,
    burst: 10,
    dailyQuota: 5000,
    model: "u2netp",
    maxImageBytes: 8 * 1024 * 1024,
    maxImageDimension: 1600,
    allowBase64Response: true,
  },
  taxonomy: {
    enabled: false,
    rpm: 30,
    burst: 10,
    dailyQuota: 2000,
    visionModel: "vision-model-demo",
    reasoningEffort: "none",
    modelImageMaxDim: 512,
    maxUploadMb: 15,
    allowDebug: false,
    cacheEnabled: true,
  },
}
