import { Heart, Layers3, Shirt, Sparkles, Tags, Users } from "lucide-react"

import { WardrobeKpiCard } from "./WardrobeKpiCard"

interface WardrobeKpiGridProps {
  /** null when the role may not read user records. */
  activeWardrobeUsers: number | null
  newItems: number
  savedResults: number
  topCategory?: string
  totalItems: number
  wishlistItems: number
}

const numberFormatter = new Intl.NumberFormat("tr-TR")

function formatNumber(value: number) {
  return numberFormatter.format(value)
}

export function WardrobeKpiGrid({
  activeWardrobeUsers,
  newItems,
  savedResults,
  topCategory,
  totalItems,
  wishlistItems,
}: WardrobeKpiGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
      <WardrobeKpiCard
        helper="wardrobe koleksiyon grubundaki kayıtlar"
        icon={Shirt}
        label="Toplam parça"
        value={formatNumber(totalItems)}
      />
      <WardrobeKpiCard
        helper="Seçilen dönemde eklenen parçalar"
        icon={Layers3}
        label="Yeni parça"
        value={formatNumber(newItems)}
      />
      <WardrobeKpiCard
        helper={
          activeWardrobeUsers === null
            ? "Kullanıcı kayıtlarını görebilen roller için"
            : "Gardırobunda en az bir parça olan kullanıcılar"
        }
        icon={Users}
        label="Aktif kullanıcı"
        value={activeWardrobeUsers === null ? "—" : formatNumber(activeWardrobeUsers)}
      />
      <WardrobeKpiCard
        helper="Örnekte en sık görülen kategori"
        icon={Tags}
        label="En yaygın kategori"
        value={topCategory ?? "—"}
      />
      <WardrobeKpiCard
        helper="savedResults koleksiyon grubundaki kayıtlar"
        icon={Sparkles}
        label="Kayıtlı sonuç"
        value={formatNumber(savedResults)}
      />
      <WardrobeKpiCard
        helper="wishlist koleksiyon grubundaki kayıtlar"
        icon={Heart}
        label="İstek listesi"
        value={formatNumber(wishlistItems)}
      />
    </div>
  )
}
