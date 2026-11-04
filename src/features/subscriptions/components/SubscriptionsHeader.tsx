import { SlidersHorizontal } from "lucide-react"

import { Button } from "../../../components/atoms/Button"
import { PageHeader } from "../../../components/molecules/PageHeader"

export function SubscriptionsHeader() {
  return (
    <PageHeader
      actions={
        <Button
          disabled
          title="Abonelik yönetimi yakında eklenecek"
          variant="secondary"
        >
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          Aboneliği yönet
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-soft">
            Yakında
          </span>
        </Button>
      }
      description="Plan dağılımını, abonelik durumlarını, yenileme bilgilerini ve son kayıtları inceleyin."
      title="Abonelikler"
    />
  )
}
