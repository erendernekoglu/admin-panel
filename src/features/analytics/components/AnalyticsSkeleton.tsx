/** Mirrors a section body; the analytics header, tabs and filters stay rendered above it. */
export function AnalyticsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Analitik yükleniyor" className="space-y-6">
      <SkeletonBlock className="h-36 rounded-2xl" />

      <div className="grid gap-6 xl:grid-cols-3">
        <SkeletonBlock className="h-80 rounded-2xl xl:col-span-2" />
        <SkeletonBlock className="h-80 rounded-2xl" />
      </div>

      <SkeletonBlock className="h-72 rounded-2xl" />
    </div>
  )
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse bg-surface-2 ${className}`} />
}
