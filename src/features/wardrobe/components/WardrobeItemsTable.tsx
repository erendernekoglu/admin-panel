import { Search } from "lucide-react"

import { Badge } from "../../../components/atoms/Badge/Badge"
import { Button } from "../../../components/atoms/Button"
import { Input } from "../../../components/atoms/Input"
import { Card, CardHeader } from "../../../components/molecules/Card"
import { Pagination } from "../../../components/molecules/Pagination"
import { toDateString } from "../../shared/format"
import { useClientPagination } from "../../../lib/useClientPagination"
import { cn } from "../../../lib/utils"
import type { WardrobeItem } from "../types"

interface WardrobeItemsTableProps {
  categories: string[]
  categoryFilter: string
  items: WardrobeItem[]
  onCategoryFilterChange: (value: string) => void
  onSearchChange: (value: string) => void
  search: string
}

const th = "whitespace-nowrap px-4 py-3 text-xs font-semibold text-muted"
const td = "px-4 py-3.5 align-top"
const PAGE_SIZE = 50
const numberFormatter = new Intl.NumberFormat("tr-TR")

export function WardrobeItemsTable({
  categories,
  categoryFilter,
  items,
  onCategoryFilterChange,
  onSearchChange,
  search,
}: WardrobeItemsTableProps) {
  const pagination = useClientPagination(items, PAGE_SIZE)

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-line p-5 xl:flex-row xl:items-center xl:justify-between">
        <CardHeader
          title="Gardırop örneği"
          description="Yönetici yetkisiyle alınan en fazla 500 kayıt, örnek içinde tarihe göre sıralı. Özel parça ayrıntıları bu analize dahil değildir."
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              aria-label="Gardırop kayıtlarında ara"
              className="w-full pl-9 xl:w-72"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Kullanıcı, parça veya kategori ara"
              value={search}
            />
          </div>
          <select
            aria-label="Kategori"
            className="h-10 rounded-xl border border-line-input bg-surface px-3.5 text-sm text-ink outline-none transition-[border-color,box-shadow] duration-150 hover:border-ink/30 focus:border-accent focus:ring-4 focus:ring-accent/15"
            onChange={(event) => onCategoryFilterChange(event.target.value)}
            value={categoryFilter}
          >
            <option value="all">Tüm kategoriler</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2">
              <th className={th}>Kullanıcı</th>
              <th className={th}>Parça</th>
              <th className={th}>Kategori</th>
              <th className={th}>Renk / marka</th>
              <th className={th}>Eklenme</th>
              <th className={th}>Kaynak</th>
              <th className={th}>Durum</th>
              <th className={th}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {pagination.pageItems.map((item) => (
              <tr
                className="border-b border-line last:border-0 hover:bg-surface-2/60"
                key={item.id}
              >
                <td className={td}>
                  <p className="font-semibold text-ink">
                    {item.userDisplayName || item.userEmail || "Kullanıcı bilinmiyor"}
                  </p>
                  <p className="mt-1 max-w-[220px] truncate font-mono text-xs text-muted">
                    {item.userId || "—"}
                  </p>
                  {item.userEmail ? (
                    <p className="mt-0.5 max-w-[220px] truncate text-xs text-ink-soft">
                      {item.userEmail}
                    </p>
                  ) : null}
                </td>
                <td className={cn(td, "max-w-[220px]")}>
                  <p className={cn("truncate font-semibold", item.title ? "text-ink" : "text-muted")}>
                    {item.title || "Analize dahil değil"}
                  </p>
                  <p className="mt-1 truncate font-mono text-xs text-muted">{item.id}</p>
                </td>
                <td className={td}>
                  <Badge>{item.category}</Badge>
                </td>
                <td className={cn(td, "text-ink-soft")}>
                  {[item.color, item.brand].filter(Boolean).join(" / ") || "—"}
                </td>
                <td className={cn(td, "whitespace-nowrap text-ink-soft")}>
                  {toDateString(item.createdAt)}
                </td>
                <td className={cn(td, "text-ink-soft")}>{item.source || "—"}</td>
                <td className={cn(td, "text-ink-soft")}>{item.status || "—"}</td>
                <td className={td}>
                  <div className="flex flex-wrap gap-1.5" title="Yakında eklenecek">
                    <Button disabled size="sm" variant="ghost">Ayrıntılar</Button>
                    <Button disabled size="sm" variant="ghost">Kaldır</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.isPaginated ? (
        <div className="border-t border-line px-5 py-4">
          <Pagination
            hasNext={pagination.hasNext}
            hasPrevious={pagination.hasPrevious}
            onNext={pagination.goNext}
            onPrevious={pagination.goPrevious}
            page={pagination.page + 1}
            pageCount={pagination.pageCount}
            summary={`${numberFormatter.format(pagination.start + 1)}–${numberFormatter.format(pagination.start + pagination.pageItems.length)} / ${numberFormatter.format(items.length)} parça`}
          />
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <p className="text-base font-bold text-ink">Parça bulunamadı</p>
          <p className="mt-2 max-w-md text-sm text-muted">
            Farklı bir arama terimi, kategori veya dönem seçmeyi deneyin.
          </p>
        </div>
      ) : null}
    </Card>
  )
}
