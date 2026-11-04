import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { adminRequest } from "../../lib/api/client"
import type { ConsoleRole } from "../../lib/auth/permissions"
import { demoListTeam, demoSetTeamRole } from "../demo/store"

export interface TeamMember {
  uid: string
  role: ConsoleRole
  email: string | null
  displayName: string | null
  disabled: boolean
  updatedAt: string | null
}

export interface SetRoleInput {
  uid: string
  /** null removes the member from the console team. */
  role: ConsoleRole | null
  consolePassword: string
}

export interface SetRoleResult {
  uid: string
  role: ConsoleRole | null
  changed: boolean
}

export async function fetchTeam(): Promise<TeamMember[]> {
  return adminRequest<TeamMember[]>("team.list", {}, () =>
    demoListTeam(),
  )
}

export async function setTeamRole(input: SetRoleInput): Promise<SetRoleResult> {
  return adminRequest<SetRoleResult>("team.setRole", input, () =>
    demoSetTeamRole(input),
  )
}

export const teamQueryOptions = queryOptions({
  queryKey: ["admin", "team"],
  queryFn: fetchTeam,
})

export function useTeam() {
  return useQuery(teamQueryOptions)
}

/** Role changes are checked again by the adapter/live backend. */
export function useSetRole() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: setTeamRole,
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: teamQueryOptions.queryKey }),
        client.invalidateQueries({ queryKey: ["admin", "users"] }),
      ]),
  })
}
