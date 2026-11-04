import { adminRequest } from "../../../lib/api/client"
import {
  demoFetchAppConfig,
  demoUpdateAppConfig,
} from "../../demo/store"
import type { AppConfigKey, AppConfigMap } from "../types"

export async function fetchAppConfigGroup<TKey extends AppConfigKey>(
  groupKey: TKey,
): Promise<AppConfigMap[TKey] | null> {
  return adminRequest<AppConfigMap[TKey] | null>(
    "appConfig.get",
    { groupKey },
    () => demoFetchAppConfig(groupKey) as AppConfigMap[TKey] | null,
  )
}

export interface UpdateAppConfigInput {
  configId: AppConfigKey
  data: Record<string, unknown>
  consolePassword: string
}

export async function updateAppConfig(
  input: UpdateAppConfigInput,
): Promise<void> {
  await adminRequest<void>("appConfig.update", input, () =>
    demoUpdateAppConfig(input),
  )
}
