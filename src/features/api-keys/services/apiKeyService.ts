/**
 * API key operations go through the admin adapter.
 *
 * The live backend returns a redacted view; the secret itself appears exactly
 * once, in the response to create or rotate. Demo mode returns obviously fake
 * secrets from the shared in-memory store.
 */
import { adminRequest } from "../../../lib/api/client"
import {
  demoApiKeyUsage,
  demoCreateApiKey,
  demoGetApiKey,
  demoListApiKeys,
  demoRevokeApiKey,
  demoRotateApiKey,
  demoUpdateApiKey,
} from "../../demo/store"
import type {
  ApiKey,
  ApiKeyUsageDay,
  CreateApiKeyInput,
  MintedApiKey,
  UpdateApiKeyInput,
} from "../types"

export function fetchApiKeys() {
  return adminRequest<ApiKey[]>("apiKeys.list", {}, () => demoListApiKeys())
}

export function fetchApiKey(keyId: string) {
  return adminRequest<ApiKey>("apiKeys.get", { keyId }, () =>
    demoGetApiKey(keyId),
  )
}

export function createApiKey(input: CreateApiKeyInput) {
  return adminRequest<MintedApiKey>("apiKeys.create", input, () =>
    demoCreateApiKey(input),
  )
}

export function updateApiKey(input: UpdateApiKeyInput) {
  return adminRequest<ApiKey>("apiKeys.update", input, () =>
    demoUpdateApiKey(input),
  )
}

export function rotateApiKey(input: {
  keyId: string
  consolePassword: string
}) {
  return adminRequest<MintedApiKey>("apiKeys.rotate", input, () =>
    demoRotateApiKey(input),
  )
}

export function revokeApiKey(input: {
  keyId: string
  consolePassword: string
}) {
  return adminRequest<ApiKey>("apiKeys.revoke", input, () =>
    demoRevokeApiKey(input),
  )
}

export function fetchApiKeyUsage(input: {
  keyId: string
  startDate: string
  endDate: string
}) {
  return adminRequest<ApiKeyUsageDay[]>("apiKeys.usage", input, () =>
    demoApiKeyUsage(input.keyId, input.startDate, input.endDate),
  )
}
