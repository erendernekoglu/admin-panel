import { useMemo, useState } from "react"

import { MediaEngagementSummary } from "../features/media/components/MediaEngagementSummary"
import { MediaErrorState } from "../features/media/components/MediaErrorState"
import { MediaHeader } from "../features/media/components/MediaHeader"
import { MediaKpiGrid } from "../features/media/components/MediaKpiGrid"
import { MediaPostsTable } from "../features/media/components/MediaPostsTable"
import type { MediaStatusFilter } from "../features/media/components/MediaPostsTable"
import { MediaPublishingChart } from "../features/media/components/MediaPublishingChart"
import type { MediaPublishingPoint } from "../features/media/components/MediaPublishingChart"
import { MediaSkeleton } from "../features/media/components/MediaSkeleton"
import { useMediaAnalytics } from "../features/media/hooks/useMediaAnalytics"
import type { BlogPost } from "../features/media/types"
import { toDate } from "../features/shared/format"

function getStatusCategory(status: string): MediaStatusFilter {
  const normalized = status.toLowerCase()
  if (normalized === "published") return "published"
  if (normalized === "draft") return "draft"
  return "other"
}

function matchesSearch(post: BlogPost, search: string) {
  const query = search.trim().toLowerCase()
  if (!query) return true

  return [
    post.title,
    post.author.displayName,
    post.author.username,
    post.category,
  ]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(query))
}

function buildPublishingTrend(posts: BlogPost[]): MediaPublishingPoint[] {
  const formatter = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  })

  const counts = posts.reduce<Map<string, { date: Date; posts: number }>>(
    (acc, post) => {
      const date = toDate(post.publishedAt) ?? toDate(post.createdAt)
      if (!date) return acc

      const key = date.toISOString().slice(0, 10)
      const current = acc.get(key)
      acc.set(key, {
        date,
        posts: (current?.posts ?? 0) + 1,
      })
      return acc
    },
    new Map(),
  )

  return [...counts.values()]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-14)
    .map((item) => ({
      date: formatter.format(item.date),
      posts: item.posts,
    }))
}

export default function MediaPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<MediaStatusFilter>("all")
  const { data, error, isError, isPending } = useMediaAnalytics()

  const posts = useMemo(() => data?.posts ?? [], [data?.posts])
  const notifications = data?.summary.totalNotifications ?? 0
  const comments = data?.summary.totalComments ?? 0
  const follows = data?.summary.totalFollows ?? 0

  const metrics = useMemo(() => {
    const publishedPosts = posts.filter(
      (post) => getStatusCategory(post.status) === "published",
    ).length
    const draftPosts = posts.filter(
      (post) => getStatusCategory(post.status) === "draft",
    ).length
    const views = posts.reduce((sum, post) => sum + post.stats.views, 0)
    const likes = posts.reduce((sum, post) => sum + post.stats.likes, 0)
    const bookmarks = posts.reduce((sum, post) => sum + post.stats.bookmarks, 0)
    const postCommentStats = posts.reduce(
      (sum, post) => sum + post.stats.comments,
      0,
    )

    return {
      bookmarks,
      comments,
      draftPosts,
      engagementTotal: views + likes + comments + bookmarks + follows,
      follows,
      likes,
      notifications,
      postCommentStats,
      publishedPosts,
      totalPosts: posts.length,
      views,
    }
  }, [comments, follows, notifications, posts])

  const publishingTrend = useMemo(() => buildPublishingTrend(posts), [posts])

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const status = getStatusCategory(post.status)
      const matchesStatus = statusFilter === "all" || status === statusFilter
      return matchesStatus && matchesSearch(post, search)
    })
  }, [posts, search, statusFilter])

  if (isPending) return <MediaSkeleton />
  if (isError) return <MediaErrorState error={error} />

  const isEmpty = posts.length === 0
  const hasPublishingTrend = publishingTrend.some((point) => point.posts > 0)

  return (
    <section className="space-y-6">
      <MediaHeader />

      {isEmpty ? (
        <div className="rounded-2xl border border-dashed border-line-strong p-8 text-center">
          <p className="text-base font-bold text-ink">Henüz blog yazısı yok</p>
          <p className="mt-2 text-sm text-muted">
            blog_posts koleksiyonunda kayıt bulunamadı. Uygulamadan ilk yazı yayımlandığında burada görünür.
          </p>
        </div>
      ) : null}

      <MediaKpiGrid
        comments={comments}
        draftPosts={metrics.draftPosts}
        engagementTotal={metrics.engagementTotal}
        follows={follows}
        notifications={metrics.notifications}
        publishedPosts={metrics.publishedPosts}
        totalPosts={metrics.totalPosts}
      />

      <MediaPublishingChart
        data={publishingTrend}
        empty={!hasPublishingTrend}
      />

      <MediaEngagementSummary
        bookmarks={metrics.bookmarks}
        comments={comments || metrics.postCommentStats}
        follows={follows}
        likes={metrics.likes}
        views={metrics.views}
      />

      <MediaPostsTable
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        posts={filteredPosts}
        search={search}
        statusFilter={statusFilter}
      />

      <p className="text-xs text-muted tabular-nums">
        {data?.summary.totalPosts.toLocaleString("tr-TR") ?? "0"} blog yazısından{" "}
        {filteredPosts.length.toLocaleString("tr-TR")} tanesi gösteriliyor
        {data?.sample.truncated ? " (tablo en yeni 500 kayıtla sınırlıdır)." : "."}
      </p>
    </section>
  )
}
