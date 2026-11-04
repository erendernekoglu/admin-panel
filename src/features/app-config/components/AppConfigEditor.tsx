import { CheckCircle2, RefreshCcw, Save } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { Badge } from "../../../components/atoms/Badge"
import { Button } from "../../../components/atoms/Button"
import type { AppConfigKey } from "../types"
import { updateAppConfig } from "../services/appConfigService"
import { ConfigValueField } from "./ConfigValueField"
import { SaveConfigDialog } from "./SaveConfigDialog"
import type { ConfigJsonValue, ConfigRecord } from "./configHelpers"
import {
  getConfigValueTypeLabel,
  stableConfigString,
  toConfigRecord,
} from "./configHelpers"

interface AppConfigEditorProps {
  configKey: AppConfigKey
  configLabel: string
  data: unknown
}

export function AppConfigEditor({
  configKey,
  configLabel,
  data,
}: AppConfigEditorProps) {
  const queryClient = useQueryClient()
  const originalRecord = useMemo(() => toConfigRecord(data), [data])
  const [draft, setDraft] = useState<ConfigRecord>(originalRecord)
  const [jsonErrors, setJsonErrors] = useState<Record<string, string | undefined>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saveError, setSaveError] = useState<string>()
  const [successMessage, setSuccessMessage] = useState<string>()
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setDraft(originalRecord)
    setJsonErrors({})
    setSaveError(undefined)
    setSuccessMessage(undefined)
  }, [originalRecord])

  const isDirty = stableConfigString(draft) !== stableConfigString(originalRecord)
  const hasJsonErrors = Object.values(jsonErrors).some(Boolean)
  const fieldEntries = Object.entries(draft)

  const updateField = (fieldKey: string, value: ConfigJsonValue) => {
    setDraft((current) => ({
      ...current,
      [fieldKey]: value,
    }))
    setSuccessMessage(undefined)
  }

  const handleSave = async (consolePassword: string) => {
    setIsSaving(true)
    setSaveError(undefined)

    try {
      await updateAppConfig({
        configId: configKey,
        data: draft,
        consolePassword,
      })
      await queryClient.invalidateQueries({
        queryKey: ["admin", "config", configKey],
      })
      setDialogOpen(false)
      setSuccessMessage(`${configLabel} kaydedildi ve yayınlandı.`)
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Ayarlar kaydedilemedi. Şifreyi kontrol edip tekrar deneyin.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong px-5 py-8 text-center">
        <h3 className="text-base font-bold text-ink">Bu ayar belgesi yok</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">
          <span className="font-semibold">config/{configKey}</span> kaydı bulunamadı.
          Yönetim servisi bu grubu döndürdüğünde burada görüntüleyip düzenleyebilirsiniz.
        </p>
      </div>
    )
  }

  return (
    <>
      {fieldEntries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong px-5 py-8 text-center">
          <h3 className="text-base font-bold text-ink">Düzenlenebilir alan yok</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">
            Bu belgede yalnızca üst veri ya da desteklenmeyen değerler var. Alanları
            sunucu tarafında ekleyin, sonra burada düzenleyin.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-line">
          {fieldEntries.map(([fieldKey, value]) => {
            const inputId = `${configKey}-${fieldKey}`

            return (
              <div
                className="grid gap-2 py-4 first:pt-0 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:gap-6"
                key={fieldKey}
              >
                <div className="min-w-0 lg:pt-2">
                  <label
                    className="block break-words text-sm font-semibold text-ink"
                    htmlFor={inputId}
                  >
                    {fieldKey}
                  </label>
                  <Badge className="mt-1.5 px-2 py-0.5 text-[11px]">
                    {getConfigValueTypeLabel(value)}
                  </Badge>
                </div>
                <ConfigValueField
                  id={inputId}
                  jsonError={jsonErrors[fieldKey]}
                  label={fieldKey}
                  onChange={(nextValue) => updateField(fieldKey, nextValue)}
                  onJsonError={(message) =>
                    setJsonErrors((current) => ({ ...current, [fieldKey]: message }))
                  }
                  value={value}
                />
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-2 space-y-3 border-t border-line pt-4">
        {successMessage ? (
          <p
            className="flex animate-pop-in items-center gap-2 rounded-xl bg-success-soft px-3.5 py-2.5 text-sm font-medium text-success"
            role="status"
          >
            <CheckCircle2 aria-hidden className="size-4 shrink-0" />
            {successMessage}
          </p>
        ) : null}

        {hasJsonErrors ? (
          <p
            className="animate-pop-in rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger"
            role="alert"
          >
            Kaydetmeden önce hatalı JSON alanlarını düzeltin.
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted" aria-live="polite">
            {isDirty
              ? "Kaydedilmemiş değişiklikler var; onaylayana kadar yalnızca bu tarayıcıda durur."
              : "Değişiklik yok."}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              disabled={!isDirty || isSaving}
              onClick={() => {
                setDraft(originalRecord)
                setJsonErrors({})
              }}
              variant="secondary"
            >
              <RefreshCcw aria-hidden className="size-4" />
              Değişiklikleri geri al
            </Button>
            <Button
              disabled={!isDirty || hasJsonErrors || fieldEntries.length === 0 || isSaving}
              onClick={() => setDialogOpen(true)}
              variant="accent"
            >
              <Save aria-hidden className="size-4" />
              Kaydet ve yayınla
            </Button>
          </div>
        </div>
      </div>

      <SaveConfigDialog
        configLabel={configLabel}
        error={saveError}
        isSaving={isSaving}
        onCancel={() => {
          if (!isSaving) setDialogOpen(false)
        }}
        onConfirm={handleSave}
        open={dialogOpen}
      />
    </>
  )
}
