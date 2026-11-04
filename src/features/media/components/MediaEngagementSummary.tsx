import { Bookmark, Eye, Heart, MessageSquare, Users } from "lucide-react"

import { Card, CardHeader } from "../../../components/molecules/Card"

interface MediaEngagementSummaryProps {
  bookmarks: number
  comments: number
  follows: number
  likes: number
  views: number
}

const numberFormatter = new Intl.NumberFormat("tr-TR")

export function MediaEngagementSummary({
  bookmarks,
  comments,
  follows,
  likes,
  views,
}: MediaEngagementSummaryProps) {
  const items = [
    { icon: Eye, label: "Görüntülenme", value: views },
    { icon: Heart, label: "Beğeni", value: likes },
    { icon: MessageSquare, label: "Yorum", value: comments },
    { icon: Bookmark, label: "Kaydetme", value: bookmarks },
    { icon: Users, label: "Takip", value: follows },
  ]

  return (
    <Card tone="quiet" className="p-5">
      <CardHeader
        title="Etkileşim özeti"
        description="Yazı istatistikleri ve koleksiyon sayılarından toplanan blog etkileşimi."
      />
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 xl:grid-cols-5">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-sm font-medium text-ink-soft">
              <Icon aria-hidden="true" className="size-4 text-muted" />
              {label}
            </dt>
            <dd className="mt-1.5 text-2xl font-extrabold tracking-tight tabular-nums text-ink">
              {numberFormatter.format(value)}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
