import { cn } from "../../../lib/utils"
import {
  HARD_CAPS,
  SCOPES_BY_SERVICE,
  SERVICE_LABELS,
  type ApiKeyServices,
  type ApiScope,
  type OutfitEndpoint,
  type ServiceId,
} from "../types"
import {
  CheckboxGroup,
  NumberField,
  SelectField,
  TextField,
  ToggleField,
} from "./ServiceConfigFields"

interface ServiceConfigEditorProps {
  onScopesChange: (scopes: ApiScope[]) => void
  onServicesChange: (services: ApiKeyServices) => void
  scopes: ApiScope[]
  services: ApiKeyServices
}

const SERVICE_IDS: ServiceId[] = ["outfitEngine", "imageProcessing", "taxonomy"]

// Endpoint and scope names are API identifiers, so they are shown as-is.
const LOOK_ENGINE_ENDPOINTS: Array<{
  label: string
  value: OutfitEndpoint
}> = [
  { label: "targets", value: "targets" },
  { label: "candidates", value: "candidates" },
  { label: "score", value: "score" },
  { label: "outfits", value: "outfits" },
  { label: "calibrate", value: "calibrate" },
]

/**
 * Access and configuration for one key, service by service.
 *
 * Turning a service on grants its scopes and turning it off withdraws them, so
 * the two cannot drift apart: a key with `taxonomy:classify` but a disabled
 * taxonomy section would be a contradiction the services resolve as "denied"
 * anyway.
 */
export function ServiceConfigEditor({
  onScopesChange,
  onServicesChange,
  scopes,
  services,
}: ServiceConfigEditorProps) {
  function setService<K extends ServiceId>(
    id: K,
    patch: Partial<ApiKeyServices[K]>,
  ) {
    onServicesChange({ ...services, [id]: { ...services[id], ...patch } })
  }

  function setEnabled(id: ServiceId, enabled: boolean) {
    setService(id, { enabled } as never)

    const owned = SCOPES_BY_SERVICE[id]
    if (enabled) {
      // Compute-style access is the useful default; read/calibrate stay opt-in.
      const granted = new Set<ApiScope>([...scopes, owned[owned.length === 1 ? 0 : 1]])
      onScopesChange([...granted])
    } else {
      onScopesChange(scopes.filter((scope) => !owned.includes(scope)))
    }
  }

  return (
    <div className="space-y-3">
      {SERVICE_IDS.map((id) => {
        const config = services[id]

        return (
          <section
            className={cn(
              "rounded-2xl border p-4 transition-colors duration-200 ease-[var(--ease-panel)] sm:p-5",
              config.enabled ? "border-line-strong bg-surface" : "border-line bg-surface-2/60",
            )}
            key={id}
          >
            <ToggleField
              hint={
                config.enabled
                  ? "Bu anahtar servisi çağırabilir."
                  : "Kapalı; bu servise gelen istekler reddedilir."
              }
              label={SERVICE_LABELS[id]}
              onChange={(value) => setEnabled(id, value)}
              value={config.enabled}
            />

            {config.enabled && (
              <div className="mt-4 animate-pop-in space-y-5 border-t border-line pt-4">
                <CheckboxGroup<ApiScope>
                  label="İzinler"
                  onChange={(next) =>
                    onScopesChange([
                      ...scopes.filter(
                        (scope) => !SCOPES_BY_SERVICE[id].includes(scope),
                      ),
                      ...next,
                    ])
                  }
                  options={SCOPES_BY_SERVICE[id].map((scope) => ({
                    label: scope,
                    value: scope,
                  }))}
                  value={scopes.filter((scope) =>
                    SCOPES_BY_SERVICE[id].includes(scope),
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-3">
                  <NumberField
                    cap={HARD_CAPS.rpm}
                    hint="Örnek başına; toplam tavan bu değerin en fazla örnek sayısıyla çarpımıdır."
                    label="İstek / dakika"
                    onChange={(rpm) => setService(id, { rpm } as never)}
                    value={config.rpm}
                  />
                  <NumberField
                    cap={HARD_CAPS.burst}
                    hint="Kısa süreli ani yükte izin verilen ek istek."
                    label="Anlık tepe"
                    onChange={(burst) => setService(id, { burst } as never)}
                    value={config.burst}
                  />
                  <NumberField
                    cap={HARD_CAPS.dailyQuota}
                    hint="UTC gününe göre sayılır."
                    label="Günlük kota"
                    onChange={(dailyQuota) =>
                      setService(id, { dailyQuota } as never)
                    }
                    value={config.dailyQuota}
                  />
                </div>

                {id === "outfitEngine" && (
                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <NumberField
                        cap={HARD_CAPS.outfitEngine.maxWardrobeItems}
                        label="En fazla gardırop parçası"
                        onChange={(maxWardrobeItems) =>
                          setService("outfitEngine", { maxWardrobeItems })
                        }
                        value={services.outfitEngine.maxWardrobeItems}
                      />
                      <NumberField
                        cap={HARD_CAPS.outfitEngine.maxCandidates}
                        label="En fazla aday"
                        onChange={(maxCandidates) =>
                          setService("outfitEngine", { maxCandidates })
                        }
                        value={services.outfitEngine.maxCandidates}
                      />
                      <NumberField
                        cap={HARD_CAPS.outfitEngine.maxResults}
                        label="En fazla sonuç"
                        onChange={(maxResults) =>
                          setService("outfitEngine", { maxResults })
                        }
                        value={services.outfitEngine.maxResults}
                      />
                      <NumberField
                        cap={HARD_CAPS.outfitEngine.maxAccessories}
                        label="En fazla aksesuar"
                        min={0}
                        onChange={(maxAccessories) =>
                          setService("outfitEngine", { maxAccessories })
                        }
                        value={services.outfitEngine.maxAccessories}
                      />
                    </div>
                    <CheckboxGroup<OutfitEndpoint>
                      label="İzin verilen uç noktalar"
                      onChange={(allowedEndpoints) =>
                        setService("outfitEngine", { allowedEndpoints })
                      }
                      options={LOOK_ENGINE_ENDPOINTS}
                      value={services.outfitEngine.allowedEndpoints}
                    />
                  </div>
                )}

                {id === "imageProcessing" && (
                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <SelectField
                        label="Model"
                        onChange={(model) =>
                          setService("imageProcessing", { model })
                        }
                        options={[
                          { label: "u2netp — hızlı, hafif", value: "u2netp" },
                          { label: "u2net — yavaş, daha keskin", value: "u2net" },
                        ]}
                        value={services.imageProcessing.model}
                      />
                      <NumberField
                        cap={HARD_CAPS.imageProcessing.maxImageBytes}
                        hint="Bayt cinsinden. Gövde okunmadan önce kontrol edilir."
                        label="En büyük görsel boyutu"
                        onChange={(maxImageBytes) =>
                          setService("imageProcessing", { maxImageBytes })
                        }
                        value={services.imageProcessing.maxImageBytes}
                      />
                      <NumberField
                        cap={HARD_CAPS.imageProcessing.maxImageDimension}
                        hint="En uzun kenar, piksel cinsinden."
                        label="En büyük kenar"
                        onChange={(maxImageDimension) =>
                          setService("imageProcessing", { maxImageDimension })
                        }
                        value={services.imageProcessing.maxImageDimension}
                      />
                    </div>
                    <ToggleField
                      hint="Çağıran taraf PNG yerine base64 JSON yanıt isteyebilir."
                      label="Base64 yanıtlara izin ver"
                      onChange={(allowBase64Response) =>
                        setService("imageProcessing", { allowBase64Response })
                      }
                      value={services.imageProcessing.allowBase64Response}
                    />
                  </div>
                )}

                {id === "taxonomy" && (
                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField
                        label="Görsel modeli"
                        onChange={(visionModel) =>
                          setService("taxonomy", { visionModel })
                        }
                        placeholder="gemini-2.5-flash"
                        value={services.taxonomy.visionModel}
                      />
                      <SelectField
                        label="Akıl yürütme düzeyi"
                        onChange={(reasoningEffort) =>
                          setService("taxonomy", { reasoningEffort })
                        }
                        options={[
                          { label: "Yok", value: "none" },
                          { label: "Düşük", value: "low" },
                          { label: "Orta", value: "medium" },
                          { label: "Yüksek", value: "high" },
                        ]}
                        value={services.taxonomy.reasoningEffort}
                      />
                      <NumberField
                        cap={HARD_CAPS.taxonomy.modelImageMaxDim}
                        hint="Görsel maliyeti ile doğruluk arasında denge kurar."
                        label="Modele giden görselin en büyük kenarı"
                        onChange={(modelImageMaxDim) =>
                          setService("taxonomy", { modelImageMaxDim })
                        }
                        value={services.taxonomy.modelImageMaxDim}
                      />
                      <NumberField
                        cap={HARD_CAPS.taxonomy.maxUploadMb}
                        label="En büyük yükleme (MB)"
                        onChange={(maxUploadMb) =>
                          setService("taxonomy", { maxUploadMb })
                        }
                        value={services.taxonomy.maxUploadMb}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <ToggleField
                        hint="İstemleri, süreleri ve token sayılarını gösterir. Yalnızca iç anahtarlar için."
                        label="Hata ayıklama çıktısına izin ver"
                        onChange={(allowDebug) =>
                          setService("taxonomy", { allowDebug })
                        }
                        value={services.taxonomy.allowDebug}
                      />
                      <ToggleField
                        hint="Aynı görseller için önceki sonuçları yeniden kullanır."
                        label="Yanıt önbelleği"
                        onChange={(cacheEnabled) =>
                          setService("taxonomy", { cacheEnabled })
                        }
                        value={services.taxonomy.cacheEnabled}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
