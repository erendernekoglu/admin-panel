import { useQuery } from "@tanstack/react-query"

import { fetchAppConfigGroup } from "../services/appConfigService"
import type { AppConfigKey } from "../types"

export function useAppConfig<TKey extends AppConfigKey>(groupKey: TKey) {
  return useQuery({
    queryKey: ["admin", "config", groupKey],
    queryFn: () => fetchAppConfigGroup(groupKey),
    staleTime: 60_000,
  })
}
