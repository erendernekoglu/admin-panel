/** Mirrors the dashboard body; the page header stays rendered above it. */
export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Genel bakış yükleniyor" className="space-y-6">
      <SkeletonBlock className="h-40 rounded-2xl" />

      <div className="grid gap-6 lg:grid-cols-12">
        <SkeletonBlock className="h-80 rounded-2xl lg:col-span-8" />
        <SkeletonBlock className="h-80 rounded-2xl lg:col-span-4" />
      </div>

      <SkeletonBlock className="h-72 rounded-2xl" />

      <div className="grid gap-6 lg:grid-cols-12">
        <SkeletonBlock className="h-80 rounded-2xl lg:col-span-7" />
        <SkeletonBlock className="h-80 rounded-2xl lg:col-span-5" />
      </div>
    </div>
  )
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse bg-surface-2 ${className}`} />
}
