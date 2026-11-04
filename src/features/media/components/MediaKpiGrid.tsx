import {
  Bell,
  FileText,
  MessageSquare,
  Newspaper,
  PencilLine,
  Sparkles,
  Users,
} from "lucide-react"

import { MediaKpiCard } from "./MediaKpiCard"

interface MediaKpiGridProps {
  comments: number
  draftPosts: number
  engagementTotal: number
  follows: number
  notifications: number
  publishedPosts: number
  totalPosts: number
}

const numberFormatter = new Intl.NumberFormat("tr-TR")

function formatNumber(value: number) {
  return numberFormatter.format(value)
}

export function MediaKpiGrid({
  comments,
  draftPosts,
  engagementTotal,
  follows,
  notifications,
  publishedPosts,
  totalPosts,
}: MediaKpiGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-7">
      <MediaKpiCard
        helper="blog_posts koleksiyonundaki kayıtlar"
        icon={Newspaper}
        label="Toplam yazı"
        value={formatNumber(totalPosts)}
      />
      <MediaKpiCard
        helper="Durumu yayında olan yazılar"
        icon={Sparkles}
        label="Yayında"
        value={formatNumber(publishedPosts)}
      />
      <MediaKpiCard
        helper="Durumu taslak olan yazılar"
        icon={PencilLine}
        label="Taslak"
        value={formatNumber(draftPosts)}
      />
      <MediaKpiCard
        helper="Son blog bildirim kayıtları"
        icon={Bell}
        label="Bildirimler"
        value={formatNumber(notifications)}
      />
      <MediaKpiCard
        helper="blog_comments sayısı"
        icon={MessageSquare}
        label="Yorumlar"
        value={formatNumber(comments)}
      />
      <MediaKpiCard
        helper="blog_follows sayısı"
        icon={Users}
        label="Takipler"
        value={formatNumber(follows)}
      />
      <MediaKpiCard
        helper="Görüntülenme, beğeni, yorum, kaydetme ve takip"
        icon={FileText}
        label="Toplam etkileşim"
        value={formatNumber(engagementTotal)}
      />
    </div>
  )
}
