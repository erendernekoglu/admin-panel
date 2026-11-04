import { DatabaseZap, ShieldCheck } from "lucide-react"

import { Card } from "../../../components/molecules/Card"

export function AnalyticsSetupState({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Analitik verisine ulaşılamıyor."
  const configurationError = /configure|precondition|not configured|setup|export/i.test(message)

  return (
    <Card className="p-6" role="alert">
      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        <div className="w-fit rounded-xl bg-warning-soft p-3 text-warning">
          <DatabaseZap aria-hidden size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-ink">
            {configurationError
              ? "Analitik veri kaynağı henüz bağlı değil"
              : "Analitik verisi yüklenemedi"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink-soft">
            {configurationError
              ? "Yönetici API'sinde analitik işlemleri etkinleştirildikten sonra sayfayı yenileyin."
              : "Birkaç dakika sonra Yenile ile tekrar deneyin; sorun sürerse yönetici API günlüklerine bakın."}
          </p>
          <p className="mt-2 font-mono text-xs break-words text-muted">{message}</p>
          {configurationError ? (
            <ol className="mt-4 grid list-inside list-decimal gap-2 text-sm text-ink-soft md:grid-cols-2">
              <li>Yönetici API'sinde analitik işlemlerini etkinleştirin.</li>
              <li>Analitik veri kaynağını panele bağlayın.</li>
              <li>Sunucu tarafındaki bağlantı ayarlarını tamamlayın.</li>
              <li>Yetkili bir hesapla yeniden giriş yapın.</li>
            </ol>
          ) : null}
          <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-success">
            <ShieldCheck aria-hidden size={15} /> Örnek veriler hiçbir zaman gerçek veri gibi gösterilmez.
          </p>
        </div>
      </div>
    </Card>
  )
}
