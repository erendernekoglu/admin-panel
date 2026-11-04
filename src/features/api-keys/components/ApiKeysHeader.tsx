import { Plus } from "lucide-react"

import { Button } from "../../../components/atoms/Button"
import { PageHeader } from "../../../components/molecules/PageHeader"

interface ApiKeysHeaderProps {
  /** Omitted while the list is loading or failed, so the action only appears when it can be used. */
  onCreateClick?: () => void
}

export function ApiKeysHeader({ onCreateClick }: ApiKeysHeaderProps) {
  return (
    <PageHeader
      actions={
        onCreateClick ? (
          <Button onClick={onCreateClick} variant="accent">
            <Plus aria-hidden className="size-4" />
            Anahtar oluştur
          </Button>
        ) : undefined
      }
      description="İş ortaklarının Outfit Engine, Image Processing ve Garment Taxonomy servislerini çağırmasını sağlayan anahtarlar; her biri kendi izinlerini, limitlerini ve servis ayarlarını taşır."
      title="API anahtarları"
    />
  )
}
