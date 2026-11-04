function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface-2 ${className}`} />
}

/** Body placeholder; the route keeps its real PageHeader above it while loading. */
export function AuditLogsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Yükleniyor" className="space-y-6" role="status">
      <SkeletonBlock className="h-28 w-full rounded-2xl" />
      <SkeletonBlock className="h-10 w-full" />
      <SkeletonBlock className="h-96 w-full rounded-2xl" />
    </div>
  )
}
