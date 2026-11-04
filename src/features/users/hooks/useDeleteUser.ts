import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteUser } from "../services/userService"

/**
 * Deletes a user through the adapter only.
 * Frontend confirmation is UX friction; authorization is enforced by the live
 * backend and mirrored by demo-mode guards.
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { uid: string; consolePassword: string }) =>
      deleteUser(params),
    onSuccess: async (_data, { uid }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "users", uid] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "team"] }),
      ])
    },
  })
}
