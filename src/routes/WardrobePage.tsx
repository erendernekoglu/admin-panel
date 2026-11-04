import { useMemo, useState } from "react"

import { bucketByGranularity, createDateRange } from "../lib/analytics/analyticsUtils"
import { toDate } from "../features/shared/format"
import type { DashboardRangeDays } from "../features/dashboard/types"
import { WardrobeActivitySummary } from "../features/wardrobe/components/WardrobeActivitySummary"
import { WardrobeCategoryChart } from "../features/wardrobe/components/WardrobeCategoryChart"
import { WardrobeErrorState } from "../features/wardrobe/components/WardrobeErrorState"
import { WardrobeHeader } from "../features/wardrobe/components/WardrobeHeader"
import { WardrobeItemsTable } from "../features/wardrobe/components/WardrobeItemsTable"
import { WardrobeKpiGrid } from "../features/wardrobe/components/WardrobeKpiGrid"
import { WardrobeSkeleton } from "../features/wardrobe/components/WardrobeSkeleton"
import { WardrobeTrendChart } from "../features/wardrobe/components/WardrobeTrendChart"
import { useWardrobeAnalytics } from "../features/wardrobe/hooks/useWardrobeAnalytics"
import type {
  WardrobeCategoryPoint,
  WardrobeItem,
  WardrobeTrendPoint,
} from "../features/wardrobe/types"

function matchesSearch(item: WardrobeItem, search: string) {
  const query = search.trim().toLowerCase()
  if (!query) return true

  return [
    item.userId,
    item.userDisplayName,
    item.userEmail,
    item.title,
    item.category,
    item.color,
    item.brand,
  ]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(query))
}

function buildCategoryData(items: WardrobeItem[]): WardrobeCategoryPoint[] {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1
    return acc
  }, {})

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
}

function buildTrendData(
  items: WardrobeItem[],
  range: ReturnType<typeof createDateRange>,
): WardrobeTrendPoint[] {
  return bucketByGranularity(items, (item) => toDate(item.createdAt), range).map(
    (bucket) => ({
      date: bucket.date,
      items: bucket.count,
    }),
  )
}

export default function WardrobePage() {
  const [rangeDays, setRangeDays] = useState<DashboardRangeDays>(30)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const range = useMemo(() => createDateRange(rangeDays), [rangeDays])
  const { data, error, isError, isPending } = useWardrobeAnalytics(range)

  const items = useMemo(() => data?.items ?? [], [data?.items])
  const newItems = useMemo(() => data?.newItems ?? [], [data?.newItems])
  const counts = data?.counts

  const categoryData = useMemo(() => buildCategoryData(items), [items])
  const trendData = useMemo(() => buildTrendData(newItems, range), [newItems, range])

  const categoryOptions = useMemo(
    () => categoryData.map((point) => point.name),
    [categoryData],
  )

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter
      return matchesCategory && matchesSearch(item, search)
    })
  }, [categoryFilter, items, search])

  if (isPending) return <WardrobeSkeleton />
  if (isError) return <WardrobeErrorState error={error} />

  const activeWardrobeUsers = data ? data.activeWardrobeUsers : 0
  const topCategory = categoryData[0]?.name
  const isEmpty = items.length === 0 && (counts?.wardrobe ?? 0) === 0
  const hasTrend = trendData.some((point) => point.items > 0)

  return (
    <section className="space-y-6">
      <WardrobeHeader onRangeChange={setRangeDays} rangeDays={rangeDays} />

      {isEmpty ? (
        <div className="rounded-2xl border border-dashed border-line-strong p-8 text-center">
          <p className="text-base font-bold text-ink">Henüz gardırop kaydı yok</p>
          <p className="mt-2 text-sm text-muted">
            wardrobe koleksiyon grubunda kayıt bulunamadı. Kullanıcılar uygulamada parça ekledikçe burada görünür.
          </p>
        </div>
      ) : null}

      <WardrobeKpiGrid
        activeWardrobeUsers={activeWardrobeUsers}
        newItems={newItems.length}
        savedResults={counts?.savedResults ?? 0}
        topCategory={topCategory}
        totalItems={counts?.wardrobe ?? items.length}
        wishlistItems={counts?.wishlist ?? 0}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <WardrobeTrendChart data={trendData} empty={!hasTrend} />
        <WardrobeCategoryChart data={categoryData} empty={categoryData.length === 0} />
      </div>

      <WardrobeActivitySummary
        calendar={counts?.calendar ?? 0}
        savedPhotos={counts?.savedPhotos ?? 0}
        savedResults={counts?.savedResults ?? 0}
        wardrobe={counts?.wardrobe ?? items.length}
        wishlist={counts?.wishlist ?? 0}
      />

      <WardrobeItemsTable
        categories={categoryOptions}
        categoryFilter={categoryFilter}
        items={filteredItems}
        onCategoryFilterChange={setCategoryFilter}
        onSearchChange={setSearch}
        search={search}
      />

      <p className="text-xs text-muted tabular-nums">
        Yüklenen {items.length.toLocaleString("tr-TR")} parçadan{" "}
        {filteredItems.length.toLocaleString("tr-TR")} tanesi gösteriliyor.
      </p>
    </section>
  )
}
