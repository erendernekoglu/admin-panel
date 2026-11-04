import { Card, CardHeader } from "../components/molecules/Card"
import { PageHeader } from "../components/molecules/PageHeader"
import { ThemeToggle } from "../components/molecules/ThemeToggle"

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        description="Yönetim panelinin görünümünü ve tercihlerini buradan ayarlayın."
        title="Ayarlar"
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="p-5 sm:p-6">
          <CardHeader
            actions={<ThemeToggle className="shrink-0" />}
            description="Açık ve koyu tema arasında geçiş yapın. Seçiminiz bu tarayıcıda hatırlanır."
            title="Görünüm"
          />
        </Card>

        <Card className="p-5 sm:p-6" tone="quiet">
          <CardHeader
            description="Hesap, panel ve bildirim ayarları sonraki sürümlerde buraya eklenecek."
            title="Diğer ayarlar"
          />
        </Card>
      </div>
    </>
  )
}
