import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query"

import type { AdminCursor } from "../../../types/admin"
import {
  countUsers,
  fetchUsersPage,
  searchUsers,
  type UserListFilters,
} from "../services/userService"

export const DEFAULT_USER_FILTERS: UserListFilters = {
  userFilter: "all",
  platformFilter: "all",
}

export const usersPageQueryOptions = (
  filters: UserListFilters,
  pageIndex: number,
  cursor: AdminCursor | null,
) =>
  queryOptions({
    queryKey: ["admin", "users", "page", filters.userFilter, filters.platformFilter, pageIndex],
    queryFn: () => fetchUsersPage(filters, cursor),
  })

export const usersCountQueryOptions = (filters: UserListFilters) =>
  queryOptions({
    queryKey: ["admin", "users", "count", filters.userFilter, filters.platformFilter],
    queryFn: () => countUsers(filters),
  })

/**
 * One adapter-side page. The cursor belongs to the page index in the key: the
 * page stack is reset whenever the filters change.
 */
export function useUsersPage(
  filters: UserListFilters,
  pageIndex: number,
  cursor: AdminCursor | null,
  enabled = true,
) {
  return useQuery({
    ...usersPageQueryOptions(filters, pageIndex, cursor),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useUsersCount(filters: UserListFilters) {
  return useQuery(usersCountQueryOptions(filters))
}

export function useUserSearch(term: string) {
  return useQuery({
    queryKey: ["admin", "users", "search", term],
    queryFn: () => searchUsers(term),
    enabled: term.length > 0,
    placeholderData: keepPreviousData,
  })
}
