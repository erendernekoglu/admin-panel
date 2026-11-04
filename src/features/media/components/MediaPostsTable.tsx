import { Search } from "lucide-react"

import { Badge, type BadgeTone } from "../../../components/atoms/Badge/Badge"
import { Button } from "../../../components/atoms/Button"
import { Input } from "../../../components/atoms/Input"
import { Card, CardHeader } from "../../../components/molecules/Card"
import { SegmentedControl } from "../../../components/molecules/SegmentedControl"
import { toDateString } from "../../shared/format"
import { cn } from "../../../lib/utils"
import type { BlogPost } from "../types"

export type MediaStatusFilter = "all" | "published" | "draft" | "other"

interface MediaPostsTableProps {
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: MediaStatusFilter) => void
  posts: BlogPost[]
  search: string
  statusFilter: MediaStatusFilter
}

const statusOptions: Array<{ label: string; value: MediaStatusFilter }> = [
  { label: "Tümü", value: "all" },
  { label: "Yayında", value: "published" },
  { label: "Taslak", value: "draft" },
  { label: "Arşiv / bilinmeyen", value: "other" },
]

const statusBadges: Record<string, { label: string; tone: BadgeTone }> = {
  published: { label: "Yayında", tone: "success" },
  draft: { label: "Taslak", tone: "warning" },
  archived: { label: "Arşivde", tone: "neutral" },
}

const numberFormatter = new Intl.NumberFormat("tr-TR")
const th = "whitespace-nowrap px-4 py-3 text-xs font-semibold text-muted"
const td = "px-4 py-3.5 align-top"

function getAuthor(post: BlogPost) {
  return post.author.displayName || post.author.username || "Yazar bilinmiyor"
}

function StatusBadge({ status }: { status: string }) {
  const badge = statusBadges[status.toLowerCase()]
  return <Badge tone={badge?.tone ?? "neutral"}>{badge?.label ?? (status || "Bilinmiyor")}</Badge>
}

export function MediaPostsTable({
  onSearchChange,
  onStatusFilterChange,
  posts,
  search,
  statusFilter,
}: MediaPostsTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-line p-5 xl:flex-row xl:items-center xl:justify-between">
        <CardHeader
          title="Son blog yazıları"
          description="blog_posts kayıtlarının salt okunur görünümü."
        />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              aria-label="Yazılarda ara"
              className="w-full pl-9 xl:w-72"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Başlık, yazar veya kategori ara"
              value={search}
            />
          </div>
          <SegmentedControl
            label="Duruma göre filtrele"
            onChange={onStatusFilterChange}
            options={statusOptions}
            value={statusFilter}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2">
              <th className={th}>Başlık</th>
              <th className={th}>Yazar</th>
              <th className={th}>Durum</th>
              <th className={th}>Kategori</th>
              <th className={th}>Oluşturulma</th>
              <th className={th}>Yayın</th>
              <th className={cn(th, "text-right")}>Görüntülenme</th>
              <th className={cn(th, "text-right")}>Beğeni / yorum</th>
              <th className={th}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr
                className="border-b border-line last:border-0 hover:bg-surface-2/60"
                key={post.id}
              >
                <td className={cn(td, "max-w-[280px]")}>
                  <p className="truncate font-semibold text-ink">{post.title}</p>
                  <p className="mt-1 truncate font-mono text-xs text-muted">{post.id}</p>
                </td>
                <td className={td}>
                  <p className="font-medium text-ink">{getAuthor(post)}</p>
                  <p className="mt-1 text-xs text-muted">
                    {post.author.username || "—"}
                  </p>
                </td>
                <td className={td}>
                  <StatusBadge status={post.status} />
                </td>
                <td className={cn(td, "text-ink-soft")}>{post.category || "—"}</td>
                <td className={cn(td, "whitespace-nowrap text-ink-soft")}>
                  {toDateString(post.createdAt)}
                </td>
                <td className={cn(td, "whitespace-nowrap text-ink-soft")}>
                  {toDateString(post.publishedAt)}
                </td>
                <td className={cn(td, "text-right tabular-nums text-ink")}>
                  {numberFormatter.format(post.stats.views)}
                </td>
                <td className={cn(td, "text-right tabular-nums text-ink-soft")}>
                  {numberFormatter.format(post.stats.likes)} /{" "}
                  {numberFormatter.format(post.stats.comments)}
                </td>
                <td className={td}>
                  <div className="flex flex-wrap gap-1.5" title="Yakında eklenecek">
                    <Button disabled size="sm" variant="ghost">Ayrıntılar</Button>
                    <Button disabled size="sm" variant="ghost">Düzenle</Button>
                    <Button disabled size="sm" variant="ghost">Sil</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <p className="text-base font-bold text-ink">Yazı bulunamadı</p>
          <p className="mt-2 max-w-md text-sm text-muted">
            Farklı bir arama terimi deneyin veya durum filtresini “Tümü” yapın.
          </p>
        </div>
      ) : null}
    </Card>
  )
}
