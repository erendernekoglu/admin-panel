import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  createApiKey,
  revokeApiKey,
  rotateApiKey,
  updateApiKey,
} from "../services/apiKeyService"

export function useApiKeyMutations() {
  const queryClient = useQueryClient()

  const invalidateApiKeys = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "apiKeys"] })
  }

  return {
    createApiKey: useMutation({
      mutationFn: createApiKey,
      onSuccess: invalidateApiKeys,
    }),
    updateApiKey: useMutation({
      mutationFn: updateApiKey,
      onSuccess: invalidateApiKeys,
    }),
    rotateApiKey: useMutation({
      mutationFn: rotateApiKey,
      onSuccess: invalidateApiKeys,
    }),
    revokeApiKey: useMutation({
      mutationFn: revokeApiKey,
      onSuccess: invalidateApiKeys,
    }),
  }
}
