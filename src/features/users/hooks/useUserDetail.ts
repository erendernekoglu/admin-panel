import { useQuery } from "@tanstack/react-query"

import { fetchUserById } from "../services/userService"

export function useUserDetail(uid: string | undefined) {
  return useQuery({
    queryKey: ["admin", "users", uid],
    queryFn: () => fetchUserById(uid ?? ""),
    enabled: Boolean(uid),
    staleTime: 60_000,
  })
}
