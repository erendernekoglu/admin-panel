function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-surface-2 ${className}`} />
}

/** Body placeholder; the page header stays rendered while data loads. */
export function RedeemCodesSkeleton() {
  return (
    <div aria-busy="true" aria-label="Hediye kodları yükleniyor" className="space-y-6">
      <SkeletonBlock className="h-28 w-full" />
      <div className="flex flex-wrap gap-3">
        <SkeletonBlock className="h-10 w-full max-w-sm rounded-xl" />
        <SkeletonBlock className="h-10 w-36 rounded-xl" />
        <SkeletonBlock className="h-10 w-36 rounded-xl" />
      </div>
      <SkeletonBlock className="h-96 w-full" />
    </div>
  )
}
