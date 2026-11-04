import { Calendar, Camera, Heart, Shirt, Sparkles } from "lucide-react"

import { Card, CardHeader } from "../../../components/molecules/Card"

interface WardrobeActivitySummaryProps {
  calendar: number
  savedPhotos: number
  savedResults: number
  wardrobe: number
  wishlist: number
}

const numberFormatter = new Intl.NumberFormat("tr-TR")

export function WardrobeActivitySummary({
  calendar,
  savedPhotos,
  savedResults,
  wardrobe,
  wishlist,
}: WardrobeActivitySummaryProps) {
  const items = [
    { icon: Shirt, label: "Gardırop", collection: "wardrobe", value: wardrobe },
    { icon: Sparkles, label: "Kayıtlı sonuçlar", collection: "savedResults", value: savedResults },
    { icon: Camera, label: "Kayıtlı fotoğraflar", collection: "savedPhotos", value: savedPhotos },
    { icon: Heart, label: "İstek listesi", collection: "wishlist", value: wishlist },
    { icon: Calendar, label: "Takvim", collection: "calendar", value: calendar },
  ]

  return (
    <Card tone="quiet" className="p-5">
      <CardHeader
        title="Etkinlik özeti"
        description="Gardırop analizinde kullanılan kullanıcı alt koleksiyonlarının toplamları."
      />
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 xl:grid-cols-5">
        {items.map(({ icon: Icon, label, collection, value }) => (
          <div key={collection} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-sm font-medium text-ink-soft">
              <Icon aria-hidden="true" className="size-4 text-muted" />
              {label}
            </dt>
            <dd className="mt-1.5 text-2xl font-extrabold tracking-tight tabular-nums text-ink">
              {numberFormatter.format(value)}
            </dd>
            <dd className="mt-0.5 font-mono text-[11px] text-muted">{collection}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
