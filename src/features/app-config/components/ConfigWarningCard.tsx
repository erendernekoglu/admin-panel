import { AlertTriangle } from "lucide-react"

export function ConfigWarningCard() {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-warning-soft px-4 py-3.5 text-warning">
      <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0" />
      <p className="text-sm leading-relaxed">
        <span className="font-bold">Canlı ortam. </span>
        Bu ayarlar mobil uygulamayı kullanan herkesi etkiler; kaydetmeden önce
        değişikliği dikkatle gözden geçirin.
      </p>
    </div>
  )
}
