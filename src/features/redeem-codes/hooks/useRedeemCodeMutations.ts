import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  assignRedeemCode,
  createRedeemCode,
  disableRedeemCode,
} from "../services/redeemCodeService"

export function useRedeemCodeMutations() {
  const queryClient = useQueryClient()

  const invalidateRedeemCodes = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["admin", "promoCodes"],
    })
  }

  return {
    createRedeemCode: useMutation({
      mutationFn: createRedeemCode,
      onSuccess: invalidateRedeemCodes,
    }),
    assignRedeemCode: useMutation({
      mutationFn: assignRedeemCode,
      onSuccess: invalidateRedeemCodes,
    }),
    disableRedeemCode: useMutation({
      mutationFn: disableRedeemCode,
      onSuccess: invalidateRedeemCodes,
    }),
  }
}
