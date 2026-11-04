import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, MapPin, RefreshCw } from "lucide-react"

import { Button } from "../../../components/atoms/Button"
import { Input } from "../../../components/atoms/Input"
import { Card } from "../../../components/molecules/Card"
import {
  Dialog,
  DialogBody,
  DialogError,
  DialogFooter,
  DialogHeader,
} from "../../../components/molecules/Dialog"
import {
  syncWeatherLocations,
  triggerWeatherUpdate,
} from "../services/weatherService"

type WeatherAction = "syncLocations" | "triggerUpdate"

interface ActionState {
  message?: string
  type?: "success" | "error"
}

const actionCopy: Record<WeatherAction, { title: string; description: string; confirm: string }> = {
  syncLocations: {
    title: "Konumları eşitle",
    description:
      "İl ve ilçe listesi konum kayıtlarına yazılır; kullanıcı sayıları korunur.",
    confirm: "Konumları eşitle",
  },
  triggerUpdate: {
    title: "Hava durumunu güncelle",
    description:
      "Tüm konumların tahmini yeniden alınır ve uygulamadaki canlı tahmin içeriği yenilenir. Yaklaşık 10 dakika sürer; bitene kadar sayfayı kapatmayın.",
    confirm: "Güncellemeyi başlat",
  },
}

export function WeatherActionsPanel() {
  const queryClient = useQueryClient()
  const [pendingAction, setPendingAction] = useState<WeatherAction | null>(null)
  const [consolePassword, setConsolePassword] = useState("")
  const [status, setStatus] = useState<ActionState>({})

  const syncMutation = useMutation({
    mutationFn: syncWeatherLocations,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "weather"] })
      setStatus({
        type: "success",
        message: `Konumlar eşitlendi. Eşitlenen: ${result.synced}.`,
      })
      setPendingAction(null)
      setConsolePassword("")
    },
    onError: (error) => {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Konumlar eşitlenemedi.",
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: triggerWeatherUpdate,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "weather"] })
      setStatus({
        type: "success",
        message: `Güncelleme tamamlandı. ${result.total} konumdan ${result.success} başarılı, ${result.failed} başarısız.`,
      })
      setPendingAction(null)
      setConsolePassword("")
    },
    onError: (error) => {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Hava durumu güncellemesi başlatılamadı.",
      })
    },
  })

  const isRunning = syncMutation.isPending || updateMutation.isPending

  const openConfirm = (action: WeatherAction) => {
    setPendingAction(action)
    setConsolePassword("")
    setStatus({})
  }

  const closeConfirm = () => {
    if (!isRunning) {
      setPendingAction(null)
      setConsolePassword("")
    }
  }

  const confirmAction = () => {
    if (!pendingAction || consolePassword.trim().length === 0) return

    if (pendingAction === "syncLocations") {
      syncMutation.mutate({ consolePassword })
      return
    }

    updateMutation.mutate({ consolePassword })
  }

  return (
    <>
      <Card tone="quiet" className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
              <AlertTriangle aria-hidden="true" className="size-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink">Canlı işlemler</p>
              <p className="mt-0.5 text-sm text-ink-soft">
                Bu işlemler uygulamadaki canlı içeriği değiştirebilir. Konsol şifresiyle onaylanır.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              disabled={isRunning}
              onClick={() => openConfirm("syncLocations")}
              variant="secondary"
            >
              <MapPin aria-hidden="true" className="size-4" />
              Konumları eşitle
            </Button>
            <Button disabled={isRunning} onClick={() => openConfirm("triggerUpdate")} variant="accent">
              <RefreshCw aria-hidden="true" className={isRunning ? "size-4 animate-spin" : "size-4"} />
              Hava durumunu güncelle
            </Button>
          </div>
        </div>

        {status.message && !pendingAction ? (
          <p
            role={status.type === "error" ? "alert" : "status"}
            className={
              status.type === "error"
                ? "mt-4 animate-pop-in rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger"
                : "mt-4 animate-pop-in rounded-xl bg-success-soft px-3 py-2 text-sm font-semibold text-success"
            }
          >
            {status.message}
          </p>
        ) : null}
      </Card>

      {pendingAction ? (
        <Dialog labelledBy="weather-confirm-title" onClose={closeConfirm} size="sm">
          <DialogHeader
            description={`${actionCopy[pendingAction].description} Devam etmek için konsol şifresini girin.`}
            id="weather-confirm-title"
            onClose={isRunning ? undefined : closeConfirm}
          >
            {actionCopy[pendingAction].title}
          </DialogHeader>
          <DialogBody>
            <label className="block text-sm font-semibold text-ink">
              Konsol şifresi
              <Input
                autoFocus
                className="mt-1.5 w-full"
                disabled={isRunning}
                onChange={(event) => setConsolePassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") confirmAction()
                }}
                type="password"
                value={consolePassword}
              />
            </label>
            {status.type === "error" && status.message ? (
              <DialogError>{status.message}</DialogError>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button disabled={isRunning} onClick={closeConfirm} variant="secondary">
              Vazgeç
            </Button>
            <Button
              disabled={isRunning || consolePassword.trim().length === 0}
              onClick={confirmAction}
            >
              {isRunning ? "Çalışıyor…" : actionCopy[pendingAction].confirm}
            </Button>
          </DialogFooter>
        </Dialog>
      ) : null}
    </>
  )
}
