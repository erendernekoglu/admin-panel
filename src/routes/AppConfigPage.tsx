import { useMemo, useState } from "react"
import { useQueries } from "@tanstack/react-query"
import { AlertCircle, Loader2 } from "lucide-react"

import { Card } from "../components/molecules/Card"
import { PageHeader } from "../components/molecules/PageHeader"
import { AppConfigCard } from "../features/app-config/components/AppConfigCard"
import { AppConfigEditor } from "../features/app-config/components/AppConfigEditor"
import { AppConfigTabs } from "../features/app-config/components/AppConfigTabs"
import { ConfigWarningCard } from "../features/app-config/components/ConfigWarningCard"
import {
  APP_CONFIG_DEFINITIONS,
  getMetadata,
} from "../features/app-config/components/configHelpers"
import { fetchAppConfigGroup } from "../features/app-config/services/appConfigService"

export default function AppConfigPage() {
  const [activeKey, setActiveKey] = useState(APP_CONFIG_DEFINITIONS[0].key)
  const configQueries = useQueries({
    queries: APP_CONFIG_DEFINITIONS.map((definition) => ({
      queryKey: ["admin", "config", definition.key],
      queryFn: () => fetchAppConfigGroup(definition.key),
      staleTime: 60_000,
    })),
  })

  const activeIndex = APP_CONFIG_DEFINITIONS.findIndex(
    (definition) => definition.key === activeKey,
  )
  const activeDefinition = APP_CONFIG_DEFINITIONS[activeIndex] ?? APP_CONFIG_DEFINITIONS[0]
  const activeQuery = configQueries[activeIndex] ?? configQueries[0]
  const isInitialLoading = configQueries.some((query) => query.isPending)
  const firstError = configQueries.find((query) => query.isError)?.error
  const missingKeys = useMemo(
    () =>
      new Set(
        APP_CONFIG_DEFINITIONS.filter(
          (_definition, index) =>
            !configQueries[index]?.isPending &&
            !configQueries[index]?.isError &&
            !configQueries[index]?.data,
        ).map((definition) => definition.key),
      ),
    [configQueries],
  )
  const allMissing =
    !isInitialLoading &&
    !firstError &&
    APP_CONFIG_DEFINITIONS.every((_definition, index) => !configQueries[index]?.data)
  const metadata = getMetadata(activeQuery?.data)

  return (
    <>
      <PageHeader
        description="Mobil uygulamanın davranışını belirleyen uzaktan ayarları görüntüleyin ve düzenleyin."
        title="Uygulama ayarları"
      />

      <ConfigWarningCard />

      {isInitialLoading ? (
        <Card className="flex min-h-64 items-center justify-center gap-2 p-8 text-sm text-ink-soft" role="status">
          <Loader2 aria-hidden className="size-5 animate-spin text-muted" />
          Uygulama ayarları yükleniyor…
        </Card>
      ) : null}

      {firstError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-danger/25 bg-danger-soft p-5" role="alert">
          <AlertCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-danger" />
          <div className="min-w-0">
            <h2 className="text-base font-bold text-danger">Ayarlar yüklenemedi</h2>
            <p className="mt-1 break-words text-sm text-ink-soft">
              {firstError instanceof Error
                ? firstError.message
                : "Yönetim servisi beklenmeyen bir hata döndürdü."}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              Sayfayı yenileyip tekrar deneyin; sorun sürerse yönetim servisi bağlantısını kontrol edin.
            </p>
          </div>
        </div>
      ) : null}

      {!isInitialLoading && !firstError ? (
        <>
          {allMissing ? (
            <Card className="p-5 sm:p-6" tone="quiet">
              <h2 className="text-base font-bold text-ink">Hiç ayar belgesi bulunamadı</h2>
              <p className="mt-1 max-w-2xl text-sm text-ink-soft">
                Desteklenen <span className="font-semibold">config/*</span> belgelerinin
                hiçbiri yok. Önce bunları sunucu tarafında ya da mevcut yönetim araçlarıyla
                oluşturun, sonra burada düzenleyin.
              </p>
            </Card>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-6">
            <div className="lg:sticky lg:top-24">
              <AppConfigTabs
                activeKey={activeDefinition.key}
                definitions={APP_CONFIG_DEFINITIONS}
                missingKeys={missingKeys}
                onChange={setActiveKey}
              />
            </div>

            <AppConfigCard
              description={activeDefinition.description}
              title={activeDefinition.label}
              updatedAt={metadata.updatedAt}
              updatedBy={metadata.updatedBy}
            >
              <AppConfigEditor
                configKey={activeDefinition.key}
                configLabel={activeDefinition.label}
                data={activeQuery?.data}
              />
            </AppConfigCard>
          </div>
        </>
      ) : null}
    </>
  )
}
