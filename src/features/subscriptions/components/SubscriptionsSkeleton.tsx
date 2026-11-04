/** Body placeholder; the page header stays rendered while data loads. */
export function SubscriptionsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Abonelik verileri yükleniyor" className="space-y-6">
      <SkeletonBlock className="h-28 rounded-2xl" />
      <SkeletonBlock className="h-80 rounded-2xl" />
      <SkeletonBlock className="h-96 rounded-2xl" />
    </div>
  )
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse bg-surface-2 ${className}`} />
}
