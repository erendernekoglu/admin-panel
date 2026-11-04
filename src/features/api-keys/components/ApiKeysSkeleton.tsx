function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface-2 ${className}`} />
}

/** Body placeholder; the route keeps its real PageHeader above it while loading. */
export function ApiKeysSkeleton() {
  return (
    <div aria-busy="true" aria-label="Yükleniyor" className="space-y-6" role="status">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="rounded-2xl border border-line bg-surface p-5" key={index}>
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="mt-3 h-8 w-16" />
            <SkeletonBlock className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>

      <SkeletonBlock className="h-10 w-full" />
      <SkeletonBlock className="h-96 w-full rounded-2xl" />
    </div>
  )
}
